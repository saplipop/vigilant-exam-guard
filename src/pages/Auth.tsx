import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, Eye, EyeOff, Loader2, UserCog, GraduationCap } from "lucide-react";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [loginRole, setLoginRole] = useState<"student" | "admin">(
    searchParams.get("role") === "admin" ? "admin" : "student"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const r = searchParams.get("role");
    if (r === "admin") setLoginRole("admin");
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Verify role matches
      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).single();
      const userRole = roleData?.role || "student";

      if (loginRole === "admin" && userRole !== "admin") {
        await supabase.auth.signOut();
        throw new Error("This account does not have admin access.");
      }

      navigate(userRole === "admin" ? "/admin" : "/dashboard");
    } catch (err: any) {
      toast({ title: "Login Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="gradient-primary p-3 rounded-xl glow-primary">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">ExamEye</h1>
            <p className="text-sm text-muted-foreground">Secure Exam Platform</p>
          </div>
        </div>

        {/* Role Toggle */}
        <div className="flex rounded-lg border border-border overflow-hidden mb-6">
          <button
            onClick={() => setLoginRole("student")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all ${
              loginRole === "student"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <GraduationCap className="h-4 w-4" /> Student
          </button>
          <button
            onClick={() => setLoginRole("admin")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all ${
              loginRole === "admin"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserCog className="h-4 w-4" /> Admin
          </button>
        </div>

        <Card className="glass-card">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {loginRole === "admin" ? "Admin Login" : "Student Login"}
            </CardTitle>
            <CardDescription>
              {loginRole === "admin"
                ? "Sign in with your admin credentials"
                : "Sign in with credentials provided by your admin"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In as {loginRole === "admin" ? "Admin" : "Student"}
              </Button>
            </form>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              {loginRole === "student"
                ? "Contact your administrator if you don't have credentials."
                : "Only authorized administrators can access the admin panel."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
