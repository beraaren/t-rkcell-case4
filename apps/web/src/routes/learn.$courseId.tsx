import { createFileRoute, Link, Navigate, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Lock, CheckCircle2, Circle, FileText, MessageSquare, Send, PlayCircle, NotebookPen, Save, CornerDownRight } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { courses as coursesApi, lessons as lessonsApi, interactions, notes as notesApi } from "@/lib/api";
import { LessonChat } from "@/components/LessonChat";

export const Route = createFileRoute("/learn/$courseId")({
  component: LearnPage,
  validateSearch: (s: Record<string, unknown>): { lessonId?: string } => ({
    ...(s.lessonId ? { lessonId: s.lessonId as string } : {}),
  }),
});

function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  // YouTube
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  // Vimeo
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

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
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [fetching, setFetching] = useState(true);
  const noteTimer = useRef<any>(null);

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
      notesApi.get(currentLesson.id).then((n) => setNoteText(n?.text ?? "")).catch(() => setNoteText(""));
      // ders meta — videoUrl için tekrar fetch
      lessonsApi.get(currentLesson.id).then((full) => {
        setCurriculum((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            modules: prev.modules.map((m: any) => ({
              ...m,
              lessons: m.lessons.map((l: any) => l.id === currentLesson.id ? { ...l, videoUrl: full.videoUrl, content: full.content } : l),
            })),
          };
        });
      }).catch(() => {});
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

  const onReply = async (parentId: string) => {
    if (!replyText.trim()) return;
    try {
      await interactions.replyComment(parentId, { text: replyText.trim() });
      setReplyText("");
      setReplyTo(null);
      interactions.getComments(currentLesson.id).then(setComments).catch(() => {});
    } catch (err: any) { toast.error(err.message); }
  };

  const saveNote = async (text: string) => {
    if (!currentLesson) return;
    setNoteSaving(true);
    try {
      await notesApi.upsert(currentLesson.id, text);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setNoteSaving(false);
    }
  };

  const onNoteChange = (text: string) => {
    setNoteText(text);
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => saveNote(text), 800);
  };

  const embedUrl = currentLesson?.videoUrl ? getEmbedUrl(currentLesson.videoUrl) : null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="max-w-[1500px] mx-auto px-4 lg:px-6 py-6 grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-6">
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
        <main className="space-y-4 min-w-0">
          {currentLesson && (
            <>
              <Card className="overflow-hidden p-0">
                {embedUrl ? (
                  <div className="aspect-video bg-black">
                    <iframe
                      src={embedUrl}
                      title={currentLesson.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  </div>
                ) : (
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
                )}
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
                <div className="space-y-4">
                  {comments.map((c: any) => (
                    <div key={c.id} className="border-l-2 border-accent/40 pl-3">
                      <div className="text-sm flex items-center gap-2">
                        <span className="font-semibold">{c.userName ?? c.user?.name}</span>
                        {(c.userRole ?? c.user?.role) === "INSTRUCTOR" && <Badge variant="secondary" className="text-[10px] px-1.5">Eğitmen</Badge>}
                        <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString("tr-TR")}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{c.text}</p>

                      <button
                        className="mt-1 text-xs text-violet-600 hover:underline flex items-center gap-1"
                        onClick={() => { setReplyTo(replyTo === c.id ? null : c.id); setReplyText(""); }}
                      >
                        <CornerDownRight className="w-3 h-3" /> Yanıtla
                      </button>

                      {replyTo === c.id && (
                        <div className="flex gap-2 mt-2">
                          <Textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Yanıt yaz..."
                            rows={2}
                          />
                          <Button size="icon" onClick={() => onReply(c.id)}><Send className="w-4 h-4" /></Button>
                        </div>
                      )}

                      {c.replies?.length > 0 && (
                        <div className="mt-3 ml-4 space-y-3 border-l border-accent/30 pl-3">
                          {c.replies.map((r: any) => (
                            <div key={r.id}>
                              <div className="text-sm flex items-center gap-2">
                                <span className="font-semibold">{r.user?.name}</span>
                                {r.user?.role === "INSTRUCTOR" && <Badge variant="secondary" className="text-[10px] px-1.5 bg-violet-100 text-violet-700">Eğitmen</Badge>}
                                <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString("tr-TR")}</span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{r.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
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

        {/* Right sidebar: Notes */}
        <aside className="space-y-3">
          <Card className="p-4 sticky top-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <NotebookPen className="w-4 h-4 text-violet-600" /> Not Defterim
              </h3>
              {noteSaving ? (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Save className="w-3 h-3 animate-pulse" /> kaydediliyor
                </span>
              ) : noteText.length > 0 ? (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> kayıtlı
                </span>
              ) : null}
            </div>
            <Textarea
              value={noteText}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Bu ders için notlarını yaz... Otomatik kaydedilir."
              rows={18}
              className="resize-none text-sm"
            />
            <p className="text-[11px] text-muted-foreground mt-2">
              Notların sana özeldir, her derste ayrı kaydedilir.
            </p>
          </Card>
        </aside>
      </div>

      {currentLesson && (
        <LessonChat
          lessonId={currentLesson.id}
          contextLabel={`${currentLesson._moduleTitle} · ${currentLesson.title}`}
        />
      )}
    </div>
  );
}
