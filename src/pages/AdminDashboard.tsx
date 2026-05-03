import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, BookOpen, BarChart3, LogOut, LayoutDashboard } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminStudents from "@/components/admin/AdminStudents";
import AdminExams from "@/components/admin/AdminExams";
import AdminResults from "@/components/admin/AdminResults";

const navItems = [
  { title: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
  { title: "Students", icon: Users, key: "students" },
  { title: "Exams", icon: BookOpen, key: "exams" },
  { title: "Results", icon: BarChart3, key: "results" },
];

export default function AdminDashboard() {
  const { signOut, profile } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar collapsible="icon">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center gap-2">
                <Shield className="h-4 w-4" /> ExamEye Admin
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        isActive={activeTab === item.key}
                        onClick={() => setActiveTab(item.key)}
                        className="cursor-pointer"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border glass-card flex items-center justify-between px-4 sticky top-0 z-50">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="font-semibold text-foreground capitalize">{activeTab}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{profile?.full_name}</span>
              <Badge className="gradient-primary text-primary-foreground border-0 text-xs">Admin</Badge>
              <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
            </div>
          </header>

          <main className="flex-1 p-6">
            {activeTab === "dashboard" && <AdminOverview />}
            {activeTab === "students" && <AdminStudents />}
            {activeTab === "exams" && <AdminExams />}
            {activeTab === "results" && <AdminResults />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
