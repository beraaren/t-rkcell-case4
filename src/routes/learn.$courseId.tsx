import { createFileRoute, Link, notFound, useNavigate, useSearch } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  findCourse,
  useEducellState,
  mutate,
  courseProgress,
  isModuleUnlocked,
  checkCourseCompletion,
  type Course,
} from "@/lib/educell-data";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  PlayCircle,
  Lock,
  FileQuestion,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

interface Search {
  lessonId?: string;
}

export const Route = createFileRoute("/learn/$courseId")({
  component: Learn,
  validateSearch: (s: Record<string, unknown>): Search => ({
    lessonId: typeof s.lessonId === "string" ? s.lessonId : undefined,
  }),
  loader: ({ params }) => {
    const c = findCourse(params.courseId);
    if (!c) throw notFound();
    return { course: c };
  },
});

function Learn() {
  const { course } = Route.useLoaderData() as { course: Course };
  const search = useSearch({ from: "/learn/$courseId" });
  const state = useEducellState();
  const nav = useNavigate();

  // Compute current lesson
  const flatLessons = useMemo(
    () => course.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleIndex: course.modules.indexOf(m) }))),
    [course],
  );
  const currentLesson =
    flatLessons.find((l) => l.id === search.lessonId) ?? flatLessons[0];

  const moduleIndex = currentLesson.moduleIndex;
  const unlocked = isModuleUnlocked(course.id, moduleIndex);
  const progress = courseProgress(course.id);

  const idx = flatLessons.findIndex((l) => l.id === currentLesson.id);
  const prev = idx > 0 ? flatLessons[idx - 1] : null;
  const next = idx < flatLessons.length - 1 ? flatLessons[idx + 1] : null;

  const isDone = state.completed_lessons.includes(currentLesson.id);

  const markDone = () => {
    if (isDone) return;
    mutate((s) => ({ ...s, completed_lessons: [...s.completed_lessons, currentLesson.id] }));
    toast.success("Ders tamamlandı!");
    const cert = checkCourseCompletion(course.id);
    if (cert) toast.success(`🎓 Sertifikan hazır: ${cert.number}`);
  };

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-2xl text-center py-24 px-6">
        <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">Bu modül henüz kilitli</h1>
        <p className="text-muted-foreground mt-2">
          Önceki modülün sınavını başarıyla geçmen gerekiyor.
        </p>
        <Button className="mt-6" asChild>
          <Link to="/learn/$courseId" params={{ courseId: course.id }} search={{}}>
            Müfredata Dön
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 grid lg:grid-cols-[320px_1fr] gap-6">
      {/* SIDEBAR */}
      <aside className="lg:sticky lg:top-20 h-fit rounded-2xl border border-border bg-card p-4 shadow-card">
        <Link to="/courses/$courseId" params={{ courseId: course.id }} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Kurs sayfası
        </Link>
        <h2 className="font-bold font-display mt-2 leading-tight">{course.title}</h2>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">İlerleme</span>
          <span className="font-semibold">%{progress}</span>
        </div>
        <Progress value={progress} className="h-1.5 mt-1" />

        <div className="mt-5 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {course.modules.map((m, mi) => {
            const mUnlocked = isModuleUnlocked(course.id, mi);
            const examPassed = state.attempts.some((a) => a.exam_id === m.exam.id && a.passed);
            return (
              <div key={m.id}>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {mUnlocked ? `Modül ${mi + 1}` : <><Lock className="h-3 w-3" /> Modül {mi + 1}</>}
                </div>
                <div className="font-semibold text-sm mt-0.5">{m.title}</div>
                <ul className="mt-2 space-y-0.5">
                  {m.lessons.map((l) => {
                    const done = state.completed_lessons.includes(l.id);
                    const active = l.id === currentLesson.id;
                    return (
                      <li key={l.id}>
                        <Link
                          to="/learn/$courseId"
                          params={{ courseId: course.id }}
                          search={{ lessonId: l.id }}
                          disabled={!mUnlocked}
                          className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition ${
                            active
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-accent"
                          } ${!mUnlocked ? "opacity-50 pointer-events-none" : ""}`}
                        >
                          {done ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                          ) : (
                            <PlayCircle className="h-3.5 w-3.5 shrink-0 opacity-60" />
                          )}
                          <span className="truncate">{l.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                  <li>
                    <Link
                      to="/exam/$examId"
                      params={{ examId: m.exam.id }}
                      disabled={!mUnlocked}
                      className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition ${
                        examPassed ? "text-success" : "text-brand"
                      } hover:bg-accent ${!mUnlocked ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      <FileQuestion className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{m.exam.title}</span>
                      {examPassed && <CheckCircle2 className="h-3.5 w-3.5 ml-auto" />}
                    </Link>
                  </li>
                </ul>
              </div>
            );
          })}
        </div>
      </aside>

      {/* CONTENT */}
      <article className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className={`h-2 bg-gradient-to-r ${course.cover}`} />
        <div className="p-6 sm:p-10">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            Modül {moduleIndex + 1}: {course.modules[moduleIndex].title}
            <ChevronRight className="h-3 w-3" />
            Ders {currentLesson.order}
          </div>
          <h1 className="mt-2 text-3xl font-bold font-display tracking-tight">{currentLesson.title}</h1>
          <div className="text-sm text-muted-foreground mt-1">{currentLesson.duration_min} dakika</div>

          <div className="prose prose-sm max-w-none mt-8 leading-relaxed">
            {currentLesson.content.split("\n").map((line, i) => {
              if (line.startsWith("## "))
                return <h2 key={i} className="text-xl font-bold mt-6 mb-3">{line.slice(3)}</h2>;
              if (line.startsWith("- "))
                return <li key={i} className="ml-6 list-disc">{line.slice(2)}</li>;
              if (line.startsWith("> "))
                return <blockquote key={i} className="border-l-4 border-brand pl-4 italic text-muted-foreground my-4">{line.slice(2)}</blockquote>;
              if (line.startsWith("```"))
                return null;
              if (line.match(/^function /) || line.startsWith("// ")) {
                return <pre key={i} className="bg-primary text-primary-foreground p-3 rounded-lg text-xs overflow-x-auto my-2"><code>{line}</code></pre>;
              }
              if (line.trim() === "") return <div key={i} className="h-2" />;
              return <p key={i} className="my-2">{line}</p>;
            })}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-6">
            <Button
              variant="outline"
              disabled={!prev}
              onClick={() => prev && nav({ to: "/learn/$courseId", params: { courseId: course.id }, search: { lessonId: prev.id } })}
            >
              <ArrowLeft className="h-4 w-4" /> Önceki
            </Button>

            <Button
              onClick={markDone}
              disabled={isDone}
              className={isDone ? "" : "bg-success text-success-foreground hover:bg-success/90"}
              variant={isDone ? "outline" : "default"}
            >
              {isDone ? (<><CheckCircle2 className="h-4 w-4" /> Tamamlandı</>) : "Tamamlandı olarak işaretle"}
            </Button>

            {next ? (
              <Button
                onClick={() => nav({ to: "/learn/$courseId", params: { courseId: course.id }, search: { lessonId: next.id } })}
              >
                Sonraki <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                className="bg-brand text-brand-foreground hover:bg-brand/90"
                onClick={() => nav({ to: "/exam/$examId", params: { examId: course.modules[moduleIndex].exam.id } })}
              >
                Sınava Git <FileQuestion className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
