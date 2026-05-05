export interface Violation {
  type: string;
  severity: number;
  description: string;
  timestamp: Date;
}

export const VIOLATION_SCORES: Record<string, number> = {
  tab_switch: 10,
  face_not_detected: 15,
  multiple_faces: 25,
  looking_away: 8,
  looking_left: 8,
  looking_right: 8,
  looking_down: 8,
  noise_detected: 10,
  copy_paste: 5,
  right_click: 3,
  fullscreen_exit: 15,
};

// Tab switch detection
export function setupTabSwitchDetection(onViolation: (v: Violation) => void) {
  const handler = () => {
    if (document.visibilityState === "hidden") {
      onViolation({ type: "tab_switch", severity: VIOLATION_SCORES.tab_switch, description: "Student switched to another tab", timestamp: new Date() });
    }
  };
  const blurHandler = () => {
    onViolation({ type: "tab_switch", severity: VIOLATION_SCORES.tab_switch, description: "Browser window lost focus", timestamp: new Date() });
  };
  document.addEventListener("visibilitychange", handler);
  window.addEventListener("blur", blurHandler);
  return () => { document.removeEventListener("visibilitychange", handler); window.removeEventListener("blur", blurHandler); };
}

// Copy-paste prevention
export function setupCopyPastePrevention(onViolation: (v: Violation) => void) {
  const contextMenu = (e: Event) => { e.preventDefault(); onViolation({ type: "right_click", severity: VIOLATION_SCORES.right_click, description: "Right-click attempted", timestamp: new Date() }); };
  const keydown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && ["c", "v", "a", "x"].includes(e.key.toLowerCase())) {
      e.preventDefault();
      onViolation({ type: "copy_paste", severity: VIOLATION_SCORES.copy_paste, description: `Copy/paste shortcut: Ctrl+${e.key.toUpperCase()}`, timestamp: new Date() });
    }
    if (e.ctrlKey && e.key === "Tab") {
      e.preventDefault();
      onViolation({ type: "tab_switch", severity: VIOLATION_SCORES.tab_switch, description: "Ctrl+Tab attempted", timestamp: new Date() });
    }
  };
  document.addEventListener("contextmenu", contextMenu);
  document.addEventListener("keydown", keydown);
  return () => { document.removeEventListener("contextmenu", contextMenu); document.removeEventListener("keydown", keydown); };
}

// Audio monitoring
export function setupAudioMonitoring(onViolation: (v: Violation) => void) {
  let ctx: AudioContext | null = null;
  let animFrame: number;
  let lastAlert = 0;

  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    const check = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      if (avg > 40 && Date.now() - lastAlert > 5000) {
        lastAlert = Date.now();
        onViolation({ type: "noise_detected", severity: VIOLATION_SCORES.noise_detected, description: `High ambient noise level detected (${Math.round(avg)}dB)`, timestamp: new Date() });
      }
      animFrame = requestAnimationFrame(check);
    };
    check();
  }).catch(() => {});

  return () => { cancelAnimationFrame(animFrame); ctx?.close(); };
}

// MediaPipe Face Mesh based eye/gaze detection
export function setupFaceMeshDetection(video: HTMLVideoElement, onViolation: (v: Violation) => void) {
  let lastAlert = 0;
  let noFaceCount = 0;
  let running = true;

  // Sustained gaze tracking: only trigger after 2-3 seconds of continuous deviation
  let gazeDeviationStart = 0;
  let gazeDeviationType = "";
  const GAZE_THRESHOLD_MS = 2500; // 2.5 seconds sustained

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  // Use simple skin-color + head position detection as fallback
  // MediaPipe CDN loaded asynchronously
  let faceMeshReady = false;
  let faceMesh: any = null;

  // Try to load MediaPipe Face Mesh from CDN
  const loadMediaPipe = async () => {
    try {
      // Dynamically load MediaPipe scripts
      const loadScript = (src: string) => new Promise<void>((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const s = document.createElement("script");
        s.src = src;
        s.onload = () => resolve();
        s.onerror = reject;
        document.head.appendChild(s);
      });

      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js");
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");

      const FaceMesh = (window as any).FaceMesh;
      if (!FaceMesh) return;

      faceMesh = new FaceMesh({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 2,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults((results: any) => {
        if (!running) return;
        processResults(results);
      });

      faceMeshReady = true;
      startDetection();
    } catch {
      // Fallback to canvas-based detection
      startFallbackDetection();
    }
  };

  const processResults = (results: any) => {
    const now = Date.now();
    if (now - lastAlert < 3000) return;

    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      noFaceCount++;
      if (noFaceCount > 5) {
        lastAlert = now;
        noFaceCount = 0;
        onViolation({ type: "face_not_detected", severity: VIOLATION_SCORES.face_not_detected, description: "No face detected in camera frame", timestamp: new Date() });
      }
      return;
    }

    noFaceCount = 0;

    if (results.multiFaceLandmarks.length > 1) {
      lastAlert = now;
      onViolation({ type: "multiple_faces", severity: VIOLATION_SCORES.multiple_faces, description: "Multiple faces detected in frame", timestamp: new Date() });
      return;
    }

    const landmarks = results.multiFaceLandmarks[0];
    if (!landmarks || landmarks.length < 468) return;

    // Nose tip (landmark 1) position for head direction
    const noseTip = landmarks[1];
    // Left eye outer (landmark 33), Right eye outer (landmark 263)
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];

    // Iris landmarks (468-477 with refineLandmarks)
    // Left iris center: 468, Right iris center: 473
    const leftIris = landmarks[468];
    const rightIris = landmarks[473];

    if (leftIris && rightIris && leftEye && rightEye) {
      // Calculate gaze direction based on iris position relative to eye corners
      const leftEyeInner = landmarks[133];
      const rightEyeInner = landmarks[362];

      // Horizontal gaze: check if iris is too far left or right within the eye
      const leftGazeRatio = (leftIris.x - leftEye.x) / (leftEyeInner.x - leftEye.x + 0.001);
      const rightGazeRatio = (rightIris.x - rightEyeInner.x) / (rightEye.x - rightEyeInner.x + 0.001);

      const avgGaze = (leftGazeRatio + rightGazeRatio) / 2;

      if (avgGaze < 0.2) {
        lastAlert = now;
        onViolation({ type: "looking_left", severity: VIOLATION_SCORES.looking_left, description: "Student is looking to the left", timestamp: new Date() });
        return;
      }
      if (avgGaze > 0.8) {
        lastAlert = now;
        onViolation({ type: "looking_right", severity: VIOLATION_SCORES.looking_right, description: "Student is looking to the right", timestamp: new Date() });
        return;
      }
    }

    // Vertical check: if nose tip is too low, looking down
    if (noseTip.y > 0.7) {
      lastAlert = now;
      onViolation({ type: "looking_down", severity: VIOLATION_SCORES.looking_down, description: "Student appears to be looking down", timestamp: new Date() });
      return;
    }

    // Head turned too far (nose tip off center)
    if (noseTip.x < 0.3 || noseTip.x > 0.7) {
      lastAlert = now;
      onViolation({ type: "looking_away", severity: VIOLATION_SCORES.looking_away, description: "Student's head is turned away from screen", timestamp: new Date() });
    }
  };

  const startDetection = () => {
    if (!faceMeshReady || !faceMesh) return;

    const sendFrame = async () => {
      if (!running || !faceMesh) return;
      if (video.readyState >= 2) {
        await faceMesh.send({ image: video });
      }
      if (running) setTimeout(sendFrame, 1000);
    };
    sendFrame();
  };

  // Fallback: simple canvas-based detection
  const startFallbackDetection = () => {
    const interval = setInterval(() => {
      if (!running || video.readyState < 2) return;
      canvas.width = 320;
      canvas.height = 240;
      ctx.drawImage(video, 0, 0, 320, 240);
      const imageData = ctx.getImageData(0, 0, 320, 240);
      const data = imageData.data;

      let skinPixels = 0;
      const totalPixels = 80 * 60;
      for (let y = 60; y < 120; y++) {
        for (let x = 120; x < 200; x++) {
          const i = (y * 320 + x) * 4;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          if (r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15 && r - b > 15) {
            skinPixels++;
          }
        }
      }

      const skinRatio = skinPixels / totalPixels;
      const now = Date.now();

      if (skinRatio < 0.05) {
        noFaceCount++;
        if (noFaceCount > 5 && now - lastAlert > 10000) {
          lastAlert = now;
          noFaceCount = 0;
          onViolation({ type: "face_not_detected", severity: VIOLATION_SCORES.face_not_detected, description: "No face detected in camera frame", timestamp: new Date() });
        }
      } else {
        noFaceCount = 0;
      }
    }, 1000);

    return () => clearInterval(interval);
  };

  loadMediaPipe();

  return () => {
    running = false;
    faceMesh?.close?.();
  };
}

// Fullscreen enforcement
export function requestFullscreen() {
  document.documentElement.requestFullscreen?.().catch(() => {});
}

export function setupFullscreenDetection(onViolation: (v: Violation) => void) {
  const handler = () => {
    if (!document.fullscreenElement) {
      onViolation({ type: "fullscreen_exit", severity: VIOLATION_SCORES.fullscreen_exit, description: "Student exited fullscreen mode", timestamp: new Date() });
    }
  };
  document.addEventListener("fullscreenchange", handler);
  return () => document.removeEventListener("fullscreenchange", handler);
}
