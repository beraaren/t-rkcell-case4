import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Pencil, Trash2, Video, FileQuestion, Save, Settings2, Check, CircleDot, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth";
import { courses as coursesApi, modules as modulesApi, lessons as lessonsApi, exams as examsApi, ai as aiApi } from "@/lib/api";

export const Route = createFileRoute("/instructor/$courseId")({ component: CourseEditor });

type LessonForm = { id?: string; title: string; content: string; videoUrl: string; estimatedDuration: number; orderIndex: number };
type ExamForm = { timeLimitMin: number; passingScore: number; maxAttempts: number; questionCount: number | null; shuffle: boolean };

function CourseEditor() {
  const { courseId } = Route.useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();

  const [course, setCourse] = useState<any>(null);
  const [modulesList, setModulesList] = useState<any[]>([]);
  const [courseForm, setCourseForm] = useState({ title: "", description: "", category: "", level: "BEGINNER", coverUrl: "", estimatedDuration: 60, status: "DRAFT" });

  // Lesson editor state
  const [lessonOpen, setLessonOpen] = useState<{ moduleId: string; lesson?: any } | null>(null);
  const [lessonForm, setLessonForm] = useState<LessonForm>({ title: "", content: "", videoUrl: "", estimatedDuration: 10, orderIndex: 1 });

  // Module editor state
  const [moduleOpen, setModuleOpen] = useState(false);
  const [moduleForm, setModuleForm] = useState({ title: "", description: "", orderIndex: 1 });

  // Exam editor state
  const [examOpen, setExamOpen] = useState<{ moduleId: string; examId?: string } | null>(null);
  const [examForm, setExamForm] = useState<ExamForm>({ timeLimitMin: 15, passingScore: 60, maxAttempts: 3, questionCount: null, shuffle: true });
  const [examQuestions, setExamQuestions] = useState<any[]>([]);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiCount, setAiCount] = useState(5);
  const [qForm, setQForm] = useState<{ type: string; text: string; options: { id: string; text: string; isCorrect: boolean }[] }>({
    type: "MULTIPLE_CHOICE",
    text: "",
    options: [
      { id: "a", text: "", isCorrect: false },
      { id: "b", text: "", isCorrect: false },
      { id: "c", text: "", isCorrect: false },
      { id: "d", text: "", isCorrect: false },
    ],
  });

  const loadAll = async () => {
    try {
      const c = await coursesApi.get(courseId);
      setCourse(c);
      setCourseForm({
        title: c.title ?? "",
        description: c.description ?? "",
        category: c.category ?? "",
        level: c.level ?? "BEGINNER",
        coverUrl: c.coverUrl ?? "",
        estimatedDuration: c.estimatedDuration ?? 60,
        status: c.status ?? "DRAFT",
      });
      const mods = await modulesApi.list(courseId);
      const enriched = await Promise.all(mods.map(async (m: any) => {
        const detail = await modulesApi.get(m.id).catch(() => m);
        return detail;
      }));
      setModulesList(enriched);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    if (!loading && user && (user.role === "INSTRUCTOR" || user.role === "ADMIN")) {
      loadAll();
    }
  }, [loading, user, courseId]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "INSTRUCTOR" && user.role !== "ADMIN") return <Navigate to="/courses" />;
  if (!course) return <div className="min-h-screen"><AppHeader /><div className="p-8 text-center">Yükleniyor…</div></div>;
  if (user.role !== "ADMIN" && course.instructorId !== user.id) return <Navigate to="/instructor" />;

  const saveCourse = async () => {
    try {
      const body: any = { ...courseForm };
      if (!body.coverUrl?.trim()) delete body.coverUrl;
      await coursesApi.update(courseId, body);
      toast.success("Kurs güncellendi");
      loadAll();
    } catch (err: any) { toast.error(err.message); }
  };

  const openLesson = (moduleId: string, lesson?: any) => {
    setLessonOpen({ moduleId, lesson });
    if (lesson) {
      setLessonForm({
        id: lesson.id,
        title: lesson.title ?? "",
        content: lesson.content ?? "",
        videoUrl: lesson.videoUrl ?? "",
        estimatedDuration: lesson.estimatedDuration ?? 10,
        orderIndex: lesson.orderIndex ?? 1,
      });
    } else {
      const mod = modulesList.find(m => m.id === moduleId);
      const nextIdx = (mod?.lessons?.length ?? 0) + 1;
      setLessonForm({ title: "", content: "", videoUrl: "", estimatedDuration: 10, orderIndex: nextIdx });
    }
  };

  const saveLesson = async () => {
    if (!lessonOpen) return;
    const body: any = {
      title: lessonForm.title,
      content: lessonForm.content,
      estimatedDuration: lessonForm.estimatedDuration,
      orderIndex: lessonForm.orderIndex,
    };
    if (lessonForm.videoUrl.trim()) body.videoUrl = lessonForm.videoUrl.trim();
    try {
      if (lessonForm.id) {
        await lessonsApi.update(lessonForm.id, body);
        toast.success("Ders güncellendi");
      } else {
        await lessonsApi.create(lessonOpen.moduleId, body);
        toast.success("Ders eklendi");
      }
      setLessonOpen(null);
      loadAll();
    } catch (err: any) { toast.error(err.message); }
  };

  const saveModule = async () => {
    try {
      await modulesApi.create(courseId, moduleForm);
      toast.success("Modül eklendi");
      setModuleOpen(false);
      setModuleForm({ title: "", description: "", orderIndex: modulesList.length + 2 });
      loadAll();
    } catch (err: any) { toast.error(err.message); }
  };

  const resetQuestionForm = (type: string = "MULTIPLE_CHOICE") => {
    if (type === "TRUE_FALSE") {
      setQForm({
        type,
        text: "",
        options: [
          { id: "true", text: "Doğru", isCorrect: false },
          { id: "false", text: "Yanlış", isCorrect: false },
        ],
      });
    } else {
      setQForm({
        type,
        text: "",
        options: [
          { id: "a", text: "", isCorrect: false },
          { id: "b", text: "", isCorrect: false },
          { id: "c", text: "", isCorrect: false },
          { id: "d", text: "", isCorrect: false },
        ],
      });
    }
  };

  const loadExamQuestions = async (examId: string) => {
    try {
      const exam = await examsApi.manage(examId);
      setExamQuestions(exam?.questions ?? []);
    } catch { setExamQuestions([]); }
  };

  const openExam = async (moduleId: string, existing?: any) => {
    setExamOpen({ moduleId, examId: existing?.id });
    setExamQuestions([]);
    resetQuestionForm("MULTIPLE_CHOICE");
    if (existing) {
      setExamForm({
        timeLimitMin: existing.timeLimitMin ?? 15,
        passingScore: existing.passingScore ?? 60,
        maxAttempts: existing.maxAttempts ?? 3,
        questionCount: existing.questionCount ?? null,
        shuffle: existing.shuffle ?? true,
      });
      if (existing.id) await loadExamQuestions(existing.id);
    } else {
      setExamForm({ timeLimitMin: 15, passingScore: 60, maxAttempts: 3, questionCount: null, shuffle: true });
    }
  };

  const saveExam = async (closeAfter = false) => {
    if (!examOpen) return null;
    const body: any = {
      timeLimitMin: examForm.timeLimitMin,
      passingScore: examForm.passingScore,
      maxAttempts: examForm.maxAttempts,
      shuffle: examForm.shuffle,
    };
    if (examForm.questionCount && examForm.questionCount > 0) body.questionCount = examForm.questionCount;
    try {
      const saved = await examsApi.create(examOpen.moduleId, body);
      toast.success("Sınav yapılandırması kaydedildi");
      setExamOpen({ moduleId: examOpen.moduleId, examId: saved.id });
      await loadExamQuestions(saved.id);
      if (closeAfter) {
        setExamOpen(null);
        loadAll();
      }
      return saved.id as string;
    } catch (err: any) { toast.error(err.message); return null; }
  };

  const setQType = (type: string) => resetQuestionForm(type);

  const toggleQOption = (idx: number) => {
    setQForm((prev) => {
      const opts = prev.options.map((o, i) => {
        if (prev.type === "MULTI_SELECT") {
          return i === idx ? { ...o, isCorrect: !o.isCorrect } : o;
        }
        return { ...o, isCorrect: i === idx };
      });
      return { ...prev, options: opts };
    });
  };

  const setQOptionText = (idx: number, value: string) => {
    setQForm((prev) => ({
      ...prev,
      options: prev.options.map((o, i) => (i === idx ? { ...o, text: value } : o)),
    }));
  };

  const addQuestion = async () => {
    if (!examOpen) return;
    let examId = examOpen.examId;
    if (!examId) {
      examId = (await saveExam(false)) ?? undefined;
      if (!examId) return;
    }
    if (!qForm.text.trim()) { toast.error("Soru metni boş olamaz"); return; }
    const correctCount = qForm.options.filter((o) => o.isCorrect).length;
    if (correctCount === 0) { toast.error("En az bir doğru cevap işaretle"); return; }
    if (qForm.type === "MULTIPLE_CHOICE" && correctCount !== 1) { toast.error("Tek seçimde sadece bir doğru cevap olabilir"); return; }
    if (qForm.type === "TRUE_FALSE" && correctCount !== 1) { toast.error("Doğru/Yanlış'tan birini seç"); return; }
    if (qForm.type !== "TRUE_FALSE" && qForm.options.some((o) => !o.text.trim())) {
      toast.error("Tüm seçeneklere metin gir");
      return;
    }
    try {
      await examsApi.addQuestion(examId, {
        type: qForm.type,
        text: qForm.text.trim(),
        options: qForm.options,
        orderIndex: examQuestions.length + 1,
      });
      toast.success("Soru eklendi");
      resetQuestionForm(qForm.type);
      await loadExamQuestions(examId);
    } catch (err: any) { toast.error(err.message); }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!examOpen?.examId) return;
    if (!confirm("Bu soruyu silmek istediğine emin misin?")) return;
    try {
      await examsApi.deleteQuestion(questionId);
      toast.success("Soru silindi");
      await loadExamQuestions(examOpen.examId);
    } catch (err: any) { toast.error(err.message); }
  };

  const closeExamDialog = () => {
    setExamOpen(null);
    setExamQuestions([]);
    loadAll();
  };

  const generateAiQuestions = async () => {
    if (!examOpen?.examId) {
      const id = await saveExam(false);
      if (!id) return;
    }
    setAiGenerating(true);
    try {
      const res = await aiApi.generateQuestions({ moduleId: examOpen!.moduleId, count: aiCount });
      toast.success(`${res.created} soru AI ile üretildi`);
      if (examOpen?.examId) await loadExamQuestions(examOpen.examId);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/instructor" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Eğitmen Paneli
          </Link>
          <Badge variant={course.status === "PUBLISHED" ? "default" : course.status === "ARCHIVED" ? "destructive" : "secondary"}>
            {course.status}
          </Badge>
        </div>

        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-bold">Kurs Bilgileri</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Başlık</Label><Input value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} /></div>
            <div><Label>Kategori</Label><Input value={courseForm.category} onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })} /></div>
          </div>
          <div><Label>Açıklama</Label><Textarea rows={3} value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} /></div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label>Seviye</Label>
              <Select value={courseForm.level} onValueChange={(v) => setCourseForm({ ...courseForm, level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEGINNER">Başlangıç</SelectItem>
                  <SelectItem value="INTERMEDIATE">Orta</SelectItem>
                  <SelectItem value="ADVANCED">İleri</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Süre (dk)</Label><Input type="number" value={courseForm.estimatedDuration} onChange={(e) => setCourseForm({ ...courseForm, estimatedDuration: Number(e.target.value) })} /></div>
            <div>
              <Label>Durum</Label>
              <Select value={courseForm.status} onValueChange={(v) => setCourseForm({ ...courseForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Taslak</SelectItem>
                  <SelectItem value="PUBLISHED">Yayında</SelectItem>
                  <SelectItem value="ARCHIVED">Arşiv</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Kapak URL</Label><Input value={courseForm.coverUrl} onChange={(e) => setCourseForm({ ...courseForm, coverUrl: e.target.value })} placeholder="https://..." /></div>
          <Button onClick={saveCourse} className="bg-violet-600 hover:bg-violet-700">
            <Save className="w-4 h-4 mr-1.5" /> Kursu Kaydet
          </Button>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Modüller</h2>
            <Button variant="outline" size="sm" onClick={() => { setModuleOpen(true); setModuleForm({ title: "", description: "", orderIndex: modulesList.length + 1 }); }}>
              <Plus className="w-4 h-4 mr-1" /> Modül Ekle
            </Button>
          </div>

          {modulesList.length === 0 && <p className="text-sm text-muted-foreground">Henüz modül yok.</p>}

          {modulesList.map((m: any, mi: number) => (
            <Card key={m.id} className="p-4 space-y-3 border-l-4 border-violet-500">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Modül {mi + 1}</div>
                  <div className="font-semibold">{m.title}</div>
                  {m.description && <p className="text-xs text-muted-foreground mt-1">{m.description}</p>}
                </div>
                <Button size="sm" variant="outline" onClick={() => openExam(m.id, m.exam)}>
                  <Settings2 className="w-3.5 h-3.5 mr-1" /> {m.exam ? "Sınavı Düzenle" : "Sınav Ekle"}
                </Button>
              </div>

              <div className="space-y-1">
                {(m.lessons ?? []).map((l: any) => (
                  <div key={l.id} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/40 group">
                    <span className="text-xs font-mono w-6 text-muted-foreground">{l.orderIndex}.</span>
                    <span className="text-sm flex-1 truncate">{l.title}</span>
                    {l.videoUrl && <Video className="w-3.5 h-3.5 text-violet-500" />}
                    <span className="text-xs text-muted-foreground">{l.estimatedDuration} dk</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100"
                      onClick={() => openLesson(m.id, l)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full justify-start text-violet-600" onClick={() => openLesson(m.id)}>
                  <Plus className="w-4 h-4 mr-1" /> Ders Ekle
                </Button>
              </div>

              {m.exam && (
                <div className="text-xs text-muted-foreground flex items-center gap-3 pt-2 border-t">
                  <span className="flex items-center gap-1"><FileQuestion className="w-3 h-3" /> {m.exam.questions?.length ?? 0} soru</span>
                  <span>· {m.exam.timeLimitMin} dk</span>
                  <span>· Geçme: %{m.exam.passingScore}</span>
                  {m.exam.questionCount && <span>· Random {m.exam.questionCount} soru</span>}
                </div>
              )}
            </Card>
          ))}
        </Card>
      </main>

      {/* Lesson Dialog */}
      <Dialog open={!!lessonOpen} onOpenChange={(o) => !o && setLessonOpen(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{lessonForm.id ? "Dersi Düzenle" : "Yeni Ders"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Başlık</Label><Input value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} /></div>
            <div><Label>İçerik</Label><Textarea rows={5} value={lessonForm.content} onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })} /></div>
            <div>
              <Label className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5" /> Video Linki (YouTube / Vimeo)</Label>
              <Input value={lessonForm.videoUrl} onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
              <p className="text-xs text-muted-foreground mt-1">Opsiyonel — embed player otomatik gömülür.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Süre (dk)</Label><Input type="number" min={1} value={lessonForm.estimatedDuration} onChange={(e) => setLessonForm({ ...lessonForm, estimatedDuration: Number(e.target.value) })} /></div>
              <div><Label>Sıra</Label><Input type="number" min={1} value={lessonForm.orderIndex} onChange={(e) => setLessonForm({ ...lessonForm, orderIndex: Number(e.target.value) })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonOpen(null)}>İptal</Button>
            <Button className="bg-violet-600 hover:bg-violet-700" onClick={saveLesson}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Module Dialog */}
      <Dialog open={moduleOpen} onOpenChange={setModuleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Modül</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Başlık</Label><Input value={moduleForm.title} onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })} /></div>
            <div><Label>Açıklama</Label><Textarea rows={2} value={moduleForm.description} onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })} /></div>
            <div><Label>Sıra</Label><Input type="number" min={1} value={moduleForm.orderIndex} onChange={(e) => setModuleForm({ ...moduleForm, orderIndex: Number(e.target.value) })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModuleOpen(false)}>İptal</Button>
            <Button className="bg-violet-600 hover:bg-violet-700" onClick={saveModule}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exam Dialog */}
      <Dialog open={!!examOpen} onOpenChange={(o) => !o && closeExamDialog()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sınav Yönetimi</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Settings */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Sınav Ayarları</h4>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Süre (dk)</Label><Input type="number" min={1} value={examForm.timeLimitMin} onChange={(e) => setExamForm({ ...examForm, timeLimitMin: Number(e.target.value) })} /></div>
                <div><Label>Geçme Puanı</Label><Input type="number" min={0} max={100} value={examForm.passingScore} onChange={(e) => setExamForm({ ...examForm, passingScore: Number(e.target.value) })} /></div>
                <div><Label>Maks. Deneme</Label><Input type="number" min={1} value={examForm.maxAttempts} onChange={(e) => setExamForm({ ...examForm, maxAttempts: Number(e.target.value) })} /></div>
                <div>
                  <Label>Soru Sayısı (random)</Label>
                  <Input type="number" min={1} value={examForm.questionCount ?? ""} onChange={(e) => setExamForm({ ...examForm, questionCount: e.target.value ? Number(e.target.value) : null })} placeholder="Tümü" />
                </div>
              </div>
              <div className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <div className="text-sm font-medium">Soruları Karıştır</div>
                  <div className="text-xs text-muted-foreground">Her denemede farklı sıra</div>
                </div>
                <Switch checked={examForm.shuffle} onCheckedChange={(v) => setExamForm({ ...examForm, shuffle: v })} />
              </div>
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700" onClick={() => saveExam(false)}>
                <Save className="w-3.5 h-3.5 mr-1.5" /> {examOpen?.examId ? "Ayarları Güncelle" : "Sınavı Oluştur"}
              </Button>
              {!examOpen?.examId && (
                <p className="text-xs text-muted-foreground">Soru ekleyebilmek için önce sınavı oluştur.</p>
              )}
            </div>

            {/* Existing questions */}
            {examOpen?.examId && (
              <div className="space-y-2 border-t pt-4">
                <h4 className="text-sm font-semibold">Sorular ({examQuestions.length})</h4>
                {examQuestions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Henüz soru yok.</p>
                ) : (
                  <div className="space-y-2">
                    {examQuestions.map((q: any, qi: number) => (
                      <div key={q.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="text-xs text-muted-foreground">Soru {qi + 1} · {q.type}</div>
                            <div className="text-sm font-medium">{q.text}</div>
                          </div>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => deleteQuestion(q.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <div className="space-y-1">
                          {(q.options as any[])?.map((o: any) => (
                            <div key={o.id} className="flex items-center gap-2 text-xs">
                              {o.isCorrect
                                ? <Check className="w-3.5 h-3.5 text-green-500" />
                                : <CircleDot className="w-3.5 h-3.5 text-muted-foreground/50" />}
                              <span className={o.isCorrect ? "text-green-600 dark:text-green-400 font-medium" : ""}>{o.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI Auto-generate */}
            {examOpen?.examId && (
              <div className="border-t pt-4 space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-600" /> AI ile Otomatik Soru Üret
                </h4>
                <p className="text-xs text-muted-foreground">
                  Modül başlığı, açıklaması ve ders içeriklerine göre GPT soruları üretip otomatik ekler.
                </p>
                <div className="flex items-end gap-2">
                  <div className="w-24">
                    <Label>Soru sayısı</Label>
                    <Input type="number" min={1} max={15} value={aiCount} onChange={(e) => setAiCount(Math.min(15, Math.max(1, Number(e.target.value) || 5)))} />
                  </div>
                  <Button onClick={generateAiQuestions} disabled={aiGenerating} className="bg-violet-600 hover:bg-violet-700">
                    {aiGenerating ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
                    {aiGenerating ? "Üretiliyor..." : "Oto Soru Üret"}
                  </Button>
                </div>
              </div>
            )}

            {/* New question form */}
            {examOpen?.examId && (
              <div className="space-y-3 border-t pt-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Plus className="w-4 h-4 text-violet-600" /> Yeni Soru (Manuel)
                </h4>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <Label>Tip</Label>
                    <Select value={qForm.type} onValueChange={setQType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MULTIPLE_CHOICE">Tek seçim</SelectItem>
                        <SelectItem value="MULTI_SELECT">Çoklu seçim</SelectItem>
                        <SelectItem value="TRUE_FALSE">Doğru / Yanlış</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Soru Metni</Label>
                    <Textarea rows={2} value={qForm.text} onChange={(e) => setQForm({ ...qForm, text: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Seçenekler {qForm.type === "MULTI_SELECT" && <span className="text-xs text-muted-foreground">(birden fazla işaretle)</span>}</Label>
                  {qForm.options.map((o, i) => (
                    <div key={o.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleQOption(i)}
                        className={`w-6 h-6 rounded ${qForm.type === "MULTI_SELECT" ? "rounded-md" : "rounded-full"} border-2 flex items-center justify-center shrink-0 ${
                          o.isCorrect ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground/40"
                        }`}
                      >
                        {o.isCorrect && <Check className="w-3.5 h-3.5" />}
                      </button>
                      {qForm.type === "TRUE_FALSE" ? (
                        <span className="text-sm flex-1">{o.text}</span>
                      ) : (
                        <Input value={o.text} onChange={(e) => setQOptionText(i, e.target.value)} placeholder={`Seçenek ${o.id.toUpperCase()}`} />
                      )}
                    </div>
                  ))}
                </div>

                <Button onClick={addQuestion} className="bg-violet-600 hover:bg-violet-700">
                  <Plus className="w-4 h-4 mr-1" /> Soruyu Ekle
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeExamDialog}>Kapat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
