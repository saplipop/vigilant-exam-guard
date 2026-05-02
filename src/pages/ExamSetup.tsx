import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Mic, Wifi, CheckCircle, XCircle, Shield, Loader2 } from "lucide-react";

export default function ExamSetup() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [camera, setCamera] = useState<"checking" | "granted" | "denied">("checking");
  const [mic, setMic] = useState<"checking" | "granted" | "denied">("checking");
  const [internet, setInternet] = useState<"checking" | "good" | "slow">("checking");
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    checkPermissions();
    checkInternet();
    return () => { stream?.getTracks().forEach(t => t.stop()); };
  }, []);

  async function checkPermissions() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setCamera("granted");
      setMic("granted");
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch {
      setCamera("denied");
      setMic("denied");
    }
  }

  async function checkInternet() {
    const start = Date.now();
    try {
      await fetch("https://www.google.com/favicon.ico", { mode: "no-cors", cache: "no-store" });
      const elapsed = Date.now() - start;
      setInternet(elapsed < 2000 ? "good" : "slow");
    } catch {
      setInternet("slow");
    }
  }

  const allReady = camera === "granted" && mic === "granted" && internet === "good";

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "checking") return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
    if (status === "granted" || status === "good") return <CheckCircle className="h-5 w-5 text-accent" />;
    return <XCircle className="h-5 w-5 text-destructive" />;
  };

  return (
    <div className="dark min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <div className="gradient-primary p-3 rounded-xl glow-primary"><Shield className="h-6 w-6 text-primary-foreground" /></div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pre-Exam Setup</h1>
            <p className="text-muted-foreground">Verify your environment before starting</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="glass-card md:row-span-3">
            <CardHeader><CardTitle className="text-sm">Camera Preview</CardTitle></CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                {camera !== "granted" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Camera className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {[
            { label: "Camera", icon: Camera, status: camera, desc: camera === "granted" ? "Camera access granted" : "Camera permission required" },
            { label: "Microphone", icon: Mic, status: mic, desc: mic === "granted" ? "Microphone access granted" : "Microphone permission required" },
            { label: "Internet", icon: Wifi, status: internet, desc: internet === "good" ? "Connection stable" : internet === "slow" ? "Connection slow" : "Checking..." },
          ].map(item => (
            <Card key={item.label} className="glass-card">
              <CardContent className="flex items-center gap-4 p-4">
                <item.icon className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <StatusIcon status={item.status} />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={() => navigate("/dashboard")} className="flex-1">Cancel</Button>
          <Button
            className="flex-1 gradient-primary text-primary-foreground"
            disabled={!allReady}
            onClick={() => { stream?.getTracks().forEach(t => t.stop()); navigate(`/exam/${examId}`); }}
          >
            {allReady ? "Start Exam" : "Setup Required"}
          </Button>
        </div>
      </div>
    </div>
  );
}
