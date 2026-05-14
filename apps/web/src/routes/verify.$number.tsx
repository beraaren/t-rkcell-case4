import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Award, CheckCircle2, XCircle, GraduationCap, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { certificates as certsApi } from "@/lib/api";

export const Route = createFileRoute("/verify/$number")({ component: VerifyPage });

function VerifyPage() {
  const { number } = Route.useParams();
  const nav = useNavigate();
  const [query, setQuery] = useState(number);
  const [result, setResult] = useState<any>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (number && number !== "search") {
      certsApi.verify(number)
        .then((r) => { setResult(r); setSearched(true); })
        .catch(() => { setResult(null); setSearched(true); });
    }
  }, [number]);

  const onSearch = () => {
    nav({ to: "/verify/$number", params: { number: query.trim() } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/10">
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-2 font-semibold">
          <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-accent-foreground" />
          </div>
          <span>EduCell Sertifika Doğrulama</span>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-12 space-y-6">
        <Card className="p-6 space-y-4">
          <h1 className="text-xl font-semibold">Sertifika Doğrula</h1>
          <p className="text-sm text-muted-foreground">Sertifika numarasını gir, geçerliliğini hemen kontrol et.</p>
          <div className="flex gap-2">
            <Input value={query} onChange={(e) => setQuery(e.target.value.toUpperCase())} placeholder="EDU-2026-XXXXXX" />
            <Button onClick={onSearch}><Search className="w-4 h-4 mr-1" />Sorgula</Button>
          </div>
        </Card>

        {searched && (
          result ? (
            <Card className="p-8 bg-gradient-to-br from-green-500/10 to-transparent border-green-500/30">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
                <div>
                  <h2 className="text-xl font-bold">Geçerli Sertifika</h2>
                  <p className="text-sm text-muted-foreground">Bu belge EduCell tarafından onaylanmıştır.</p>
                </div>
              </div>
              <div className="border-2 border-dashed border-accent/40 rounded-lg p-6 bg-background/60 text-center space-y-2">
                <Award className="w-12 h-12 mx-auto text-accent-foreground" />
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Başarı Sertifikası</div>
                <div className="text-2xl font-bold">{result.userName ?? result.user?.name}</div>
                <p className="text-sm text-muted-foreground">aşağıdaki kursu başarıyla tamamlamıştır:</p>
                <div className="text-lg font-semibold">{result.courseTitle ?? result.course?.title}</div>
                <div className="text-xs text-muted-foreground">
                  Veriliş: {new Date(result.issuedAt).toLocaleDateString("tr-TR")}
                </div>
                <div className="text-xs font-mono pt-2">{result.number}</div>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center bg-destructive/5 border-destructive/30">
              <XCircle className="w-10 h-10 mx-auto text-destructive mb-3" />
              <h2 className="text-xl font-bold">Sertifika Bulunamadı</h2>
              <p className="text-sm text-muted-foreground mt-2">"{number}" numaralı bir sertifika kayıtlarımızda yok.</p>
            </Card>
          )
        )}
      </main>
    </div>
  );
}
