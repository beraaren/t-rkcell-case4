import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { courses as coursesApi } from "@/lib/api";

export const Route = createFileRoute("/instructor/new")({ component: NewCoursePage });

function NewCoursePage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    level: "BEGINNER",
    estimatedDuration: 60,
    coverUrl: "",
  });
  const [saving, setSaving] = useState(false);

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "INSTRUCTOR" && user.role !== "ADMIN") return <Navigate to="/courses" />;

  const submit = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.category.trim()) {
      toast.error("Başlık, açıklama ve kategori zorunlu");
      return;
    }
    setSaving(true);
    try {
      const body: any = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        level: form.level,
        estimatedDuration: Number(form.estimatedDuration) || 60,
      };
      if (form.coverUrl.trim()) body.coverUrl = form.coverUrl.trim();
      const created = await coursesApi.create(body);
      toast.success("Kurs oluşturuldu");
      nav({ to: "/instructor/$courseId", params: { courseId: created.id } });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <Link to="/instructor" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Eğitmen Paneli
        </Link>

        <div>
          <h1 className="text-3xl font-bold">Yeni Kurs</h1>
          <p className="text-muted-foreground mt-1">Önce temel bilgileri gir, sonra modülleri ve dersleri ekleyebilirsin.</p>
        </div>

        <Card className="p-6 space-y-4">
          <div>
            <Label>Başlık *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="örn. React ile Modern Web" />
          </div>
          <div>
            <Label>Açıklama *</Label>
            <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Bu kursta ne öğretiyorsun?" />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label>Kategori *</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Programlama" />
            </div>
            <div>
              <Label>Seviye *</Label>
              <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEGINNER">Başlangıç</SelectItem>
                  <SelectItem value="INTERMEDIATE">Orta</SelectItem>
                  <SelectItem value="ADVANCED">İleri</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tahmini süre (dk) *</Label>
              <Input
                type="number"
                min={1}
                value={form.estimatedDuration}
                onChange={(e) => setForm({ ...form, estimatedDuration: Number(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <Label>Kapak Görseli URL</Label>
            <Input value={form.coverUrl} onChange={(e) => setForm({ ...form, coverUrl: e.target.value })} placeholder="https://..." />
            {form.coverUrl.trim() && (
              <div className="mt-3 aspect-[16/9] rounded-lg overflow-hidden bg-gradient-to-br from-violet-500 via-violet-600 to-violet-800 flex items-center justify-center">
                <img
                  src={form.coverUrl.trim()}
                  alt="önizleme"
                  className="w-full h-full object-cover"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => nav({ to: "/instructor" })}>İptal</Button>
            <Button onClick={submit} disabled={saving} className="bg-violet-600 hover:bg-violet-700">
              <Save className="w-4 h-4 mr-1.5" /> {saving ? "Oluşturuluyor…" : "Oluştur ve Düzenle"}
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
