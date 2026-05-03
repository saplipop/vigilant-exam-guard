import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, Eye, ChevronDown, ChevronUp, AlertTriangle, Clock } from "lucide-react";

interface SessionResult {
  id: string;
  status: string;
  risk_score: number;
  score: number | null;
  warnings_count: number;
  started_at: string | null;
  completed_at: string | null;
  profiles: { full_name: string; email: string } | null;
  exams: { title: string; total_marks: number } | null;
}

interface ViolationItem {
  id: string;
  violation_type: string;
  severity: number;
  description: string | null;
  created_at: string;
}

export default function AdminResults() {
  const [sessions, setSessions] = useState<SessionResult[]>([]);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [violations, setViolations] = useState<Record<string, ViolationItem[]>>({});

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    const { data } = await supabase
      .from("exam_sessions")
      .select("*, profiles:student_id(full_name, email), exams:exam_id(title, total_marks)")
      .in("status", ["completed", "terminated"])
      .order("completed_at", { ascending: false });
    if (data) setSessions(data as any);
  }

  async function loadViolations(sessionId: string) {
    const { data } = await supabase
      .from("violations")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    if (data) setViolations(prev => ({ ...prev, [sessionId]: data }));
  }

  function toggleExpand(sessionId: string) {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
    } else {
      setExpandedSession(sessionId);
      if (!violations[sessionId]) loadViolations(sessionId);
    }
  }

  function getStatus(s: SessionResult) {
    if (s.status === "terminated") return { label: "Terminated", className: "bg-destructive text-destructive-foreground" };
    if (s.risk_score > 50) return { label: "Suspicious", className: "bg-warning text-warning-foreground" };
    return { label: "Valid", className: "bg-accent text-accent-foreground" };
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Exam Results</h1>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> All Results ({sessions.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.map(s => {
            const status = getStatus(s);
            const totalMarks = (s.exams as any)?.total_marks || 100;
            return (
              <Card key={s.id} className="border border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{(s.profiles as any)?.full_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{(s.exams as any)?.title} · {(s.profiles as any)?.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">{s.score ?? "--"}/{totalMarks}</p>
                        <p className="text-[10px] text-muted-foreground">Score</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-warning">{s.warnings_count}</p>
                        <p className="text-[10px] text-muted-foreground">Warnings</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-destructive">{s.risk_score}</p>
                        <p className="text-[10px] text-muted-foreground">Risk</p>
                      </div>
                      <Badge className={`${status.className} border-0 text-xs`}>{status.label}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => toggleExpand(s.id)}>
                        {expandedSession === s.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {expandedSession === s.id && (
                    <div className="mt-4 border-t border-border pt-4">
                      <div className="grid gap-4 md:grid-cols-3 mb-4">
                        <Card className="bg-muted/50 border-0">
                          <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-foreground">{s.score ?? "--"}/{totalMarks}</p>
                            <p className="text-xs text-muted-foreground">Marks Scored</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-muted/50 border-0">
                          <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-warning">{s.warnings_count}/3</p>
                            <p className="text-xs text-muted-foreground">Warnings</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-muted/50 border-0">
                          <CardContent className="p-4 text-center">
                            <Progress value={Math.min(s.risk_score, 100)} className="mb-2" />
                            <p className="text-xs text-muted-foreground">Cheating Score: {s.risk_score}%</p>
                          </CardContent>
                        </Card>
                      </div>

                      <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning" /> Violation Timeline
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {(violations[s.id] || []).map(v => (
                          <div key={v.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">{new Date(v.created_at).toLocaleTimeString()}</span>
                              <Badge variant="outline" className="text-[10px]">{v.violation_type.replace(/_/g, " ")}</Badge>
                            </div>
                            <span className="text-destructive font-mono font-bold">+{v.severity}</span>
                          </div>
                        ))}
                        {(violations[s.id] || []).length === 0 && (
                          <p className="text-center text-muted-foreground py-4 text-xs">No violations recorded</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {sessions.length === 0 && <p className="text-center text-muted-foreground py-8">No completed exams yet</p>}
        </CardContent>
      </Card>
    </div>
  );
}
