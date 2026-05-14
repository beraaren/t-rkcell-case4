import { createFileRoute } from "@tanstack/react-router";
import { COURSES, useEducellState, courseProgress } from "@/lib/educell-data";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Users, Star, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/instructor")({ component: Instructor });

function Instructor() {
  const state = useEducellState();
  const courses = COURSES; // tüm kurslar (demo)
  const totalEnrolled = courses.reduce((s, c) => s + c.enrolled, 0);
  const avgRating = (courses.reduce((s, c) => s + c.rating, 0) / courses.length).toFixed(1);
  const passedAttempts = state.attempts.filter((a) => a.passed).length;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-navy-gradient">
          <GraduationCap className="h-5 w-5 text-brand" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display">Eğitmen Paneli</h1>
          <p className="text-muted-foreground text-sm">Kurslarının performansını izle.</p>
        </div>
      </div>

      <div className="mt-6 grid sm:grid-cols-4 gap-4">
        <Kpi icon={Users} label="Toplam Kayıt" value={totalEnrolled.toLocaleString("tr")} />
        <Kpi icon={Star} label="Ortalama Puan" value={avgRating} />
        <Kpi icon={TrendingUp} label="Geçilen Sınav" value={String(passedAttempts)} />
        <Kpi icon={GraduationCap} label="Aktif Kurs" value={String(courses.length)} />
      </div>

      <h2 className="mt-10 text-xl font-bold font-display">Kurslarım</h2>
      <div className="mt-4 rounded-2xl border border-border bg-card overflow-hidden shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="py-3 px-4">Kurs</th>
              <th className="py-3 px-4">Durum</th>
              <th className="py-3 px-4">Kayıt</th>
              <th className="py-3 px-4">Puan</th>
              <th className="py-3 px-4 w-48">Tamamlama</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {courses.map((c) => {
              const p = courseProgress(c.id);
              return (
                <tr key={c.id}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-12 rounded bg-gradient-to-br ${c.cover}`} />
                      <div>
                        <div className="font-semibold">{c.title}</div>
                        <div className="text-xs text-muted-foreground">{c.instructor.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4"><Badge variant="secondary">{c.status}</Badge></td>
                  <td className="py-3 px-4">{c.enrolled.toLocaleString("tr")}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3 w-3 fill-brand text-brand" />{c.rating}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Progress value={p} className="h-1.5 flex-1" />
                      <span className="text-xs font-semibold w-8">%{p}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 text-xl font-bold font-display">Son Sınav Aktivitesi</h2>
      <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-card">
        {state.attempts.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-6">Henüz sınav denemesi yok.</div>
        ) : (
          <ul className="divide-y divide-border">
            {state.attempts.slice(-8).reverse().map((a) => (
              <li key={a.id} className="py-3 flex items-center gap-3 text-sm">
                <div className={`h-2 w-2 rounded-full ${a.passed ? "bg-success" : "bg-destructive"}`} />
                <div className="flex-1">
                  <div className="font-medium">{a.exam_id}</div>
                  <div className="text-xs text-muted-foreground">{new Date(a.submitted_at).toLocaleString("tr-TR")}</div>
                </div>
                <Badge variant={a.passed ? "default" : "destructive"} className={a.passed ? "bg-success text-success-foreground" : ""}>
                  %{a.score}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className="text-2xl font-bold font-display mt-0.5">{value}</div>
    </div>
  );
}
