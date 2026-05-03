import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Users, BookOpen, Activity, AlertTriangle } from "lucide-react";

export default function AdminOverview() {
  const [stats, setStats] = useState({ students: 0, exams: 0, activeSessions: 0, violations: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const [studentsRes, examsRes, sessionsRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).not("admin_id", "is", null),
      supabase.from("exams").select("id", { count: "exact", head: true }),
      supabase.from("exam_sessions").select("id, status", { count: "exact" }),
    ]);

    const activeSessions = (sessionsRes.data || []).filter((s: any) => s.status === "in_progress").length;

    setStats({
      students: studentsRes.count || 0,
      exams: examsRes.count || 0,
      activeSessions,
      violations: 0,
    });
  }

  const cards = [
    { label: "Total Students", value: stats.students, icon: Users, gradient: "gradient-primary" },
    { label: "Total Exams", value: stats.exams, icon: BookOpen, gradient: "gradient-success" },
    { label: "Active Sessions", value: stats.activeSessions, icon: Activity, gradient: "gradient-danger" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Overview</h1>
      <p className="text-muted-foreground mb-8">Monitor your exam platform at a glance</p>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c, i) => (
          <Card key={i} className="glass-card animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`${c.gradient} p-3 rounded-xl`}>
                <c.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{c.value}</p>
                <p className="text-sm text-muted-foreground">{c.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
