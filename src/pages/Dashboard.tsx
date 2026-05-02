import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Award, LogOut, Shield, Users, BarChart3 } from "lucide-react";

interface Exam {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  total_marks: number;
  is_active: boolean;
}

export default function Dashboard() {
  const { user, role, profile, signOut } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("exams").select("*").eq("is_active", true).then(({ data }) => {
      if (data) setExams(data);
    });
  }, []);

  if (role === "admin") {
    navigate("/admin");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border glass-card sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="gradient-primary p-2 rounded-lg">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">ExamEye</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{profile?.full_name || profile?.email}</span>
            <Badge variant="secondary" className="text-xs">Student</Badge>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome, {profile?.full_name || "Student"} 👋
          </h1>
          <p className="text-muted-foreground">Select an exam to begin. Make sure your webcam and microphone are ready.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="glass-card animate-fade-in">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="gradient-primary p-3 rounded-xl"><BookOpen className="h-5 w-5 text-primary-foreground" /></div>
              <div><p className="text-2xl font-bold text-foreground">{exams.length}</p><p className="text-sm text-muted-foreground">Available Exams</p></div>
            </CardContent>
          </Card>
          <Card className="glass-card animate-fade-in">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="gradient-success p-3 rounded-xl"><Award className="h-5 w-5 text-accent-foreground" /></div>
              <div><p className="text-2xl font-bold text-foreground">0</p><p className="text-sm text-muted-foreground">Completed</p></div>
            </CardContent>
          </Card>
          <Card className="glass-card animate-fade-in">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-xl bg-warning"><BarChart3 className="h-5 w-5 text-warning-foreground" /></div>
              <div><p className="text-2xl font-bold text-foreground">--</p><p className="text-sm text-muted-foreground">Avg Score</p></div>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-xl font-semibold text-foreground mb-4">Available Exams</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam, i) => (
            <Card key={exam.id} className="glass-card hover:border-primary/50 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge className="gradient-primary text-primary-foreground border-0">Active</Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{exam.duration_minutes} min</span>
                </div>
                <CardTitle className="text-lg mt-2">{exam.title}</CardTitle>
                <CardDescription className="line-clamp-2">{exam.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Total Marks: {exam.total_marks}</span>
                </div>
                <Button className="w-full gradient-primary text-primary-foreground" onClick={() => navigate(`/exam-setup/${exam.id}`)}>
                  Start Exam
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
