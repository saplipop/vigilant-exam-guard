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
  looking_away: 5,
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

// Simple face detection using canvas brightness analysis
export function setupFaceDetection(video: HTMLVideoElement, onViolation: (v: Violation) => void) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  let lastAlert = 0;
  let noFaceCount = 0;

  const interval = setInterval(() => {
    if (video.readyState < 2) return;
    canvas.width = 320;
    canvas.height = 240;
    ctx.drawImage(video, 0, 0, 320, 240);
    const imageData = ctx.getImageData(0, 0, 320, 240);
    const data = imageData.data;

    // Simple skin color detection in center region
    let skinPixels = 0;
    const totalPixels = 80 * 60;
    const startX = 120, startY = 60, endX = 200, endY = 120;

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const i = (y * 320 + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        if (r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15 && r - b > 15) {
          skinPixels++;
        }
      }
    }

    const skinRatio = skinPixels / totalPixels;

    if (skinRatio < 0.05) {
      noFaceCount++;
      if (noFaceCount > 5 && Date.now() - lastAlert > 10000) {
        lastAlert = Date.now();
        noFaceCount = 0;
        onViolation({ type: "face_not_detected", severity: VIOLATION_SCORES.face_not_detected, description: "No face detected in camera frame", timestamp: new Date() });
      }
    } else {
      noFaceCount = 0;
    }

    // Check if face is off-center (looking away)
    if (skinRatio > 0.05) {
      let leftSkin = 0, rightSkin = 0;
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < 160; x++) {
          const i = (y * 320 + x) * 4;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          if (r > 95 && g > 40 && b > 20 && r > g && r > b) leftSkin++;
        }
        for (let x = 160; x < endX; x++) {
          const i = (y * 320 + x) * 4;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          if (r > 95 && g > 40 && b > 20 && r > g && r > b) rightSkin++;
        }
      }
      const balance = leftSkin / (rightSkin + 1);
      if ((balance > 3 || balance < 0.33) && Date.now() - lastAlert > 8000) {
        lastAlert = Date.now();
        onViolation({ type: "looking_away", severity: VIOLATION_SCORES.looking_away, description: "Student appears to be looking away from screen", timestamp: new Date() });
      }
    }
  }, 1000);

  return () => clearInterval(interval);
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
