import { createFileRoute } from "@tanstack/react-router";
import { COURSES, useEducellState } from "@/lib/educell-data";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, Award, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin")({ component: Admin });

const FAKE_USERS = [
  { id: "u-1", name: "Ayşe Yılmaz", role: "Öğrenci", gsm: "+90 555 123 45 67" },
  { id: "u-2", name: "Mehmet Öz", role: "Öğrenci", gsm: "+90 555 234 56 78" },
  { id: "u-3", name: "Elif Kaya", role: "Eğitmen", gsm: "+90 555 345 67 89" },
  { id: "u-4", name: "Mert Aydın", role: "Eğitmen", gsm: "+90 555 456 78 90" },
  { id: "u-5", name: "Selin Kara", role: "Öğrenci", gsm: "+90 555 567 89 01" },
];

function Admin() {
  const state = useEducellState();

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-navy-gradient">
          <ShieldCheck className="h-5 w-5 text-brand" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display">Admin Paneli</h1>
          <p className="text-muted-foreground text-sm">Platform geneli istatistikler ve yönetim.</p>
        </div>
      </div>

      <div className="mt-6 grid sm:grid-cols-4 gap-4">
        <Kpi icon={Users} label="Kullanıcı" value={String(FAKE_USERS.length + 1)} />
        <Kpi icon={BookOpen} label="Kurs" value={String(COURSES.length)} />
        <Kpi icon={Award} label="Sertifika" value={String(state.certificates.length)} />
        <Kpi icon={ShieldCheck} label="Sınav Denemesi" value={String(state.attempts.length)} />
      </div>

      <div className="mt-10 grid lg:grid-cols-2 gap-6">
        <Panel title="Kullanıcılar">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="pb-2">Ad</th><th>Rol</th><th>GSM</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {FAKE_USERS.map((u) => (
                <tr key={u.id}>
                  <td className="py-2.5 font-medium">{u.name}</td>
                  <td><Badge variant="secondary">{u.role}</Badge></td>
                  <td className="text-muted-foreground font-mono text-xs">{u.gsm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Kurslar">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="pb-2">Kurs</th><th>Kategori</th><th>Kayıt</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {COURSES.map((c) => (
                <tr key={c.id}>
                  <td className="py-2.5 font-medium">{c.title}</td>
                  <td><Badge variant="outline">{c.category}</Badge></td>
                  <td className="text-muted-foreground">{c.enrolled.toLocaleString("tr")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Verilen Sertifikalar">
          {state.certificates.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">Henüz sertifika yok.</div>
          ) : (
            <ul className="divide-y divide-border">
              {state.certificates.map((c) => (
                <li key={c.number} className="py-2.5 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{c.course_title}</div>
                    <div className="text-xs text-muted-foreground font-mono">{c.number}</div>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(c.issued_at).toLocaleDateString("tr-TR")}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Sınav Aktivitesi">
          {state.attempts.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">Henüz sınav denemesi yok.</div>
          ) : (
            <ul className="divide-y divide-border">
              {state.attempts.slice(-6).reverse().map((a) => (
                <li key={a.id} className="py-2.5 flex items-center justify-between text-sm">
                  <span className="text-xs font-mono text-muted-foreground truncate max-w-[60%]">{a.exam_id}</span>
                  <Badge className={a.passed ? "bg-success text-success-foreground" : ""} variant={a.passed ? "default" : "destructive"}>
                    %{a.score}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <h2 className="font-bold font-display mb-3">{title}</h2>
      {children}
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
