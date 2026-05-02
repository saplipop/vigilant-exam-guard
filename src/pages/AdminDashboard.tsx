import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Users, AlertTriangle, BookOpen, LogOut, Activity, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SessionData {
  id: string;
  status: string;
  risk_score: number;
  started_at: string | null;
  student_id: string;
  exam_id: string;
  profiles: { full_name: string; email: string } | null;
  exams: { title: string } | null;
}

interface ViolationData {
  id: string;
  violation_type: string;
  severity: number;
  description: string | null;
  created_at: string;
  session_id: string;
}

export default function AdminDashboard() {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [violations, setViolations] = useState<ViolationData[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  useEffect(() => {
    loadData();

    const channel = supabase.channel("admin-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "exam_sessions" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "violations" }, () => loadData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadData() {
    const [sessRes, violRes] = await Promise.all([
      supabase.from("exam_sessions").select("*, profiles:student_id(full_name, email), exams:exam_id(title)").order("created_at", { ascending: false }),
      supabase.from("violations").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    if (sessRes.data) setSessions(sessRes.data as any);
    if (violRes.data) setViolations(violRes.data);
  }

  const activeSessions = sessions.filter(s => s.status === "in_progress");
  const highRiskSessions = sessions.filter(s => s.risk_score > 50);
  const totalViolations = violations.length;

  const statusColor = (status: string) => {
    switch (status) {
      case "in_progress": return "bg-primary text-primary-foreground";
      case "completed": return "bg-accent text-accent-foreground";
      case "terminated": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const riskColor = (score: number) => score > 70 ? "text-destructive" : score > 40 ? "text-warning" : "text-accent";

  return (
    <div className="dark min-h-screen bg-background">
      <header className="border-b border-border glass-card sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="gradient-primary p-2 rounded-lg"><Shield className="h-5 w-5 text-primary-foreground" /></div>
            <span className="font-bold text-lg text-foreground">ProctorAI</span>
            <Badge className="gradient-primary text-primary-foreground border-0 text-xs">Admin</Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{profile?.full_name}</span>
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Monitoring Dashboard</h1>
        <p className="text-muted-foreground mb-8">Real-time exam monitoring and cheating detection overview</p>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          {[
            { label: "Active Sessions", value: activeSessions.length, icon: Activity, gradient: "gradient-primary" },
            { label: "Total Students", value: sessions.length, icon: Users, gradient: "gradient-success" },
            { label: "High Risk", value: highRiskSessions.length, icon: AlertTriangle, gradient: "gradient-danger" },
            { label: "Violations", value: totalViolations, icon: AlertTriangle, gradient: "bg-warning" },
          ].map((stat, i) => (
            <Card key={i} className="glass-card animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`${stat.gradient} p-3 rounded-xl`}><stat.icon className="h-5 w-5 text-primary-foreground" /></div>
                <div><p className="text-2xl font-bold text-foreground">{stat.value}</p><p className="text-sm text-muted-foreground">{stat.label}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sessions Table */}
          <Card className="glass-card lg:col-span-2">
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Exam Sessions</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Exam</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.slice(0, 20).map(s => (
                    <TableRow key={s.id} className={selectedSession === s.id ? "bg-primary/5" : ""}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground text-sm">{(s.profiles as any)?.full_name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{(s.profiles as any)?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{(s.exams as any)?.title || "—"}</TableCell>
                      <TableCell><Badge className={`${statusColor(s.status)} text-xs border-0`}>{s.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold text-sm ${riskColor(s.risk_score)}`}>{s.risk_score}</span>
                          <Progress value={Math.min(s.risk_score, 100)} className="w-16 h-1.5" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedSession(s.id === selectedSession ? null : s.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sessions.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No exam sessions yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Violations Timeline */}
          <Card className="glass-card">
            <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warning" /> Violations Log</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {violations.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No violations recorded</p>}
                {violations.map(v => (
                  <div key={v.id} className="p-3 bg-muted/50 rounded-lg border border-border/50 animate-slide-in">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-[10px]">{v.violation_type.replace("_", " ")}</Badge>
                      <span className="text-destructive font-mono text-xs font-bold">+{v.severity}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{v.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(v.created_at).toLocaleTimeString()}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
