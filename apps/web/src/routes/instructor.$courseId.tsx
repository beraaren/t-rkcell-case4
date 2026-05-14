import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Pencil, Trash2, Video, FileQuestion, Save, Settings2 } from "lucide-react";
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
import { courses as coursesApi, modules as modulesApi, lessons as lessonsApi, exams as examsApi } from "@/lib/api";

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

  const saveCourse = async () => {
    try {
      await coursesApi.update(courseId, courseForm);
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

  const openExam = (moduleId: string, existing?: any) => {
    setExamOpen({ moduleId, examId: existing?.id });
    if (existing) {
      setExamForm({
        timeLimitMin: existing.timeLimitMin ?? 15,
        passingScore: existing.passingScore ?? 60,
        maxAttempts: existing.maxAttempts ?? 3,
        questionCount: existing.questionCount ?? null,
        shuffle: existing.shuffle ?? true,
      });
    } else {
      setExamForm({ timeLimitMin: 15, passingScore: 60, maxAttempts: 3, questionCount: null, shuffle: true });
    }
  };

  const saveExam = async () => {
    if (!examOpen) return;
    const body: any = {
      timeLimitMin: examForm.timeLimitMin,
      passingScore: examForm.passingScore,
      maxAttempts: examForm.maxAttempts,
      shuffle: examForm.shuffle,
    };
    if (examForm.questionCount && examForm.questionCount > 0) body.questionCount = examForm.questionCount;
    try {
      await examsApi.create(examOpen.moduleId, body);
      toast.success("Sınav yapılandırması kaydedildi");
      setExamOpen(null);
      loadAll();
    } catch (err: any) { toast.error(err.message); }
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
      <Dialog open={!!examOpen} onOpenChange={(o) => !o && setExamOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sınav Yapılandırması</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
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
            <p className="text-xs text-muted-foreground">
              Soru sayısını set edersen, soru bankasından rastgele o kadar soru seçilir. Boşsa tüm sorular kullanılır.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExamOpen(null)}>İptal</Button>
            <Button className="bg-violet-600 hover:bg-violet-700" onClick={saveExam}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
