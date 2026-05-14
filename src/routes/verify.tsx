import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loadState, type Certificate } from "@/lib/educell-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Award, ShieldCheck, XCircle, Calendar, User, BookOpen } from "lucide-react";

interface Search { number?: string }

export const Route = createFileRoute("/verify")({
  component: Verify,
  validateSearch: (s: Record<string, unknown>): Search => ({
    number: typeof s.number === "string" ? s.number : undefined,
  }),
});

function Verify() {
  const search = useSearch({ from: "/verify" });
  const [num, setNum] = useState(search.number ?? "");
  const [result, setResult] = useState<Certificate | null | undefined>(undefined);

  const lookup = (n: string) => {
    const s = loadState();
    const found = s.certificates.find((c) => c.number.toUpperCase() === n.toUpperCase().trim());
    setResult(found ?? null);
  };

  useEffect(() => {
    if (search.number) lookup(search.number);
  }, [search.number]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="text-center">
        <ShieldCheck className="h-12 w-12 mx-auto text-brand" />
        <h1 className="mt-3 text-3xl font-bold font-display">Sertifika Doğrulama</h1>
        <p className="text-muted-foreground mt-2">EduCell sertifika numarasını girerek doğrulayabilirsin.</p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); lookup(num); }}
        className="mt-8 flex gap-2"
      >
        <Input
          value={num}
          onChange={(e) => setNum(e.target.value)}
          placeholder="Örn: EDU-DEMO-2026"
          className="font-mono"
        />
        <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">Doğrula</Button>
      </form>
      <p className="text-xs text-muted-foreground mt-2">Demo: <span className="font-mono">EDU-DEMO-2026</span></p>

      {result === null && (
        <div className="mt-8 rounded-xl border border-destructive/40 bg-destructive/5 p-5 text-center">
          <XCircle className="h-8 w-8 text-destructive mx-auto" />
          <div className="mt-2 font-semibold">Geçersiz sertifika numarası</div>
          <div className="text-sm text-muted-foreground">Bu numarayla bir sertifika bulunamadı.</div>
        </div>
      )}

      {result && (
        <div className="mt-8 rounded-3xl border-2 border-brand/40 bg-card overflow-hidden shadow-glow">
          <div className="bg-brand-gradient p-8 relative">
            <div className="absolute inset-0 grid-bg opacity-30" />
            <div className="relative flex items-start justify-between">
              <Award className="h-10 w-10 text-primary" />
              <div className="text-right">
                <div className="text-xs font-semibold uppercase tracking-widest text-primary/70">EduCell</div>
                <div className="text-sm font-bold font-display text-primary">Turkcell Akademi</div>
              </div>
            </div>
            <div className="relative mt-8">
              <div className="text-xs uppercase tracking-widest text-primary/70">Sertifika sahibi</div>
              <div className="text-3xl font-bold font-display text-primary mt-1">{result.user_name}</div>
              <div className="mt-3 text-sm text-primary/80">başarıyla tamamladı</div>
              <div className="text-xl font-semibold text-primary mt-1">{result.course_title}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-border bg-card">
            <Field icon={ShieldCheck} label="Sertifika No" value={result.number} mono />
            <Field icon={Calendar} label="Veriliş" value={new Date(result.issued_at).toLocaleDateString("tr-TR")} />
            <Field icon={User} label="Doğrulama" value="Geçerli ✓" success />
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  icon: Icon, label, value, mono, success,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; mono?: boolean; success?: boolean }) {
  return (
    <div className="p-4 text-center">
      <Icon className={`h-4 w-4 mx-auto ${success ? "text-success" : "text-muted-foreground"}`} />
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1.5">{label}</div>
      <div className={`text-sm font-semibold mt-0.5 ${mono ? "font-mono" : ""} ${success ? "text-success" : ""}`}>{value}</div>
    </div>
  );
}
