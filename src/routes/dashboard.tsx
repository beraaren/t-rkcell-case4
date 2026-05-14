import { createFileRoute, Link } from "@tanstack/react-router";
import { useEducellState, COURSES, courseProgress, findCourse } from "@/lib/educell-data";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Award, BookOpen, Trophy, Calendar } from "lucide-react";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

function Dashboard() {
  const state = useEducellState();
  const myCourses = state.enrollments.map(findCourse).filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-3xl font-bold font-display">Panelim</h1>
      <p className="text-muted-foreground mt-1">İlerlemeni ve sertifikalarını buradan takip et.</p>

      <div className="mt-6 grid sm:grid-cols-3 gap-4">
        <KpiCard icon={BookOpen} label="Kayıtlı Kurs" value={String(myCourses.length)} />
        <KpiCard icon={Trophy} label="Geçilen Sınav" value={String(state.attempts.filter((a) => a.passed).length)} />
        <KpiCard icon={Award} label="Sertifika" value={String(state.certificates.length)} />
      </div>

      <h2 className="mt-10 text-xl font-bold font-display">Kurslarım</h2>
      <div className="mt-4 grid md:grid-cols-2 gap-4">
        {myCourses.length === 0 && (
          <div className="text-muted-foreground text-sm">
            Henüz kursa kaydolmadın. <Link to="/" className="text-brand hover:underline">Kataloğu keşfet</Link>.
          </div>
        )}
        {myCourses.map((c) => {
          if (!c) return null;
          const p = courseProgress(c.id);
          return (
            <div key={c.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex gap-4">
                <div className={`h-20 w-28 rounded-lg bg-gradient-to-br ${c.cover} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold leading-tight">{c.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{c.instructor.name}</div>
                  <div className="mt-3 flex items-center gap-2">
                    <Progress value={p} className="h-1.5 flex-1" />
                    <span className="text-xs font-semibold w-8 text-right">%{p}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/courses/$courseId" params={{ courseId: c.id }}>Detay</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/learn/$courseId" params={{ courseId: c.id }}>Devam Et</Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="mt-10 text-xl font-bold font-display">Sertifikalarım</h2>
      <div className="mt-4 grid md:grid-cols-2 gap-4">
        {state.certificates.length === 0 && (
          <div className="text-muted-foreground text-sm">Henüz sertifikan yok. Bir kursu tamamla!</div>
        )}
        {state.certificates.map((cert) => (
          <Link
            key={cert.number}
            to="/verify"
            search={{ number: cert.number }}
            className="group block rounded-2xl border-2 border-brand/40 bg-brand-gradient p-6 shadow-glow relative overflow-hidden"
          >
            <div className="absolute inset-0 grid-bg opacity-30" />
            <Award className="h-7 w-7 text-primary" />
            <div className="mt-3 text-xs font-semibold uppercase tracking-widest text-primary/70">EduCell Sertifikası</div>
            <div className="mt-1 text-lg font-bold font-display text-primary">{cert.course_title}</div>
            <div className="mt-3 flex items-center justify-between text-xs text-primary/80">
              <span className="font-mono">{cert.number}</span>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(cert.issued_at).toLocaleDateString("tr-TR")}</span>
            </div>
          </Link>
        ))}
      </div>

      <h2 className="mt-10 text-xl font-bold font-display">Önerilen Kurslar</h2>
      <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {COURSES.filter((c) => !state.enrollments.includes(c.id)).slice(0, 3).map((c) => (
          <Link
            key={c.id}
            to="/courses/$courseId"
            params={{ courseId: c.id }}
            className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition"
          >
            <div className={`h-20 rounded-lg bg-gradient-to-br ${c.cover} mb-3`} />
            <div className="font-semibold text-sm">{c.title}</div>
            <div className="text-xs text-muted-foreground mt-1">{c.category} · {c.level}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card flex items-center gap-4">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-gradient">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{label}</div>
        <div className="text-2xl font-bold font-display">{value}</div>
      </div>
    </div>
  );
}
