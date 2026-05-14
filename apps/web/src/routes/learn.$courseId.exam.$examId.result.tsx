import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Trophy, RotateCcw, Award } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { exams as examsApi, me as meApi } from "@/lib/api";

export const Route = createFileRoute("/learn/$courseId/exam/$examId/result")({
  component: ResultPage,
});

function ResultPage() {
  const { courseId, examId } = Route.useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();

  const [result, setResult] = useState<any>(null);
  const [certs, setCerts] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && user) {
      Promise.all([
        examsApi.result(examId),
        meApi.certificates(),
      ]).then(([r, cs]) => {
        setResult(r);
        setCerts(cs);
      }).catch(() => {}).finally(() => setFetching(false));
    }
  }, [examId, loading, user]);

  if (loading || fetching) return null;
  if (!user) return <Navigate to="/login" />;
  if (!result) return <div className="min-h-screen"><AppHeader /><div className="p-8">Sonuç bulunamadı.</div></div>;

  const { attempt, exam, passed, score, correct, total } = result;
  const cert = certs.find((c: any) => c.courseId === courseId);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-5">
        <Card className={`p-8 text-center ${passed ? "bg-green-500/5 border-green-500/30" : "bg-destructive/5 border-destructive/30"}`}>
          {passed ? <Trophy className="w-12 h-12 mx-auto text-green-500" /> : <XCircle className="w-12 h-12 mx-auto text-destructive" />}
          <h1 className="text-2xl font-bold mt-3">{passed ? "Tebrikler, geçtin!" : "Bu sefer olmadı"}</h1>
          <div className="mt-4 text-5xl font-bold tabular-nums">{score}<span className="text-lg text-muted-foreground">/100</span></div>
          <div className="mt-2 text-sm text-muted-foreground">
            Geçme notu: %{exam?.passingScore} · {correct}/{total} tam doğru
            {attempt?.status === "EXPIRED" && <Badge variant="destructive" className="ml-2">Süre doldu</Badge>}
          </div>
        </Card>

        {cert && (
          <Card className="p-6 bg-gradient-to-br from-accent/30 to-accent/5 border-accent">
            <div className="flex items-center gap-3">
              <Award className="w-10 h-10 text-accent-foreground" />
              <div className="flex-1">
                <h2 className="font-bold text-lg">🎓 Sertifikan Hazır!</h2>
                <p className="text-sm text-muted-foreground">Sertifika No: <span className="font-mono">{cert.number}</span></p>
              </div>
              <Button asChild><Link to="/profile">Profilde Gör</Link></Button>
            </div>
          </Card>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => nav({ to: "/learn/$courseId", params: { courseId } })}>
            Kursa Dön
          </Button>
          {!passed && (
            <Button onClick={() => nav({ to: "/learn/$courseId/exam/$examId", params: { courseId, examId } })}>
              <RotateCcw className="w-4 h-4 mr-1" /> Tekrar Dene
            </Button>
          )}
        </div>

        {result.questions && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Soru Bazlı Geri Bildirim</h2>
            <div className="space-y-3">
              {result.questions.map((q: any, i: number) => {
                const sel = new Set(q.selectedOptionIds ?? []);
                const correctIds = new Set((q.options ?? []).filter((o: any) => o.isCorrect).map((o: any) => o.id));
                const fullyCorrect = sel.size === correctIds.size && [...sel].every((s) => correctIds.has(s));
                return (
                  <div key={q.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      {fullyCorrect ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />}
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1">Soru {i + 1}</div>
                        <p className="font-medium text-sm">{q.text}</p>
                        <div className="mt-3 space-y-1">
                          {(q.options ?? []).map((opt: any) => {
                            const isSel = sel.has(opt.id);
                            const isCorrect = correctIds.has(opt.id);
                            return (
                              <div
                                key={opt.id}
                                className={`text-sm px-3 py-1.5 rounded ${
                                  isCorrect ? "bg-green-500/10 text-green-600 border border-green-500/20"
                                  : isSel ? "bg-destructive/10 text-destructive border border-destructive/20"
                                  : "text-muted-foreground"
                                }`}
                              >
                                {opt.text}
                                {isCorrect && <span className="ml-2 text-xs">✓ Doğru</span>}
                                {isSel && !isCorrect && <span className="ml-2 text-xs">Senin cevabın</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
