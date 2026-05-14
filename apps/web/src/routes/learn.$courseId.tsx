import { createFileRoute, Link, Navigate, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, CheckCircle2, Circle, FileText, MessageSquare, Send, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { courses as coursesApi, lessons as lessonsApi, interactions } from "@/lib/api";

export const Route = createFileRoute("/learn/$courseId")({
  component: LearnPage,
  validateSearch: (s: Record<string, unknown>): { lessonId?: string } => ({
    ...(s.lessonId ? { lessonId: s.lessonId as string } : {}),
  }),
});

function LearnPage() {
  const { courseId } = Route.useParams();
  const { lessonId: initialLessonId } = Route.useSearch();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const routerState = useRouterState();
  const isChildRoute = routerState.location.pathname !== `/learn/${courseId}`;

  const [curriculum, setCurriculum] = useState<any>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(initialLessonId ?? null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [fetching, setFetching] = useState(true);

  const loadCurriculum = () => {
    coursesApi.curriculum(courseId)
      .then((data) => { setCurriculum(data); setFetching(false); })
      .catch(() => setFetching(false));
  };

  useEffect(() => {
    if (!loading && user) loadCurriculum();
  }, [courseId, loading, user]);

  const allLessons = curriculum
    ? (curriculum.modules ?? []).flatMap((m: any, mi: number) =>
        (m.lessons ?? []).map((l: any) => ({ ...l, _mi: mi, _moduleId: m.id, _moduleTitle: m.title }))
      )
    : [];

  const currentLesson = activeLessonId
    ? allLessons.find((l: any) => l.id === activeLessonId)
    : allLessons.find((l: any) => !l.isCompleted) ?? allLessons[0];

  useEffect(() => {
    if (currentLesson?.id) {
      interactions.getComments(currentLesson.id).then(setComments).catch(() => {});
    }
  }, [currentLesson?.id]);

  if (isChildRoute) return <Outlet />;
  if (loading || fetching) return null;
  if (!user) return <Navigate to="/login" />;
  if (!curriculum) return (
    <div className="min-h-screen"><AppHeader /><div className="p-8">Bu kursa kayıtlı değilsin.</div></div>
  );

  const modules: any[] = curriculum.modules ?? [];
  const totalLessons = allLessons.length;
  const completedLessons = allLessons.filter((l: any) => l.isCompleted).length;
  const overallPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const onComplete = async (lessonId: string) => {
    try {
      await lessonsApi.complete(lessonId);
      toast.success("Ders tamamlandı");
      loadCurriculum();
    } catch (err: any) { toast.error(err.message); }
  };

  const onComment = async () => {
    if (!currentLesson || !commentText.trim()) return;
    try {
      await interactions.addComment(currentLesson.id, { text: commentText.trim() });
      setCommentText("");
      interactions.getComments(currentLesson.id).then(setComments).catch(() => {});
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="space-y-3">
          <Card className="p-4">
            <Link to="/courses/$id" params={{ id: courseId }} className="text-xs text-muted-foreground hover:text-foreground">← Kurs sayfası</Link>
            <h2 className="font-semibold mt-1">{curriculum.title}</h2>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs"><span>Kurs ilerleme</span><span className="font-semibold">{overallPct}%</span></div>
              <Progress value={overallPct} />
            </div>
          </Card>

          <Card className="p-2 max-h-[70vh] overflow-y-auto">
            <div className="space-y-1">
              {modules.map((m: any, mi: number) => {
                const unlocked = m.isUnlocked ?? mi === 0;
                const passed = m.exam?.passed ?? false;
                const modLessons = m.lessons ?? [];
                const modCompleted = modLessons.filter((l: any) => l.isCompleted).length;
                const modPct = modLessons.length > 0 ? Math.round((modCompleted / modLessons.length) * 100) : 0;
                return (
                  <div key={m.id} className="p-2">
                    <div className="flex items-center gap-2 px-2 py-1 mb-1">
                      {!unlocked && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                      {passed && unlocked && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex-1">
                        Modül {mi + 1}
                      </div>
                      <span className="text-xs text-muted-foreground">{modPct}%</span>
                    </div>
                    <div className="font-medium text-sm px-2 mb-1">{m.title}</div>
                    {unlocked && (
                      <ul className="space-y-0.5">
                        {modLessons.map((l: any) => {
                          const done = l.isCompleted;
                          const active = currentLesson?.id === l.id;
                          return (
                            <li key={l.id}>
                              <button
                                onClick={() => setActiveLessonId(l.id)}
                                className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 transition-colors ${
                                  active ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                                }`}
                              >
                                {done ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> : <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                                <span className="truncate">{l.title}</span>
                              </button>
                            </li>
                          );
                        })}
                        {m.exam && (() => {
                          const allDone = modLessons.length > 0 && modLessons.every((l: any) => l.isCompleted);
                          return (
                          <li>
                            <button
                              onClick={() => allDone && nav({ to: "/learn/$courseId/exam/$examId", params: { courseId, examId: m.exam.id } })}
                              disabled={!allDone}
                              className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 transition-colors ${allDone ? "hover:bg-muted" : "opacity-50 cursor-not-allowed"}`}
                            >
                              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>Modül Sınavı</span>
                              {!allDone && <span className="ml-auto text-[10px] text-muted-foreground">Dersleri bitir</span>}
                              {allDone && m.exam.bestScore != null && (
                                <Badge variant={passed ? "default" : "destructive"} className="ml-auto text-[10px] px-1.5">
                                  {m.exam.bestScore}
                                </Badge>
                              )}
                            </button>
                          </li>
                          );
                        })()}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </aside>

        {/* Lesson Content */}
        <main className="space-y-4">
          {currentLesson && (
            <>
              <Card className="overflow-hidden p-0">
                <div className="aspect-video bg-gradient-to-br from-black via-zinc-900 to-zinc-800 flex items-center justify-center relative group">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_70%)]" />
                  <button
                    onClick={() => !currentLesson.isCompleted && onComplete(currentLesson.id)}
                    className="relative z-10 flex flex-col items-center gap-3 text-white/90 hover:text-white transition-transform hover:scale-105"
                  >
                    <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center shadow-2xl shadow-primary/30">
                      <PlayCircle className="w-12 h-12" />
                    </div>
                    <span className="text-sm font-medium">Videoyu Oynat</span>
                  </button>
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white/70">
                    <span className="px-2 py-1 rounded bg-black/40 backdrop-blur">Modül {currentLesson._mi + 1}</span>
                    <span className="px-2 py-1 rounded bg-black/40 backdrop-blur">{currentLesson.estimatedDuration}:00</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  Modül {currentLesson._mi + 1} · {currentLesson._moduleTitle}
                </div>
                <h1 className="text-2xl font-bold mt-1 mb-4">{currentLesson.title}</h1>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground/90 leading-relaxed">
                  {currentLesson.content}
                </div>
                <div className="mt-6 pt-6 border-t flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tahmini süre: {currentLesson.estimatedDuration} dk</span>
                  {currentLesson.isCompleted ? (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Tamamlandı
                    </Badge>
                  ) : (
                    <Button onClick={() => onComplete(currentLesson.id)}>Dersi Tamamladım</Button>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <MessageSquare className="w-4 h-4" /> Yorumlar
                </h2>
                <div className="flex gap-2 mb-4">
                  <Textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Bir yorum veya soru yaz..." rows={2} />
                  <Button onClick={onComment} size="icon"><Send className="w-4 h-4" /></Button>
                </div>
                <div className="space-y-3">
                  {comments.map((c: any) => (
                    <div key={c.id} className="border-l-2 border-accent/40 pl-3">
                      <div className="text-sm flex items-center gap-2">
                        <span className="font-semibold">{c.userName ?? c.user?.name}</span>
                        {(c.userRole ?? c.user?.role) === "INSTRUCTOR" && <Badge variant="secondary" className="text-[10px] px-1.5">Eğitmen</Badge>}
                        <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString("tr-TR")}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{c.text}</p>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-sm text-muted-foreground">Henüz yorum yok. İlk yorumu sen yaz.</p>
                  )}
                </div>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
