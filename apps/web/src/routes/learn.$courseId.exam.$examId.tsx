import { createFileRoute, Navigate, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { ExamTimer } from "@/components/ExamTimer";
import { useAuth } from "@/lib/auth";
import { exams as examsApi } from "@/lib/api";

export const Route = createFileRoute("/learn/$courseId/exam/$examId")({ component: ExamPage });

function ExamPage() {
  const { courseId, examId } = Route.useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const routerState = useRouterState();
  const isChildRoute = routerState.location.pathname !== `/learn/${courseId}/exam/${examId}`;
  if (isChildRoute) return <Outlet />;

  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    examsApi.start(examId)
      .then(({ attempt: a, questions: qs }) => {
        setAttempt(a);
        setQuestions(qs);
        const restored: Record<string, string[]> = {};
        (a.answers ?? []).forEach((ans: any) => { restored[ans.questionId] = ans.selectedOptionIds; });
        setAnswers(restored);
      })
      .catch((e: any) => setError(e.message));
  }, [examId, user?.id]);

  const handleSubmit = async (auto = false) => {
    if (submittingRef.current || !attempt) return;
    submittingRef.current = true;
    const payload = Object.entries(answers).map(([questionId, selectedOptionIds]) => ({
      questionId, selectedOptionIds,
    }));
    try {
      const result = await examsApi.submit(examId, { attemptId: attempt.id, answers: payload });
      if (auto) toast.warning(`Süre doldu! Otomatik gönderildi (${result.score})`);
      else toast.success(`Sınav gönderildi · Skor: ${result.score}`);
      nav({ to: "/learn/$courseId/exam/$examId/result", params: { courseId, examId } });
    } catch (e: any) {
      toast.error(e.message);
      submittingRef.current = false;
    }
  };

  const setAnswer = (q: any, optionId: string, checked: boolean) => {
    setAnswers(prev => {
      const cur = new Set(prev[q.id] ?? []);
      if (q.type === "MULTI_SELECT") {
        if (checked) cur.add(optionId); else cur.delete(optionId);
      } else {
        cur.clear();
        cur.add(optionId);
      }
      return { ...prev, [q.id]: Array.from(cur) };
    });
  };

  const answeredCount = useMemo(
    () => questions.filter(q => (answers[q.id]?.length ?? 0) > 0).length,
    [answers, questions]
  );

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  if (error) {
    return (
      <div className="min-h-screen"><AppHeader />
        <div className="max-w-md mx-auto px-6 py-16 text-center space-y-4">
          <h1 className="text-xl font-semibold">Sınava giremedin</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => nav({ to: "/learn/$courseId", params: { courseId } })}>Kursa Dön</Button>
        </div>
      </div>
    );
  }

  if (!attempt || questions.length === 0) {
    return <div className="min-h-screen"><AppHeader /><div className="p-8">Yükleniyor…</div></div>;
  }

  const q = questions[currentIdx];
  const selected = answers[q.id] ?? [];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="max-w-5xl mx-auto px-4 lg:px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6">
        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Badge variant="secondary">Soru {currentIdx + 1} / {questions.length}</Badge>
                <Badge variant="outline" className="ml-2">
                  {q.type === "MULTIPLE_CHOICE" ? "Tek seçim" : q.type === "TRUE_FALSE" ? "Doğru/Yanlış" : "Çoklu seçim"}
                </Badge>
              </div>
              <ExamTimer expiresAt={attempt.expiresAt} onExpire={() => handleSubmit(true)} />
            </div>
            <h2 className="text-lg font-semibold mb-5">{q.text}</h2>

            {q.type === "MULTI_SELECT" ? (
              <div className="space-y-2">
                {(q.options ?? []).map((opt: any) => (
                  <label key={opt.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selected.includes(opt.id) ? "bg-accent/30 border-accent" : "hover:bg-muted"
                  }`}>
                    <Checkbox
                      checked={selected.includes(opt.id)}
                      onCheckedChange={(c) => setAnswer(q, opt.id, !!c)}
                    />
                    <span>{opt.text}</span>
                  </label>
                ))}
              </div>
            ) : (
              <RadioGroup value={selected[0] ?? ""} onValueChange={(v) => setAnswer(q, v, true)} className="space-y-2">
                {(q.options ?? []).map((opt: any) => (
                  <label key={opt.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selected.includes(opt.id) ? "bg-accent/30 border-accent" : "hover:bg-muted"
                  }`}>
                    <RadioGroupItem value={opt.id} />
                    <span>{opt.text}</span>
                  </label>
                ))}
              </RadioGroup>
            )}

            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Önceki
              </Button>
              {currentIdx < questions.length - 1 ? (
                <Button onClick={() => setCurrentIdx(i => i + 1)}>
                  Sonraki <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={() => handleSubmit(false)}>
                  Sınavı Gönder
                </Button>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-3">
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-2">Cevaplanan: {answeredCount}/{questions.length}</div>
            <div className="grid grid-cols-5 gap-1.5">
              {questions.map((qq: any, i: number) => {
                const ans = (answers[qq.id]?.length ?? 0) > 0;
                const cur = i === currentIdx;
                return (
                  <button
                    key={qq.id}
                    onClick={() => setCurrentIdx(i)}
                    className={`aspect-square rounded text-xs font-semibold transition-colors ${
                      cur ? "bg-foreground text-background"
                      : ans ? "bg-green-500/20 text-green-600 border border-green-500/30"
                      : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </Card>
          <Button variant="outline" className="w-full" onClick={() => handleSubmit(false)}>
            Şimdi Gönder
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Süre dolduğunda otomatik gönderilir.
          </p>
        </div>
      </div>
    </div>
  );
}
