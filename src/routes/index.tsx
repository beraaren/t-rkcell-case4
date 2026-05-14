import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { COURSES, type Category, type Level } from "@/lib/educell-data";
import { CourseCard } from "@/components/course-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Sparkles, Trophy, Timer, ShieldCheck, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "EduCell — Turkcell Akademi" },
      { name: "description", content: "Yüzlerce kurs, zamanlı sınavlar ve dijital sertifika." },
    ],
  }),
});

const CATEGORIES: ("Tümü" | Category)[] = ["Tümü", "Yazılım", "Mobil", "Veri", "İletişim", "Liderlik"];
const LEVELS: ("Tümü" | Level)[] = ["Tümü", "Başlangıç", "Orta", "İleri"];

function Home() {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("Tümü");
  const [lvl, setLvl] = useState<(typeof LEVELS)[number]>("Tümü");
  const [q, setQ] = useState("");

  const filtered = useMemo(
    () =>
      COURSES.filter(
        (c) =>
          (cat === "Tümü" || c.category === cat) &&
          (lvl === "Tümü" || c.level === lvl) &&
          (q.trim() === "" ||
            c.title.toLowerCase().includes(q.toLowerCase()) ||
            c.instructor.name.toLowerCase().includes(q.toLowerCase())),
      ),
    [cat, lvl, q],
  );

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="mx-auto max-w-7xl px-6 pt-16 pb-10 sm:pt-24 sm:pb-16 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-brand text-brand-foreground hover:bg-brand mb-5 gap-1.5">
                <Sparkles className="h-3 w-3" /> Turkcell CodeNight 2026
              </Badge>
              <h1 className="text-4xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight text-balance">
                Öğren. <span className="text-muted-foreground">Sına.</span>{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">Sertifikalan.</span>
                  <span className="absolute inset-x-0 bottom-1 h-3 bg-brand/60 -z-0 rounded-sm" />
                </span>
              </h1>
              <p className="mt-5 text-lg text-muted-foreground max-w-xl text-balance">
                EduCell, Turkcell çalışanları ve abonelerine yönelik dijital eğitim platformu.
                Hiyerarşik kurs yapısı, zamanlı sınav motoru ve dijital sertifika tek bir yerde.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <a href="#katalog">
                    Kursları Keşfet <ArrowRight className="ml-1 h-4 w-4" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/dashboard">Panelime Git</Link>
                </Button>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
                {[
                  { n: "120+", l: "Kurs" },
                  { n: "4.8★", l: "Memnuniyet" },
                  { n: "92%", l: "Tamamlama" },
                ].map((s) => (
                  <div key={s.l}>
                    <div className="text-2xl font-bold font-display">{s.n}</div>
                    <div className="text-xs text-muted-foreground">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-navy-gradient rounded-3xl p-6 sm:p-8 text-primary-foreground shadow-glow relative overflow-hidden">
                <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand/40 blur-3xl" />
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand">
                  <Timer className="h-4 w-4" /> Zamanlı Sınav
                </div>
                <div className="mt-3 text-3xl font-bold font-display">React Hooks Sınavı</div>
                <div className="mt-1 text-sm text-primary-foreground/70">10 soru · 10 dakika · Geçme: %70</div>

                <div className="mt-6 rounded-2xl bg-primary-foreground/10 backdrop-blur p-4">
                  <div className="flex items-center justify-between text-xs uppercase tracking-wider text-primary-foreground/70">
                    <span>Kalan süre</span><span>Soru 4 / 10</span>
                  </div>
                  <div className="mt-2 font-mono text-4xl font-bold tabular-nums">07:42</div>
                  <div className="mt-3 h-1.5 rounded-full bg-primary-foreground/15">
                    <div className="h-full w-[42%] rounded-full bg-brand" />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-primary-foreground/10 p-3">
                    <ShieldCheck className="h-4 w-4 text-brand" />
                    <div className="mt-1 font-semibold">Server-side timer</div>
                    <div className="text-xs text-primary-foreground/70">Süre dolunca otomatik gönderim</div>
                  </div>
                  <div className="rounded-xl bg-primary-foreground/10 p-3">
                    <Trophy className="h-4 w-4 text-brand" />
                    <div className="mt-1 font-semibold">Kısmi puanlama</div>
                    <div className="text-xs text-primary-foreground/70">Çoklu seçim için adil skor</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KATALOG */}
      <section id="katalog" className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-widest">
              <GraduationCap className="h-4 w-4" /> Kurs Kataloğu
            </div>
            <h2 className="text-3xl font-bold font-display mt-1">Bugün ne öğrenmek istersin?</h2>
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Kurs veya eğitmen ara…"
            className="rounded-full border border-border bg-card px-4 py-2 text-sm w-full sm:w-72 outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium border transition ${
                cat === c
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border hover:border-primary/40"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mb-8">
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setLvl(l)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition ${
                lvl === l
                  ? "bg-brand text-brand-foreground border-brand"
                  : "bg-transparent border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">Aramanla eşleşen kurs bulunamadı.</div>
        )}
      </section>
    </div>
  );
}
