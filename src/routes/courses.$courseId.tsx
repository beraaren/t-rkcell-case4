import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { findCourse, useEducellState, mutate, courseProgress, isModuleUnlocked, type Course } from "@/lib/educell-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Star, Clock, BookOpen, Award, Lock, CheckCircle2, PlayCircle, FileQuestion } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/courses/$courseId")({
  component: CourseDetail,
  loader: ({ params }) => {
    const c = findCourse(params.courseId);
    if (!c) throw notFound();
    return { course: c };
  },
  notFoundComponent: () => (
    <div className="text-center py-24">
      <h1 className="text-2xl font-bold">Kurs bulunamadı</h1>
      <Link to="/" className="text-brand hover:underline mt-4 inline-block">Kataloğa dön</Link>
    </div>
  ),
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.course.title ?? "Kurs"} — EduCell` },
      { name: "description", content: loaderData?.course.description },
    ],
  }),
});

function CourseDetail() {
  const { course } = Route.useLoaderData() as { course: Course };
  const state = useEducellState();
  const nav = useNavigate();
  const enrolled = state.enrollments.includes(course.id);
  const progress = enrolled ? courseProgress(course.id) : 0;

  const enroll = () => {
    mutate((s) => ({ ...s, enrollments: [...new Set([...s.enrollments, course.id])] }));
    toast.success(`${course.title} kursuna kaydoldun!`);
  };

  return (
    <div>
      <div className="bg-navy-gradient text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6 py-12 grid lg:grid-cols-[1fr_360px] gap-10">
          <div>
            <div className="flex items-center gap-2 text-xs">
              <Link to="/" className="text-primary-foreground/60 hover:text-primary-foreground">Katalog</Link>
              <span className="text-primary-foreground/40">/</span>
              <span className="text-primary-foreground/80">{course.category}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge className="bg-brand text-brand-foreground hover:bg-brand">{course.category}</Badge>
              <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground">
                {course.level}
              </Badge>
              <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground gap-1">
                <Star className="h-3 w-3 fill-brand text-brand" />
                {course.rating} ({course.enrolled.toLocaleString("tr")} kayıt)
              </Badge>
            </div>
            <h1 className="mt-4 text-4xl sm:text-5xl font-bold font-display tracking-tight text-balance">
              {course.title}
            </h1>
            <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl text-balance">
              {course.long_description}
            </p>
            <div className="mt-6 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 grid place-items-center rounded-full bg-brand text-brand-foreground font-bold">
                  {course.instructor.name[0]}
                </div>
                <div>
                  <div className="font-semibold">{course.instructor.name}</div>
                  <div className="text-xs text-primary-foreground/60">{course.instructor.title}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-card text-card-foreground p-6 shadow-glow h-fit">
            <div className={`h-32 rounded-xl bg-gradient-to-br ${course.cover} mb-5`} />
            <div className="space-y-2.5 text-sm">
              <Row icon={Clock} label="Süre" value={`${Math.round(course.duration_min / 60)} saat`} />
              <Row icon={BookOpen} label="Modüller" value={`${course.modules.length} modül · ${course.modules.reduce((s, m) => s + m.lessons.length, 0)} ders`} />
              <Row icon={Award} label="Sertifika" value="Tamamlamada otomatik" />
            </div>
            {enrolled ? (
              <div className="mt-5">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">İlerleme</span>
                  <span className="font-semibold">%{progress}</span>
                </div>
                <Progress value={progress} className="h-2" />
                <Button
                  className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => nav({ to: "/learn/$courseId", params: { courseId: course.id } })}
                >
                  Öğrenmeye Devam Et
                </Button>
              </div>
            ) : (
              <Button
                onClick={enroll}
                className="mt-5 w-full bg-brand text-brand-foreground hover:bg-brand/90 font-semibold"
              >
                Ücretsiz Kaydol
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-2xl font-bold font-display mb-6">Müfredat</h2>
        <Accordion type="multiple" defaultValue={[course.modules[0].id]} className="space-y-3">
          {course.modules.map((m, mi) => {
            const unlocked = !enrolled || isModuleUnlocked(course.id, mi);
            return (
              <AccordionItem
                key={m.id}
                value={m.id}
                className="rounded-xl border border-border bg-card px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    {unlocked ? (
                      <span className="h-8 w-8 grid place-items-center rounded-full bg-accent text-accent-foreground font-bold text-sm">
                        {mi + 1}
                      </span>
                    ) : (
                      <span className="h-8 w-8 grid place-items-center rounded-full bg-muted text-muted-foreground">
                        <Lock className="h-4 w-4" />
                      </span>
                    )}
                    <div>
                      <div className="font-semibold">{m.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {m.lessons.length} ders · {m.exam.questions.length} soruluk sınav
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="divide-y divide-border">
                    {m.lessons.map((l) => {
                      const done = state.completed_lessons.includes(l.id);
                      return (
                        <li key={l.id} className="flex items-center gap-3 py-2.5 text-sm">
                          {done ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <PlayCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="flex-1">{l.title}</span>
                          <span className="text-xs text-muted-foreground">{l.duration_min} dk</span>
                        </li>
                      );
                    })}
                    <li className="flex items-center gap-3 py-2.5 text-sm">
                      <FileQuestion className="h-4 w-4 text-brand" />
                      <span className="flex-1 font-medium">{m.exam.title}</span>
                      <span className="text-xs text-muted-foreground">{m.exam.time_limit_min} dk · %{m.exam.passing_score}</span>
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="ml-auto font-semibold">{value}</span>
    </div>
  );
}
