import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Award, ExternalLink, Download, Tag, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { me as meApi, certificates as certsApi } from "@/lib/api";
import { downloadCertPdf, qrImageUrl } from "@/lib/cert-pdf";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user, loading, refresh } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [expertise, setExpertise] = useState("");
  const [interestInput, setInterestInput] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [certs, setCerts] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && user) {
      meApi.certificates().then(setCerts).catch(() => {});
      setName(user.name);
      setBio(user.bio ?? "");
      const meta = (user as any).meta ?? {};
      const exp = meta.expertise;
      setExpertise(Array.isArray(exp) ? exp.join(", ") : (exp ?? ""));
      setInterests(Array.isArray(meta.interests) ? meta.interests : []);
    }
  }, [loading, user]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  const isInstructor = user.role === "INSTRUCTOR";
  const isStudent = user.role === "STUDENT";

  const saveProfile = async () => {
    try {
      const body: any = { name, bio };
      if (isInstructor) body.expertise = expertise;
      if (isStudent) body.interests = interests;
      await meApi.updateProfile(body);
      toast.success("Profil güncellendi");
      await refresh();
    } catch (err: any) { toast.error(err.message); }
  };

  const addInterest = () => {
    const t = interestInput.trim();
    if (!t || interests.includes(t)) return;
    setInterests([...interests, t]);
    setInterestInput("");
  };

  const removeInterest = (t: string) => setInterests(interests.filter(i => i !== t));

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <h1 className="text-3xl font-bold">Profil</h1>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Bilgilerim</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Ad Soyad</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <div><Label>GSM</Label><Input value={user.gsm} disabled /></div>
          </div>
          <div><Label>Biyografi</Label><Textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} /></div>

          {isInstructor && (
            <div>
              <Label className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Uzmanlık Alanı</Label>
              <Input value={expertise} onChange={e => setExpertise(e.target.value)} placeholder="Örn: Frontend, Veri Bilimi, Mobil Geliştirme" />
              <p className="text-xs text-muted-foreground mt-1">Profilinde ve kurslarında görüntülenir.</p>
            </div>
          )}

          {isStudent && (
            <div>
              <Label className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> İlgi Alanları</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={interestInput}
                  onChange={e => setInterestInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addInterest(); } }}
                  placeholder="Yeni etiket yaz, Enter ile ekle"
                />
                <Button variant="outline" onClick={addInterest}>Ekle</Button>
              </div>
              {interests.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {interests.map(t => (
                    <Badge key={t} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeInterest(t)}>
                      {t} <span className="text-xs opacity-60">×</span>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">İlgi alanların kurs önerilerini şekillendirir.</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={saveProfile} className="bg-violet-600 hover:bg-violet-700">Kaydet</Button>
            <span className="text-xs text-muted-foreground self-center">Rol: {user.role}</span>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><Award className="w-5 h-5" /> Sertifikalarım ({certs.length})</h2>
          {certs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Bir kursu tamamlayarak ilk sertifikanı kazan.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {certs.map((c: any) => (
                <div key={c.id} className="border rounded-lg p-4 bg-gradient-to-br from-accent/20 to-transparent space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-1">
                      <Award className="w-8 h-8 text-accent-foreground" />
                      <div className="font-semibold">{c.courseTitle ?? c.course?.title}</div>
                      <div className="text-xs text-muted-foreground font-mono">{c.number}</div>
                      <div className="text-xs text-muted-foreground">{new Date(c.issuedAt).toLocaleDateString("tr-TR")}</div>
                    </div>
                    <img
                      src={qrImageUrl(`${typeof window !== "undefined" ? window.location.origin : ""}/verify/${c.number}`, 120)}
                      alt="QR"
                      width={72}
                      height={72}
                      className="rounded border bg-white p-1 shrink-0"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline" className="flex-1">
                      <Link to="/verify/$number" params={{ number: c.number }} target="_blank">
                        Doğrula <ExternalLink className="w-3 h-3 ml-1" />
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1"
                      onClick={async () => {
                        const data = await certsApi.verify(c.number);
                        downloadCertPdf({
                          userName: data.user?.name ?? user.name,
                          courseTitle: data.course?.title ?? c.course?.title ?? "",
                          category: data.course?.category ?? c.course?.category ?? "",
                          level: data.course?.level ?? c.course?.level ?? "",
                          issuedAt: c.issuedAt,
                          number: c.number,
                          verifyUrl: `${window.location.origin}/verify/${c.number}`,
                        });
                      }}
                    >
                      <Download className="w-3 h-3 mr-1" /> İndir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
