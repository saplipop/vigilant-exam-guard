import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Clock, ChevronLeft, ChevronRight, Send, Camera, Shield } from "lucide-react";
import {
  Violation, setupTabSwitchDetection, setupCopyPastePrevention,
  setupAudioMonitoring, setupFaceDetection, setupFullscreenDetection,
  requestFullscreen,
} from "@/lib/cheatingDetection";

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  marks: number;
  order_num: number;
}

interface Exam {
  id: string;
  title: string;
  duration_minutes: number;
  total_marks: number;
}

export default function ExamRoom() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [riskScore, setRiskScore] = useState(0);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [terminated, setTerminated] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const RISK_THRESHOLD = 100;

  useEffect(() => {
    loadExam();
    requestFullscreen();
  }, []);

  useEffect(() => {
    if (!sessionId || !videoRef.current) return;

    const cleanups = [
      setupTabSwitchDetection(handleViolation),
      setupCopyPastePrevention(handleViolation),
      setupAudioMonitoring(handleViolation),
      setupFullscreenDetection(handleViolation),
    ];

    // Setup camera
    navigator.mediaDevices.getUserMedia({ video: true }).then(s => {
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
      cleanups.push(setupFaceDetection(videoRef.current!, handleViolation));
    });

    return () => { cleanups.forEach(c => c()); streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, [sessionId]);

  useEffect(() => {
    if (timeLeft <= 0 || terminated) return;
    const t = setInterval(() => setTimeLeft(p => {
      if (p <= 1) { submitExam(); return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [timeLeft, terminated]);

  async function loadExam() {
    if (!examId || !user) return;
    const [examRes, qRes] = await Promise.all([
      supabase.from("exams").select("*").eq("id", examId).single(),
      supabase.from("questions").select("*").eq("exam_id", examId).order("order_num"),
    ]);
    if (examRes.data) {
      setExam(examRes.data);
      setTimeLeft(examRes.data.duration_minutes * 60);
    }
    if (qRes.data) setQuestions(qRes.data.map(q => ({ ...q, options: q.options ? (q.options as any) : null })));

    // Create session
    const { data: session } = await supabase.from("exam_sessions")
      .insert({ exam_id: examId, student_id: user.id, status: "in_progress", started_at: new Date().toISOString() })
      .select().single();
    if (session) setSessionId(session.id);
  }

  const handleViolation = useCallback((v: Violation) => {
    setViolations(prev => [...prev, v]);
    setRiskScore(prev => {
      const newScore = prev + v.severity;
      if (newScore >= RISK_THRESHOLD) {
        setTerminated(true);
        submitExam(true);
      } else if (newScore >= RISK_THRESHOLD * 0.7) {
        setShowWarning(true);
      }
      return newScore;
    });

    // Log to database
    if (sessionId) {
      supabase.from("violations").insert({ session_id: sessionId, violation_type: v.type, severity: v.severity, description: v.description });
      supabase.from("exam_sessions").update({ risk_score: riskScore + v.severity }).eq("id", sessionId);
    }

    toast({
      title: "⚠️ Violation Detected",
      description: v.description,
      variant: "destructive",
    });
  }, [sessionId, riskScore]);

  async function submitExam(auto = false) {
    if (!sessionId) return;
    streamRef.current?.getTracks().forEach(t => t.stop());
    document.exitFullscreen?.().catch(() => {});

    await supabase.from("exam_sessions").update({
      status: auto ? "terminated" : "completed",
      completed_at: new Date().toISOString(),
      answers,
      risk_score: riskScore,
    }).eq("id", sessionId);

    navigate("/dashboard");
    toast({
      title: auto ? "Exam Terminated" : "Exam Submitted",
      description: auto ? "Your exam was auto-submitted due to excessive violations." : "Your exam has been submitted successfully.",
      variant: auto ? "destructive" : "default",
    });
  }

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const q = questions[currentQ];

  if (terminated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="glass-card max-w-md text-center p-8">
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Exam Terminated</h2>
          <p className="text-muted-foreground mb-4">Your exam has been automatically terminated due to excessive suspicious activity.</p>
          <p className="text-lg font-semibold text-destructive mb-6">Risk Score: {riskScore}</p>
          <Button onClick={() => navigate("/dashboard")} className="gradient-primary text-primary-foreground">Return to Dashboard</Button>
        </Card>
      </div>
    );
  }

  if (!exam || !q) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-background select-none">
      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 z-50 bg-background/80 flex items-center justify-center p-4">
          <Card className="glass-card max-w-md border-destructive animate-scale-in">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Warning!</h3>
              <p className="text-muted-foreground mb-2">Multiple violations have been detected. Continued suspicious behavior will result in automatic exam termination.</p>
              <p className="text-lg font-semibold text-warning mb-4">Current Risk Score: {riskScore}/{RISK_THRESHOLD}</p>
              <Button onClick={() => { setShowWarning(false); requestFullscreen(); }} className="gradient-primary text-primary-foreground">
                I Understand, Continue Exam
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Bar */}
      <div className="glass-card border-b border-border px-4 py-2 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground text-sm">{exam.title}</span>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={riskScore > 50 ? "destructive" : "secondary"} className="text-xs">
            Risk: {riskScore}
          </Badge>
          <div className="flex items-center gap-2 text-sm font-mono">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className={timeLeft < 300 ? "text-destructive font-bold" : "text-foreground"}>{formatTime(timeLeft)}</span>
          </div>
          <div className="relative w-20 h-14 rounded-lg overflow-hidden border border-border">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute top-1 right-1"><Camera className="h-3 w-3 text-accent" /></div>
          </div>
        </div>
      </div>

      {/* Risk Score Bar */}
      <div className="px-4 py-1 bg-muted/50">
        <Progress value={(riskScore / RISK_THRESHOLD) * 100} className="h-1" />
      </div>

      {/* Main Content */}
      <div className="container max-w-4xl py-6">
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-muted-foreground">Question {currentQ + 1} of {questions.length}</span>
          <Badge variant="outline">{q.marks} marks</Badge>
        </div>

        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle className="text-lg leading-relaxed">{q.question_text}</CardTitle>
          </CardHeader>
          <CardContent>
            {q.question_type === "mcq" && q.options ? (
              <div className="space-y-3">
                {q.options.map((opt, i) => (
                  <button
                    key={i}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      answers[q.id] === opt
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border hover:border-primary/50 text-foreground"
                    }`}
                    onClick={() => setAnswers(p => ({ ...p, [q.id]: opt }))}
                  >
                    <span className="font-medium text-muted-foreground mr-3">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <Textarea
                placeholder="Type your answer here..."
                value={answers[q.id] || ""}
                onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))}
                className="min-h-[200px] bg-muted/50"
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" disabled={currentQ === 0} onClick={() => setCurrentQ(p => p - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>

          <div className="flex gap-1">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                className={`w-8 h-8 rounded-md text-xs font-medium transition-all ${
                  i === currentQ ? "gradient-primary text-primary-foreground" :
                  answers[questions[i].id] ? "bg-accent text-accent-foreground" :
                  "bg-muted text-muted-foreground hover:bg-secondary"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {currentQ < questions.length - 1 ? (
            <Button onClick={() => setCurrentQ(p => p + 1)} className="gradient-primary text-primary-foreground">
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={() => submitExam()} className="gradient-success text-accent-foreground">
              <Send className="h-4 w-4 mr-1" /> Submit
            </Button>
          )}
        </div>

        {/* Violations Log */}
        {violations.length > 0 && (
          <Card className="glass-card mt-6 border-warning/30">
            <CardHeader><CardTitle className="text-sm text-warning flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Recent Violations ({violations.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {violations.slice(-5).reverse().map((v, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">{v.description}</span>
                    <Badge variant="destructive" className="text-[10px]">+{v.severity}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
