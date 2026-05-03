import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, BookOpen, Trash2, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface Exam {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  total_marks: number;
  is_active: boolean;
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  correct_answer: string | null;
  marks: number;
  order_num: number;
}

export default function AdminExams() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedExam, setExpandedExam] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Record<string, Question[]>>({});

  // Exam form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(60);
  const [totalMarks, setTotalMarks] = useState(100);

  // Question form
  const [qText, setQText] = useState("");
  const [qType, setQType] = useState("mcq");
  const [qOptions, setQOptions] = useState(["", "", "", ""]);
  const [qCorrect, setQCorrect] = useState("");
  const [qMarks, setQMarks] = useState(1);

  useEffect(() => {
    loadExams();
  }, []);

  async function loadExams() {
    const { data } = await supabase.from("exams").select("*").order("created_at", { ascending: false });
    if (data) setExams(data);
  }

  async function loadQuestions(examId: string) {
    const { data } = await supabase.from("questions").select("*").eq("exam_id", examId).order("order_num");
    if (data) setQuestions(prev => ({ ...prev, [examId]: data.map(q => ({ ...q, options: q.options ? (q.options as any) : null })) }));
  }

  async function createExam(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from("exams").insert({
        title,
        description,
        duration_minutes: duration,
        total_marks: totalMarks,
        created_by: user!.id,
        is_active: false,
      });
      if (error) throw error;
      toast({ title: "Exam Created" });
      setTitle("");
      setDescription("");
      setDuration(60);
      setTotalMarks(100);
      loadExams();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(examId: string, current: boolean) {
    await supabase.from("exams").update({ is_active: !current }).eq("id", examId);
    loadExams();
  }

  async function addQuestion(examId: string) {
    const existing = questions[examId] || [];
    const payload: any = {
      exam_id: examId,
      question_text: qText,
      question_type: qType,
      marks: qMarks,
      order_num: existing.length + 1,
    };
    if (qType === "mcq") {
      payload.options = qOptions.filter(o => o.trim());
      payload.correct_answer = qCorrect;
    }
    const { error } = await supabase.from("questions").insert(payload);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Question Added" });
    setQText("");
    setQOptions(["", "", "", ""]);
    setQCorrect("");
    setQMarks(1);
    loadQuestions(examId);
  }

  async function deleteQuestion(qId: string, examId: string) {
    await supabase.from("questions").delete().eq("id", qId);
    loadQuestions(examId);
  }

  function toggleExpand(examId: string) {
    if (expandedExam === examId) {
      setExpandedExam(null);
    } else {
      setExpandedExam(examId);
      if (!questions[examId]) loadQuestions(examId);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Manage Exams</h1>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> Create Exam</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createExam} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Exam title" required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Duration (min)</Label>
                <Input type="number" value={duration} onChange={e => setDuration(+e.target.value)} min={1} required />
              </div>
              <div className="space-y-1">
                <Label>Total Marks</Label>
                <Input type="number" value={totalMarks} onChange={e => setTotalMarks(+e.target.value)} min={1} required />
              </div>
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label>Description / Instructions</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Exam instructions..." />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="gradient-primary text-primary-foreground" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                Create Exam
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> Your Exams ({exams.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {exams.map(exam => (
            <Card key={exam.id} className="border border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{exam.title}</h3>
                    <p className="text-sm text-muted-foreground">{exam.duration_minutes} min · {exam.total_marks} marks</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Active</span>
                      <Switch checked={exam.is_active} onCheckedChange={() => toggleActive(exam.id, exam.is_active)} />
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => toggleExpand(exam.id)}>
                      {expandedExam === exam.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {expandedExam === exam.id && (
                  <div className="mt-4 space-y-4 border-t border-border pt-4">
                    <h4 className="font-medium text-foreground">Questions ({(questions[exam.id] || []).length})</h4>

                    {(questions[exam.id] || []).map((q, i) => (
                      <div key={q.id} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-foreground">{i + 1}. {q.question_text}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px]">{q.question_type}</Badge>
                            <Badge variant="outline" className="text-[10px]">{q.marks} marks</Badge>
                            {q.correct_answer && <Badge variant="secondary" className="text-[10px]">Ans: {q.correct_answer}</Badge>}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => deleteQuestion(q.id, exam.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}

                    <div className="space-y-3 p-4 border border-dashed border-border rounded-lg">
                      <h5 className="text-sm font-medium text-foreground">Add Question</h5>
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="md:col-span-2 space-y-1">
                          <Label className="text-xs">Question</Label>
                          <Input value={qText} onChange={e => setQText(e.target.value)} placeholder="Enter question..." />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Type</Label>
                            <Select value={qType} onValueChange={setQType}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mcq">MCQ</SelectItem>
                                <SelectItem value="subjective">Subjective</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Marks</Label>
                            <Input type="number" value={qMarks} onChange={e => setQMarks(+e.target.value)} min={1} />
                          </div>
                        </div>
                      </div>
                      {qType === "mcq" && (
                        <div className="grid gap-2 md:grid-cols-2">
                          {qOptions.map((opt, i) => (
                            <div key={i} className="space-y-1">
                              <Label className="text-xs">Option {String.fromCharCode(65 + i)}</Label>
                              <Input value={opt} onChange={e => { const n = [...qOptions]; n[i] = e.target.value; setQOptions(n); }} placeholder={`Option ${String.fromCharCode(65 + i)}`} />
                            </div>
                          ))}
                          <div className="md:col-span-2 space-y-1">
                            <Label className="text-xs">Correct Answer (exact match)</Label>
                            <Input value={qCorrect} onChange={e => setQCorrect(e.target.value)} placeholder="Enter correct option text" />
                          </div>
                        </div>
                      )}
                      <Button size="sm" onClick={() => addQuestion(exam.id)} disabled={!qText} className="gradient-primary text-primary-foreground">
                        <Plus className="h-3 w-3 mr-1" /> Add Question
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {exams.length === 0 && <p className="text-center text-muted-foreground py-8">No exams created yet</p>}
        </CardContent>
      </Card>
    </div>
  );
}
