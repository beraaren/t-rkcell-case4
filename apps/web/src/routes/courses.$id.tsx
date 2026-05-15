import { createFileRoute, Navigate, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Star, Clock, BookOpen, Lock, CheckCircle2, Users, Trophy, ChevronDown, ChevronUp, FileText, Sparkles, Briefcase, Layers } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { courses as coursesApi, interactions, me as meApi } from "@/lib/api";

export const Route = createFileRoute("/courses/$id")({ component: CourseDetail });

const levelLabel: Record<string, string> = {
  BEGINNER: "Başlangıç", INTERMEDIATE: "Orta", ADVANCED: "İleri",
};

function CourseCover({ title, coverUrl, className }: { title?: string; coverUrl?: string; className?: string }) {
  const initial = (title?.trim()[0] ?? "?").toUpperCase();
  return (
    <div className={`bg-gradient-to-br from-violet-500 via-violet-600 to-violet-800 flex items-center justify-center overflow-hidden relative ${className ?? ""}`}>
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={title ?? ""}
          className="w-full h-full object-cover"
          onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
        />
      ) : (
        <span className="text-7xl font-bold text-white drop-shadow-lg">{initial}</span>
      )}
    </div>
  );
}

function CourseDetail() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();

  const [course, setCourse] = useState<any>(null);
  const [curriculum, setCurriculum] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [certificate, setCertificate] = useState<any | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [fetching, setFetching] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    setFetching(true);
    Promise.all([
      coursesApi.get(id),
      interactions.getReviews(id).catch(() => []),
      user ? coursesApi.curriculum(id).catch(() => null) : Promise.resolve(null),
      coursesApi.recommendations(id, 4).catch(() => []),
      user ? meApi.certificates().catch(() => []) : Promise.resolve([]),
    ]).then(([c, r, cur, rec, certs]) => {
      if (cancelled) return;
      setCourse(c);
      setReviews(Array.isArray(r) ? r : []);
      if (cur) setCurriculum(cur);
      setRecommended(Array.isArray(rec) ? rec : []);
      const myCert = Array.isArray(certs) ? certs.find((x: any) => x.courseId === id) : null;
      setCertificate(myCert ?? null);
      setFetching(false);
    }).catch(() => { if (!cancelled) setFetching(false); });
    return () => { cancelled = true; };
  }, [id, loading, user]);

  useEffect(() => {
    const onScroll = () => setShowStickyBar(window.scrollY > 360);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const enrolled = !!course?.isEnrolled || !!certificate;

  const modules: any[] = useMemo(() => {
    if (enrolled && curriculum?.modules) return curriculum.modules;
    return course?.modules ?? [];
  }, [enrolled, curriculum, course]);

  const totalLessons = modules.reduce((s, m) => s + (m.lessons?.length ?? 0), 0);
  const totalDuration = modules.reduce((s, m) =>
    s + (m.lessons ?? []).reduce((ls: number, l: any) => ls + (l.estimatedDuration ?? 0), 0), 0);

  const completedLessons = enrolled
    ? modules.reduce((s, m) => s + (m.lessons ?? []).filter((l: any) => l.isCompleted).length, 0)
    : 0;
  const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const allExamsPassed = modules.every((m) => !m.exam || m.exam.passed);
  const courseCompleted = !!certificate || (enrolled && totalLessons > 0 && completedLessons === totalLessons && allExamsPassed);

  if (loading || fetching) return null;
  if (!user) return <Navigate to="/login" />;
  if (!course) return <div className="min-h-screen"><AppHeader /><div className="p-8 text-center">Kurs bulunamadı.</div></div>;

  const instructorName = course.instructor?.name ?? course.instructorName ?? "";
  const rawExp = course.instructor?.meta?.expertise;
  const expertiseList: string[] = Array.isArray(rawExp) ? rawExp : (rawExp ? [String(rawExp)] : []);

  const onEnroll = async () => {
    try {
      await coursesApi.enroll(id);
      toast.success("Kursa kaydoldun!");
      setCourse((prev: any) => ({ ...prev, isEnrolled: true }));
      coursesApi.curriculum(id).then(setCurriculum).catch(() => {});
    } catch (err: any) { toast.error(err.message); }
  };

  const onReview = async () => {
    try {
      await interactions.addReview(id, { rating, text: reviewText.trim() || undefined });
      setReviewText("");
      toast.success("Değerlendirmen kaydedildi");
      interactions.getReviews(id).then((r) => setReviews(Array.isArray(r) ? r : [])).catch(() => {});
    } catch (err: any) { toast.error(err.message); }
  };

  const toggleModule = (mid: string) => {
    setExpandedModules((prev) => {
      const n = new Set(prev);
      n.has(mid) ? n.delete(mid) : n.add(mid);
      return n;
    });
  };

  const isArchived = course?.status === "ARCHIVED";

  const isInstructor = user?.role === "INSTRUCTOR" || user?.role === "ADMIN";

  const CTAButton = ({ className }: { className?: string }) => {
    if (isInstructor) {
      return (
        <Button className={`bg-violet-600 hover:bg-violet-700 ${className ?? ""}`}
          onClick={() => nav({ to: "/learn/$courseId", params: { courseId: id } })}>
          Görüntüle
        </Button>
      );
    }
    if (isArchived && !enrolled) {
      return (
        <Button disabled className={`bg-zinc-500 ${className ?? ""}`}>
          Eğitim Sonlandı
        </Button>
      );
    }
    if (!enrolled) {
      return (
        <Button className={`bg-violet-600 hover:bg-violet-700 ${className ?? ""}`} onClick={onEnroll}>
          Ücretsiz Kayıt Ol
        </Button>
      );
    }
    if (courseCompleted) {
      return (
        <Button className={`bg-green-600 hover:bg-green-700 ${className ?? ""}`}
          onClick={() => nav({ to: "/learn/$courseId", params: { courseId: id } })}>
          <Trophy className="w-4 h-4 mr-1.5" /> Eğitim Bitti · Yeniden İncele
        </Button>
      );
    }
    return (
      <Button className={`bg-violet-600 hover:bg-violet-700 ${className ?? ""}`}
        onClick={() => nav({ to: "/learn/$courseId", params: { courseId: id } })}>
        {progressPct > 0 ? "Devam Ediyor · Sürdür" : "Öğrenmeye Başla"}
      </Button>
    );
  };

  const StatusLabel = () => {
    if (isInstructor) {
      return (
        <div className="text-xs font-semibold flex items-center gap-1.5 text-violet-700 dark:text-violet-300 bg-violet-500/10 border border-violet-500/30 rounded-full px-2.5 py-1 w-fit">
          Eğitmen
        </div>
      );
    }
    if (courseCompleted) {
      return (
        <div className="text-xs font-semibold flex items-center gap-1.5 text-green-700 dark:text-green-400 bg-green-500/10 border border-green-500/30 rounded-full px-2.5 py-1 w-fit">
          <Trophy className="w-3 h-3" /> Eğitim Bitti
        </div>
      );
    }
    if (enrolled && progressPct > 0) {
      return (
        <div className="text-xs font-semibold flex items-center gap-1.5 text-violet-700 dark:text-violet-300 bg-violet-500/10 border border-violet-500/30 rounded-full px-2.5 py-1 w-fit">
          <CheckCircle2 className="w-3 h-3" /> Devam Ediyor · %{progressPct}
        </div>
      );
    }
    if (enrolled) {
      return (
        <div className="text-xs font-semibold flex items-center gap-1.5 text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-full px-2.5 py-1 w-fit">
          Kayıtlısın · Henüz başlamadın
        </div>
      );
    }
    if (isArchived) {
      return (
        <div className="text-xs font-semibold flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 bg-zinc-500/10 border border-zinc-500/30 rounded-full px-2.5 py-1 w-fit">
          Eğitim sonlandırıldı
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <AppHeader />

      {/* Scroll sticky bar */}
      <div className={`hidden md:block fixed top-14 left-0 right-0 z-40 transition-transform duration-200 bg-white dark:bg-zinc-900 border-b shadow-sm ${showStickyBar ? "translate-y-0" : "-translate-y-full"}`}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="font-semibold truncate">{course.title}</div>
          <CTAButton />
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-violet-900 via-violet-800 to-violet-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex flex-wrap gap-2">
              {course.category && <Badge className="bg-white/20 text-white border-0">{course.category}</Badge>}
              {course.level && <Badge className="bg-white/20 text-white border-0">{levelLabel[course.level] ?? course.level}</Badge>}
              {courseCompleted && (
                <Badge className="bg-green-500 text-white border-0">
                  <Trophy className="w-3 h-3 mr-1" /> Tamamlandı
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">{course.title}</h1>
            <p className="text-white/80 text-lg">{course.description}</p>

            <div className="flex flex-wrap items-center gap-5 text-sm text-white/80 pt-2">
              <span className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                  {(instructorName || "?")[0]}
                </div>
                {instructorName}
              </span>
              {avgRating && (
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> {avgRating} ({reviews.length})
                </span>
              )}
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {course._count?.enrollments ?? 0} öğrenci</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {Math.round(totalDuration / 60) || Math.round((course.estimatedDuration ?? 0) / 60)} saat</span>
              <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> {totalLessons} ders</span>
              <span className="flex items-center gap-1.5"><Layers className="w-4 h-4" /> {modules.length} modül</span>
            </div>
          </div>

          {/* Desktop sticky enroll card */}
          <div className="hidden md:block">
            <Card className="p-0 overflow-hidden bg-white text-foreground shadow-2xl sticky top-24">
              <CourseCover title={course.title} coverUrl={course.coverUrl} className="aspect-[16/9]" />
              <div className="p-5 space-y-4">
                <StatusLabel />
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

                <CTAButton className="w-full" />
                {!enrolled && !isArchived && <p className="text-xs text-center text-muted-foreground">Hemen başla, istediğin zaman ilerle</p>}
                {certificate && (
                  <Link to="/profile" className="block">
                    <Button variant="outline" className="w-full">
                      <Trophy className="w-4 h-4 mr-1.5 text-violet-600" /> Sertifikanı Gör
                    </Button>
                  </Link>
                )}

                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Modül sayısı</span><span className="font-medium text-foreground">{modules.length}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Toplam ders</span><span className="font-medium text-foreground">{totalLessons}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tahmini süre</span><span className="font-medium text-foreground">{Math.round((totalDuration || course.estimatedDuration || 0) / 60)} saat</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Sertifika</span>
                    <span className="font-medium text-foreground flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-violet-600" /> Var
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-10">
        {/* Bu kursta neler var? */}
        {modules.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Bu kursta neler var?</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {modules.map((m: any, idx: number) => (
                <div key={m.id} className="flex gap-3 p-4 border rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 flex items-center justify-center shrink-0 text-sm font-bold">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold">{m.title}</div>
                    {m.description && <p className="text-sm text-muted-foreground mt-0.5">{m.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Müfredat */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Müfredat</h2>
          <div className="space-y-2">
            {modules.map((m: any, idx: number) => {
              const unlocked = enrolled ? (m.isUnlocked ?? idx === 0) : true;
              const passed = m.exam?.passed ?? false;
              const expanded = expandedModules.has(m.id);
              const modLessons = m.lessons ?? [];

              return (
                <Card key={m.id} className={`overflow-hidden ${enrolled && !unlocked ? "opacity-70" : ""}`}>
                  <button
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
                    onClick={() => toggleModule(m.id)}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                      passed ? "bg-green-100 text-green-700" : unlocked ? "bg-violet-100 text-violet-700" : "bg-muted text-muted-foreground"
                    }`}>
                      {passed ? <CheckCircle2 className="w-4 h-4" /> : enrolled && !unlocked ? <Lock className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">Modül {idx + 1}: {m.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {modLessons.length} ders
                        {m.exam ? " · Sınav var" : ""}
                        {enrolled && !unlocked ? " · Kilitli" : ""}
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
        </section>

        {/* Eğitmen */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Eğitmen</h2>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-violet-100 dark:bg-violet-950 flex items-center justify-center text-xl font-bold text-violet-700 dark:text-violet-300 shrink-0">
              {(instructorName || "?")[0]}
            </div>
            <div className="min-w-0 space-y-2">
              <div className="font-semibold text-lg">{instructorName}</div>
              {course.instructor?.bio && (
                <p className="text-sm text-muted-foreground">{course.instructor.bio}</p>
              )}
              {expertiseList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {expertiseList.map((e) => (
                    <Badge key={e} variant="secondary" className="text-xs">
                      <Briefcase className="w-3 h-3 mr-1" /> {e}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Önerilen */}
        {recommended.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600" /> Önerilen Kurslar
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {recommended.map((r: any) => (
                <Link key={r.id} to="/courses/$id" params={{ id: r.id }}>
                  <Card className="overflow-hidden p-0 hover:border-violet-500 transition-colors h-full flex flex-col">
                    <CourseCover title={r.title} coverUrl={r.coverUrl} className="aspect-video" />
                    <div className="p-3 flex-1 flex flex-col">
                      {r.category && <Badge variant="secondary" className="self-start text-[10px]">{r.category}</Badge>}
                      <div className="font-semibold mt-2 line-clamp-2">{r.title}</div>
                      <div className="text-xs text-muted-foreground mt-auto pt-2 flex items-center justify-between">
                        <span className="truncate">{r.instructor?.name}</span>
                        <span className="flex items-center gap-1 shrink-0"><Users className="w-3 h-3" /> {r._count?.enrollments ?? 0}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

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

          {enrolled && courseCompleted && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
              <p className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Kursu tamamladın — değerlendirmeni ekle
              </p>
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

          {!enrolled && !isInstructor && (
            <div className="border rounded-lg p-3 bg-muted/40 text-xs text-muted-foreground">
              Değerlendirme yazabilmek için kursa kaydolman gerekir.
            </div>
          )}
          {enrolled && !courseCompleted && (
            <div className="border rounded-lg p-3 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 text-xs text-amber-700 dark:text-amber-300">
              Değerlendirme yapabilmek için tüm dersleri tamamlayıp modül sınavlarını geçmen gerekir.
            </div>
          )}

          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz değerlendirme yok.</p>
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

      {/* Mobile sticky bottom CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-zinc-900 border-t p-3 flex items-center gap-3 shadow-2xl">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground">{course.category}</div>
          <div className="text-sm font-semibold truncate">{course.title}</div>
        </div>
        <CTAButton />
      </div>
    </div>
  );
}
