import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, Award, AlertTriangle, Clock, CheckCircle, XCircle } from "lucide-react";

interface Violation {
  id: string;
  violation_type: string;
  severity: number;
  description: string | null;
  created_at: string;
}

export default function ExamResult() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [violations, setViolations] = useState<Violation[]>([]);

  useEffect(() => {
    if (!sessionId) return;
    loadResult();
  }, [sessionId]);

  async function loadResult() {
    const [sessRes, violRes] = await Promise.all([
      supabase.from("exam_sessions").select("*, exams:exam_id(title, total_marks, passing_marks)").eq("id", sessionId).single(),
      supabase.from("violations").select("*").eq("session_id", sessionId!).order("created_at"),
    ]);
    if (sessRes.data) setSession(sessRes.data);
    if (violRes.data) setViolations(violRes.data);
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const exam = session.exams as any;
  const totalMarks = exam?.total_marks || 100;
  const passingMarks = exam?.passing_marks || 40;
  const score = session.score ?? 0;
  const passed = score >= passingMarks && session.status !== "terminated";

  const getStatusInfo = () => {
    if (session.status === "terminated") return { label: "Terminated due to cheating", color: "bg-destructive text-destructive-foreground", icon: XCircle };
    if (session.risk_score > 50) return { label: "Suspicious Attempt", color: "bg-warning text-warning-foreground", icon: AlertTriangle };
    return { label: "Valid Attempt", color: "bg-accent text-accent-foreground", icon: CheckCircle };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <div className="gradient-primary p-3 rounded-xl">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Exam Result</h1>
            <p className="text-sm text-muted-foreground">{exam?.title}</p>
          </div>
        </div>

        {/* Status Banner */}
        <Card className={`mb-6 border-2 ${session.status === "terminated" ? "border-destructive" : session.risk_score > 50 ? "border-warning" : "border-accent"}`}>
          <CardContent className="p-6 flex items-center gap-4">
            <statusInfo.icon className={`h-10 w-10 ${session.status === "terminated" ? "text-destructive" : session.risk_score > 50 ? "text-warning" : "text-accent"}`} />
            <div>
              <Badge className={`${statusInfo.color} border-0 text-sm mb-1`}>{statusInfo.label}</Badge>
              <p className="text-sm text-muted-foreground">
                {session.status === "terminated"
                  ? "Your exam was auto-submitted after 3 warnings. Only answers submitted before termination were evaluated."
                  : passed ? "Congratulations! You passed the exam." : "You did not meet the passing criteria."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Score Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card className="glass-card">
            <CardContent className="p-6 text-center">
              <Award className={`h-8 w-8 mx-auto mb-2 ${passed ? "text-accent" : "text-destructive"}`} />
              <p className="text-3xl font-bold text-foreground">{score}/{totalMarks}</p>
              <p className="text-sm text-muted-foreground">Marks Scored</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-warning" />
              <p className="text-3xl font-bold text-foreground">{session.warnings_count}/3</p>
              <p className="text-sm text-muted-foreground">Warnings</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6 text-center">
              <div className="mb-2">
                <Progress value={Math.min(session.risk_score, 100)} className="h-3" />
              </div>
              <p className="text-3xl font-bold text-foreground">{session.risk_score}%</p>
              <p className="text-sm text-muted-foreground">Cheating Score</p>
            </CardContent>
          </Card>
        </div>

        {/* Violation Timeline */}
        {violations.length > 0 && (
          <Card className="glass-card mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-warning" /> Violation Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {violations.map(v => (
                  <div key={v.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground font-mono">{new Date(v.created_at).toLocaleTimeString()}</span>
                      <Badge variant="outline" className="text-[10px]">{v.violation_type.replace(/_/g, " ")}</Badge>
                      <span className="text-muted-foreground text-xs">{v.description}</span>
                    </div>
                    <Badge variant="destructive" className="text-[10px]">+{v.severity}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Button onClick={() => navigate("/dashboard")} className="w-full gradient-primary text-primary-foreground">
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
