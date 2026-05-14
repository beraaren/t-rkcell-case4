import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Star, Clock, BookOpen, Lock, CheckCircle2, Users, Trophy, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { courses as coursesApi, interactions } from "@/lib/api";

export const Route = createFileRoute("/courses/$id")({ component: CourseDetail });

function CourseDetail() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();

  const [course, setCourse] = useState<any>(null);
  const [curriculum, setCurriculum] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [fetching, setFetching] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const loadData = () => {
    coursesApi.get(id).then(setCourse).catch(() => {});
    if (user) coursesApi.curriculum(id).then(setCurriculum).catch(() => {});
    interactions.getReviews(id).then(setReviews).catch(() => {});
    setFetching(false);
  };

  useEffect(() => {
    if (!loading) loadData();
  }, [id, loading, user]);

  if (loading || fetching) return null;
  if (!user) return <Navigate to="/login" />;
  if (!course) return <div className="min-h-screen"><AppHeader /><div className="p-8 text-center">Kurs bulunamadı.</div></div>;

  const enrolled = !!curriculum;
  const modules = curriculum?.modules ?? course.modules ?? [];
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const totalLessons = modules.reduce((s: number, m: any) => s + (m.lessons?.length ?? 0), 0);
  const totalDuration = modules.reduce((s: number, m: any) =>
    s + (m.lessons ?? []).reduce((ls: number, l: any) => ls + (l.estimatedDuration ?? 0), 0), 0);

  const completedLessons = enrolled
    ? modules.reduce((s: number, m: any) => s + (m.lessons ?? []).filter((l: any) => l.isCompleted).length, 0)
    : 0;
  const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const onEnroll = async () => {
    try {
      await coursesApi.enroll(id);
      toast.success("Kursa kaydoldun!");
      coursesApi.curriculum(id).then(setCurriculum).catch(() => {});
    } catch (err: any) { toast.error(err.message); }
  };

  const onReview = async () => {
    try {
      await interactions.addReview(id, { rating, text: reviewText.trim() || undefined });
      setReviewText("");
      toast.success("Değerlendirmen kaydedildi");
      interactions.getReviews(id).then(setReviews).catch(() => {});
    } catch (err: any) { toast.error(err.message); }
  };

  const toggleModule = (mid: string) => {
    setExpandedModules(prev => {
      const n = new Set(prev);
      n.has(mid) ? n.delete(mid) : n.add(mid);
      return n;
    });
  };

  const levelLabel: Record<string, string> = {
    BEGINNER: "Başlangıç", INTERMEDIATE: "Orta", ADVANCED: "İleri"
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Hero */}
      <div className="bg-gradient-to-br from-violet-900 via-violet-800 to-violet-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-white/20 text-white border-0">{course.category}</Badge>
              <Badge className="bg-white/20 text-white border-0">{levelLabel[course.level] ?? course.level}</Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">{course.title}</h1>
            <p className="text-white/80 text-lg">{course.description}</p>

            <div className="flex flex-wrap items-center gap-5 text-sm text-white/70 pt-2">
              <span className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                  {(course.instructorName ?? course.instructor?.name ?? "?")[0]}
                </div>
                {course.instructorName ?? course.instructor?.name}
              </span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {Math.round(totalDuration / 60)} saat</span>
              <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> {totalLessons} ders</span>
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {course.enrollmentCount ?? 0} kayıt</span>
              {avgRating && (
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> {avgRating} ({reviews.length})
                </span>
              )}
            </div>
          </div>

          {/* Kayıt kartı */}
          <Card className="p-6 h-fit space-y-4 bg-white text-foreground shadow-2xl">
            <div className="aspect-video rounded-lg bg-gradient-to-br from-violet-100 to-violet-200 flex items-center justify-center text-6xl">
              {course.coverEmoji ?? "📚"}
            </div>

            {enrolled && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">İlerleme</span>
                  <span className="font-semibold">%{progressPct}</span>
                </div>
                <Progress value={progressPct} className="h-2" />
                <div className="text-xs text-muted-foreground">{completedLessons}/{totalLessons} ders tamamlandı</div>
              </div>
            )}

            {enrolled ? (
              <Button className="w-full bg-violet-600 hover:bg-violet-700"
                onClick={() => nav({ to: "/learn/$courseId", params: { courseId: id } })}>
                {progressPct > 0 ? "Devam Et" : "Öğrenmeye Başla"}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button className="w-full bg-violet-600 hover:bg-violet-700" onClick={onEnroll}>
                  Ücretsiz Kayıt Ol
                </Button>
                <p className="text-xs text-center text-muted-foreground">Hemen başla, istediğin zaman ilerle</p>
              </div>
            )}

            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Modül sayısı</span><span className="font-medium text-foreground">{modules.length}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Toplam ders</span><span className="font-medium text-foreground">{totalLessons}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tahmini süre</span><span className="font-medium text-foreground">{Math.round(totalDuration / 60)} saat</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Sertifika</span>
                <span className="font-medium text-foreground flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-violet-600" /> Var
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Müfredat */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Müfredat</h2>
          <div className="space-y-2">
            {modules.map((m: any, idx: number) => {
              const unlocked = enrolled ? (m.isUnlocked ?? idx === 0) : idx === 0;
              const passed = m.exam?.passed ?? false;
              const expanded = expandedModules.has(m.id);
              const modLessons = m.lessons ?? [];

              return (
                <Card key={m.id} className={`overflow-hidden ${!unlocked ? "opacity-70" : ""}`}>
                  <button
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
                    onClick={() => toggleModule(m.id)}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                      passed ? "bg-green-100 text-green-700" : unlocked ? "bg-violet-100 text-violet-700" : "bg-muted text-muted-foreground"
                    }`}>
                      {passed ? <CheckCircle2 className="w-4 h-4" /> : !unlocked ? <Lock className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">Modül {idx + 1}: {m.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {modLessons.length} ders
                        {m.exam ? " · Sınav var" : ""}
                        {!unlocked ? " · Kilitli" : ""}
                      </div>
                    </div>
                    {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>

                  {expanded && (
                    <div className="border-t px-4 py-3 space-y-1 bg-muted/20">
                      {modLessons.map((l: any) => (
                        <div key={l.id} className="flex items-center gap-2 py-1.5 text-sm">
                          {enrolled && l.isCompleted
                            ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                            : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />}
                          <span className={enrolled && l.isCompleted ? "line-through text-muted-foreground" : ""}>{l.title}</span>
                          <span className="ml-auto text-xs text-muted-foreground">{l.estimatedDuration} dk</span>
                        </div>
                      ))}
                      {m.exam && (
                        <div className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground border-t mt-1 pt-2">
                          <FileText className="w-4 h-4 shrink-0" />
                          <span>Modül Sınavı</span>
                          <span className="text-xs ml-auto">{m.exam.timeLimitMin} dk</span>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Eğitmen */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Eğitmen</h2>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center text-xl font-bold text-violet-700 shrink-0">
              {(course.instructorName ?? course.instructor?.name ?? "?")[0]}
            </div>
            <div>
              <div className="font-semibold text-lg">{course.instructorName ?? course.instructor?.name}</div>
              {course.instructor?.bio && (
                <p className="text-sm text-muted-foreground mt-1">{course.instructor.bio}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Değerlendirmeler */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Değerlendirmeler</h2>
            {avgRating && (
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold">{avgRating}</div>
                <div>
                  <div className="flex">
                    {[1,2,3,4,5].map((n) => (
                      <Star key={n} className={`w-4 h-4 ${Number(avgRating) >= n ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">{reviews.length} değerlendirme</div>
                </div>
              </div>
            )}
          </div>

          {enrolled && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
              <p className="text-sm font-medium">Değerlendirmeni ekle</p>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((n) => (
                  <button key={n} onClick={() => setRating(n)}>
                    <Star className={`w-6 h-6 transition-colors ${n <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
              <Textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Deneyimini paylaş…" rows={2} />
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700" onClick={onReview}>Gönder</Button>
            </div>
          )}

          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz değerlendirme yok. İlk yorumu sen yap!</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((r: any) => (
                <div key={r.id} className="flex gap-3 pb-4 border-b last:border-0">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                    {(r.userName ?? r.user?.name ?? "?")[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{r.userName ?? r.user?.name}</span>
                      <div className="flex">
                        {[1,2,3,4,5].map((n) => (
                          <Star key={n} className={`w-3 h-3 ${n <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                        ))}
                      </div>
                    </div>
                    {r.text && <p className="text-sm text-muted-foreground mt-1">{r.text}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
