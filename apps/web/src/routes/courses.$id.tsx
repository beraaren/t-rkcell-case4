import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Star, Clock, BookOpen, Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  const loadData = () => {
    coursesApi.get(id).then(setCourse).catch(() => {});
    if (user) {
      coursesApi.curriculum(id).then(setCurriculum).catch(() => {});
    }
    interactions.getReviews(id).then(setReviews).catch(() => {});
    setFetching(false);
  };

  useEffect(() => {
    if (!loading) loadData();
  }, [id, loading, user]);

  if (loading || fetching) return null;
  if (!user) return <Navigate to="/login" />;
  if (!course) return (
    <div className="min-h-screen"><AppHeader /><div className="p-8 text-center">Kurs bulunamadı.</div></div>
  );

  const enrolled = !!curriculum;
  const modules = curriculum?.modules ?? course.modules ?? [];
  const avgRating = reviews.length > 0 ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

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

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{course.category}</Badge>
              <Badge variant="outline">{course.level}</Badge>
            </div>
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <p className="text-muted-foreground">{course.description}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>👨‍🏫 {course.instructorName ?? course.instructor?.name}</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {Math.round((course.estimatedDuration ?? 0) / 60)} saat</span>
              <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {modules.length} modül</span>
              {avgRating && (
                <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-warning text-warning" /> {avgRating} ({reviews.length})</span>
              )}
            </div>
          </div>
          <Card className="p-5 h-fit space-y-3">
            <div className="aspect-[16/9] bg-gradient-to-br from-accent/40 to-accent/10 rounded-md flex items-center justify-center text-6xl">
              {course.coverEmoji ?? "📚"}
            </div>
            {enrolled ? (
              <Button className="w-full" onClick={() => nav({ to: "/learn/$courseId", params: { courseId: id } })}>
                Öğrenmeye Devam Et
              </Button>
            ) : (
              <Button className="w-full" onClick={onEnroll}>Kursa Kaydol (Ücretsiz)</Button>
            )}
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Müfredat</h2>
          <div className="space-y-3">
            {modules.map((m: any, idx: number) => {
              const unlocked = enrolled ? (m.isUnlocked ?? idx === 0) : idx === 0;
              const passed = m.exam ? (m.exam.passed ?? false) : false;
              return (
                <div key={m.id} className={`border rounded-lg p-4 ${!unlocked ? "opacity-60" : ""}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {!unlocked && <Lock className="w-4 h-4 text-muted-foreground" />}
                    {passed && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    <h3 className="font-semibold">Modül {idx + 1}: {m.title}</h3>
                  </div>
                  {m.description && <p className="text-sm text-muted-foreground mb-3">{m.description}</p>}
                  <ul className="text-sm space-y-1 ml-2">
                    {(m.lessons ?? []).map((l: any) => (
                      <li key={l.id}>
                        {enrolled && unlocked ? (
                          <button
                            onClick={() => nav({ to: "/learn/$courseId", params: { courseId: id } })}
                            className="text-left w-full hover:text-foreground text-muted-foreground hover:underline"
                          >
                            • {l.title} <span className="text-xs">({l.estimatedDuration} dk)</span>
                          </button>
                        ) : (
                          <span className="text-muted-foreground">• {l.title} <span className="text-xs">({l.estimatedDuration} dk)</span></span>
                        )}
                      </li>
                    ))}
                    {m.exam && (
                      <li>
                        {enrolled && unlocked ? (
                          <button
                            onClick={() => nav({ to: "/learn/$courseId/exam/$examId", params: { courseId: id, examId: m.exam.id } })}
                            className="text-left w-full hover:text-foreground text-muted-foreground hover:underline"
                          >
                            📝 Sınav · {m.exam.timeLimitMin} dk
                          </button>
                        ) : (
                          <span className="text-muted-foreground">📝 Sınav · {m.exam.timeLimitMin} dk</span>
                        )}
                      </li>
                    )}
                  </ul>
                  {enrolled && unlocked && (
                    <div className="mt-3">
                      <Button size="sm" variant="outline" onClick={() => nav({ to: "/learn/$courseId", params: { courseId: id } })}>
                        Modüle Başla
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Değerlendirmeler ({reviews.length})</h2>
          {enrolled && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="text-sm">Puan:</span>
                {[1,2,3,4,5].map((n) => (
                  <button key={n} onClick={() => setRating(n)}>
                    <Star className={`w-5 h-5 ${n <= rating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
              <Textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Yorumun (opsiyonel)" rows={2} />
              <Button size="sm" onClick={onReview}>Gönder</Button>
            </div>
          )}
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz değerlendirme yok.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r: any) => (
                <div key={r.id} className="border-b pb-3 last:border-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">{r.userName ?? r.user?.name}</span>
                    <div className="flex">
                      {[1,2,3,4,5].map((n) => (
                        <Star key={n} className={`w-3 h-3 ${n <= r.rating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
                      ))}
                    </div>
                  </div>
                  {r.text && <p className="text-sm text-muted-foreground mt-1">{r.text}</p>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
