import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  findExam,
  findModule,
  findCourse,
  shuffled,
  gradeExam,
  mutate,
  useEducellState,
  checkCourseCompletion,
  type Exam,
  type Question,
} from "@/lib/educell-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Timer, CheckCircle2, XCircle, Trophy, RotateCw, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/exam/$examId")({
  component: ExamPage,
  loader: ({ params }) => {
    const e = findExam(params.examId);
    if (!e) throw notFound();
    const m = findModule(e.module_id)!;
    const c = findCourse(m.course_id)!;
    return { exam: e, moduleTitle: m.title, courseId: c.id, courseTitle: c.title };
  },
});

interface LoaderData {
  exam: Exam;
  moduleTitle: string;
  courseId: string;
  courseTitle: string;
}

type Phase = "intro" | "running" | "done";

function ExamPage() {
  const data = Route.useLoaderData() as LoaderData;
  const { exam, moduleTitle, courseId, courseTitle } = data;
  const state = useEducellState();
  const nav = useNavigate();

  const previousAttempts = state.attempts.filter((a) => a.exam_id === exam.id);
  const bestScore = previousAttempts.reduce((m, a) => Math.max(m, a.score), 0);
  const attemptsLeft = exam.max_attempts - previousAttempts.length;
  const passed = previousAttempts.some((a) => a.passed);

  const [phase, setPhase] = useState<Phase>("intro");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [remaining, setRemaining] = useState(exam.time_limit_min * 60);
  const [result, setResult] = useState<ReturnType<typeof gradeExam> | null>(null);
  const startedAtRef = useRef<number>(0);
  const submittedRef = useRef(false);

  const start = () => {
    if (attemptsLeft <= 0) {
      toast.error("Sınav hakkın kalmadı");
      return;
    }
    const qs = exam.shuffle ? shuffled(exam.questions) : exam.questions;
    setQuestions(qs);
    setAnswers({});
    setCurrent(0);
    setRemaining(exam.time_limit_min * 60);
    startedAtRef.current = Date.now();
    submittedRef.current = false;
    setPhase("running");
  };

  // Timer (server-side simulation: süre dolduğunda kesinlikle gönder)
  useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          submit(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const submit = (auto = false) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const r = gradeExam(exam, answers);
    setResult(r);
    const passedNow = r.score >= exam.passing_score;
    mutate((s) => ({
      ...s,
      attempts: [
        ...s.attempts,
        {
          id: crypto.randomUUID(),
          exam_id: exam.id,
          course_id: courseId,
          started_at: startedAtRef.current,
          submitted_at: Date.now(),
          score: r.score,
          passed: passedNow,
          answers,
        },
      ],
    }));
    setPhase("done");
    if (auto) toast.warning("Süre doldu, sınav otomatik gönderildi");
    else toast[passedNow ? "success" : "error"](passedNow ? "Tebrikler, geçtin!" : "Geçemedin, tekrar dene");
    if (passedNow) checkCourseCompletion(courseId);
  };

  const progressPct = useMemo(
    () => (questions.length === 0 ? 0 : Math.round(((current + 1) / questions.length) * 100)),
    [current, questions.length],
  );

  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <Link to="/learn/$courseId" params={{ courseId }} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Kursa dön
        </Link>
        <div className="mt-4 rounded-2xl border border-border bg-card p-8 shadow-card">
          <Badge className="bg-brand text-brand-foreground hover:bg-brand">{moduleTitle}</Badge>
          <h1 className="mt-3 text-3xl font-bold font-display">{exam.title}</h1>
          <p className="text-muted-foreground mt-1">{courseTitle}</p>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Süre" value={`${exam.time_limit_min} dk`} />
            <Stat label="Soru" value={String(exam.questions.length)} />
            <Stat label="Geçme" value={`%${exam.passing_score}`} />
            <Stat label="Kalan hak" value={`${attemptsLeft}/${exam.max_attempts}`} />
          </div>

          {previousAttempts.length > 0 && (
            <div className="mt-5 p-3 rounded-lg bg-accent text-sm">
              En yüksek puanın: <span className="font-bold">%{bestScore}</span>
              {passed && <Badge className="ml-2 bg-success text-success-foreground">Geçtin</Badge>}
            </div>
          )}

          <div className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
            <p>Sınav başladıktan sonra zamanlayıcı server-side çalışır. Süre dolduğunda cevapların otomatik gönderilir.</p>
          </div>

          <Button
            onClick={start}
            disabled={attemptsLeft <= 0}
            className="mt-6 w-full bg-primary text-primary-foreground hover:bg-primary/90"
            size="lg"
          >
            Sınava Başla
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "running") {
    const q = questions[current];
    const picked = answers[q.id] ?? [];
    const togglePick = (optId: string) => {
      setAnswers((prev) => {
        const cur = prev[q.id] ?? [];
        if (q.type === "MULTI_SELECT") {
          return {
            ...prev,
            [q.id]: cur.includes(optId) ? cur.filter((x) => x !== optId) : [...cur, optId],
          };
        }
        return { ...prev, [q.id]: [optId] };
      });
    };

    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const lowTime = remaining < 60;

    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6">
        {/* Sticky timer */}
        <div className="sticky top-16 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-background/90 backdrop-blur border-b border-border flex items-center gap-4">
          <div className={`font-mono text-2xl font-bold tabular-nums flex items-center gap-2 ${lowTime ? "text-destructive animate-pulse" : ""}`}>
            <Timer className="h-5 w-5" />
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </div>
          <div className="flex-1">
            <div className="text-xs text-muted-foreground mb-1">Soru {current + 1} / {questions.length}</div>
            <Progress value={progressPct} className="h-1.5" />
          </div>
          <Button variant="outline" size="sm" onClick={() => submit(false)}>Gönder</Button>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline">{questionTypeLabel(q.type)}</Badge>
            <span className="text-xs text-muted-foreground">{exam.title}</span>
          </div>
          <h2 className="text-xl font-semibold leading-snug text-balance">{q.text}</h2>

          <div className="mt-6 space-y-2">
            {q.type === "MULTI_SELECT" ? (
              q.options.map((o) => {
                const checked = picked.includes(o.id);
                return (
                  <label
                    key={o.id}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition ${
                      checked ? "border-primary bg-accent" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <Checkbox checked={checked} onCheckedChange={() => togglePick(o.id)} />
                    <span className="text-sm">{o.text}</span>
                  </label>
                );
              })
            ) : (
              <RadioGroup value={picked[0] ?? ""} onValueChange={(v) => togglePick(v)}>
                {q.options.map((o) => {
                  const checked = picked[0] === o.id;
                  return (
                    <label
                      key={o.id}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition ${
                        checked ? "border-primary bg-accent" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <RadioGroupItem value={o.id} id={o.id} />
                      <Label htmlFor={o.id} className="text-sm cursor-pointer flex-1">{o.text}</Label>
                    </label>
                  );
                })}
              </RadioGroup>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <Button variant="outline" disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>
              Önceki
            </Button>
            <div className="flex gap-1.5 max-w-[60%] flex-wrap justify-center">
              {questions.map((qq, i) => {
                const ans = (answers[qq.id] ?? []).length > 0;
                return (
                  <button
                    key={qq.id}
                    onClick={() => setCurrent(i)}
                    className={`h-7 w-7 rounded-md text-xs font-semibold border transition ${
                      i === current
                        ? "bg-primary text-primary-foreground border-primary"
                        : ans
                        ? "bg-accent border-primary/30"
                        : "bg-card border-border"
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            {current < questions.length - 1 ? (
              <Button onClick={() => setCurrent((c) => c + 1)}>Sonraki</Button>
            ) : (
              <Button className="bg-success text-success-foreground hover:bg-success/90" onClick={() => submit(false)}>
                Sınavı Bitir
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // DONE
  if (!result) return null;
  const passedNow = result.score >= exam.passing_score;
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-card text-center">
        {passedNow ? (
          <Trophy className="h-14 w-14 text-brand mx-auto" />
        ) : (
          <XCircle className="h-14 w-14 text-destructive mx-auto" />
        )}
        <h1 className="mt-4 text-3xl font-bold font-display">
          {passedNow ? "Tebrikler, geçtin!" : "Tekrar denemelisin"}
        </h1>
        <p className="text-muted-foreground mt-1">{exam.title} · {moduleTitle}</p>

        <div className="mt-8 grid grid-cols-3 gap-4">
          <ResultStat label="Puan" value={`%${result.score}`} accent={passedNow ? "success" : "destructive"} />
          <ResultStat label="Doğru" value={`${result.breakdown.filter((b) => b.pts === 1).length}`} />
          <ResultStat label="Kısmî" value={`${result.breakdown.filter((b) => b.pts > 0 && b.pts < 1).length}`} />
        </div>

        <div className="mt-6 flex justify-center gap-3 flex-wrap">
          {!passedNow && attemptsLeft - 1 > 0 && (
            <Button onClick={start} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <RotateCw className="h-4 w-4" /> Tekrar Dene ({attemptsLeft - 1} hak)
            </Button>
          )}
          <Button variant="outline" onClick={() => nav({ to: "/learn/$courseId", params: { courseId } })}>
            Kursa Dön
          </Button>
        </div>
      </div>

      <h2 className="text-xl font-bold font-display mt-10 mb-4">Soru bazlı geri bildirim</h2>
      <div className="space-y-3">
        {result.breakdown.map((b, i) => (
          <div key={b.question.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              {b.pts === 1 ? (
                <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
              ) : b.pts === 0 ? (
                <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">Soru {i + 1}</div>
                <div className="font-medium">{b.question.text}</div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Doğru: {b.question.options.filter((o) => o.is_correct).map((o) => o.text).join(", ")}
                </div>
              </div>
              <Badge variant="outline">{Math.round(b.pts * 100)}%</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function questionTypeLabel(t: Question["type"]) {
  return t === "MULTIPLE_CHOICE" ? "Çoktan seçmeli" : t === "TRUE_FALSE" ? "Doğru / Yanlış" : "Çoklu seçim";
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-accent p-3 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-bold font-display mt-0.5">{value}</div>
    </div>
  );
}

function ResultStat({ label, value, accent }: { label: string; value: string; accent?: "success" | "destructive" }) {
  return (
    <div className={`rounded-xl p-4 ${accent === "success" ? "bg-success/10" : accent === "destructive" ? "bg-destructive/10" : "bg-accent"}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-3xl font-bold font-display mt-1">{value}</div>
    </div>
  );
}
