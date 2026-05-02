import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Camera, Brain, BarChart3, Lock, Eye } from "lucide-react";

export default function Index() {
  const { user, loading, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate(role === "admin" ? "/admin" : "/dashboard");
    }
  }, [user, loading, role]);

  return (
    <div className="dark min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
        <div className="container relative py-24 text-center">
          <div className="inline-flex items-center gap-2 gradient-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-medium mb-6 glow-primary animate-fade-in">
            <Shield className="h-4 w-4" /> AI-Powered Proctoring
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-foreground mb-6 animate-fade-in tracking-tight">
            Secure Online<br />Exam Proctoring
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in">
            Advanced AI-based cheating detection with real-time monitoring, face tracking, audio analysis, and automated risk scoring. Ensure exam integrity with ProctorAI.
          </p>
          <div className="flex gap-4 justify-center animate-fade-in">
            <Button size="lg" className="gradient-primary text-primary-foreground glow-primary text-base px-8" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container py-20">
        <h2 className="text-3xl font-bold text-foreground text-center mb-12">How It Works</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Camera, title: "Face Detection", desc: "Real-time face tracking detects multiple faces, face absence, and head pose changes using computer vision." },
            { icon: Eye, title: "Eye & Gaze Tracking", desc: "Monitors gaze direction to detect students looking away from the screen during the exam." },
            { icon: Brain, title: "Audio Monitoring", desc: "Detects multiple voices and unusual noise levels using the Web Audio API for ambient sound analysis." },
            { icon: Lock, title: "Tab & Copy Protection", desc: "Prevents tab switching, copy-paste, and right-click. Enforces fullscreen mode throughout the exam." },
            { icon: BarChart3, title: "Risk Scoring Engine", desc: "Real-time risk score calculation with weighted violations. Auto-submission when threshold is exceeded." },
            { icon: Shield, title: "Admin Monitoring", desc: "Live dashboard showing student webcam feeds, risk scores, and violation timelines in real-time." },
          ].map((f, i) => (
            <Card key={i} className="glass-card hover:border-primary/50 transition-all duration-300 animate-fade-in group" style={{ animationDelay: `${i * 100}ms` }}>
              <CardContent className="p-6">
                <div className="gradient-primary p-3 rounded-xl w-fit mb-4 group-hover:glow-primary transition-all">
                  <f.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>&copy; 2026 ProctorAI. AI-Powered Exam Proctoring Platform.</p>
        </div>
      </footer>
    </div>
  );
}
