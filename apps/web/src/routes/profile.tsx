import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Award, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { me as meApi } from "@/lib/api";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user, loading, refresh } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [certs, setCerts] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && user) {
      meApi.certificates().then(setCerts).catch(() => {});
      setName(user.name);
      setBio(user.bio ?? "");
    }
  }, [loading, user]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  const saveProfile = async () => {
    try {
      toast.success("Profil güncellendi");
      await refresh();
    } catch (err: any) { toast.error(err.message); }
  };

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
          <div className="flex gap-2">
            <Button onClick={saveProfile}>Kaydet</Button>
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
                  <Award className="w-8 h-8 text-accent-foreground" />
                  <div className="font-semibold">{c.courseTitle ?? c.course?.title}</div>
                  <div className="text-xs text-muted-foreground font-mono">{c.number}</div>
                  <div className="text-xs text-muted-foreground">{new Date(c.issuedAt).toLocaleDateString("tr-TR")}</div>
                  <Button asChild size="sm" variant="outline" className="w-full">
                    <Link to="/verify/$number" params={{ number: c.number }} target="_blank">
                      Doğrulama Sayfası <ExternalLink className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
