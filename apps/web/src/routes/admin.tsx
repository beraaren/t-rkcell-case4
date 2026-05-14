import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, BookOpen, GraduationCap, Award, TrendingUp, ShieldCheck, CheckCircle2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/lib/auth";
import { admin as adminApi } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({ component: AdminPanel });

function StatCard({ label, value, sub, icon: Icon, color = "violet" }: {
  label: string; value: string | number; sub?: string; icon: any; color?: string;
}) {
  const colors: Record<string, string> = {
    violet: "bg-violet-100 text-violet-600",
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    amber: "bg-amber-100 text-amber-600",
    rose: "bg-rose-100 text-rose-600",
  };
  return (
    <Card className="p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </div>
    </Card>
  );
}

function AdminPanel() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [tab, setTab] = useState<"users" | "courses">("users");

  const loadData = () => {
    adminApi.stats().then(setStats).catch(() => {});
    adminApi.users().then(setUsers).catch(() => {});
    adminApi.courses().then(setCourses).catch(() => {});
  };

  useEffect(() => {
    if (!loading && user?.role === "ADMIN") loadData();
  }, [loading, user]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "ADMIN") return <Navigate to="/courses" />;

  const updateRole = async (id: string, role: string) => {
    try {
      await adminApi.updateRole(id, role);
      toast.success("Rol güncellendi");
      adminApi.users().then(setUsers).catch(() => {});
    } catch (err: any) { toast.error(err.message); }
  };

  const archiveCourse = async (id: string) => {
    try {
      await adminApi.archiveCourse(id);
      toast.success("Kurs arşivlendi");
      adminApi.courses().then(setCourses).catch(() => {});
    } catch (err: any) { toast.error(err.message); }
  };

  const roleColors: Record<string, string> = {
    STUDENT: "bg-blue-100 text-blue-700",
    INSTRUCTOR: "bg-violet-100 text-violet-700",
    ADMIN: "bg-rose-100 text-rose-700",
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Paneli</h1>
            <p className="text-sm text-muted-foreground">Platform yönetimi</p>
          </div>
        </div>

        {/* İstatistik kartları */}
        {stats && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Platform İstatistikleri</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard label="Toplam Kullanıcı" value={stats.users} icon={Users} color="violet" />
              <StatCard label="Öğrenci" value={stats.students} icon={GraduationCap} color="blue" />
              <StatCard label="Eğitmen" value={stats.instructors} icon={CheckCircle2} color="green" />
              <StatCard label="Aktif Kurs" value={stats.courses} icon={BookOpen} color="amber" />
              <StatCard label="Kayıt" value={stats.enrollments} icon={TrendingUp} color="violet" />
              <StatCard label="Sertifika" value={stats.certificates} icon={Award} color="green" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-5 space-y-3">
                <div className="text-sm font-semibold">Sınav Geçme Oranı</div>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-bold tabular-nums">%{stats.passRate ?? 0}</span>
                  <span className="text-sm text-muted-foreground pb-1">{stats.attempts} toplam girişim</span>
                </div>
                <Progress value={stats.passRate ?? 0} className="h-2" />
              </Card>

              <Card className="p-5 space-y-3">
                <div className="text-sm font-semibold">Kullanıcı Dağılımı</div>
                <div className="space-y-2">
                  {[
                    { label: "Öğrenci", value: stats.students, total: stats.users, color: "bg-blue-500" },
                    { label: "Eğitmen", value: stats.instructors, total: stats.users, color: "bg-violet-500" },
                  ].map((r) => (
                    <div key={r.label} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{r.label}</span>
                        <span className="font-semibold">{r.value} <span className="text-muted-foreground font-normal">(%{stats.users > 0 ? Math.round((r.value / stats.users) * 100) : 0})</span></span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${r.color}`}
                          style={{ width: `${stats.users > 0 ? (r.value / stats.users) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Tab seçimi */}
        <div className="flex gap-2 border-b pb-0">
          {(["users", "courses"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t ? "border-violet-600 text-violet-600" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "users" ? `Kullanıcılar (${users.length})` : `Kurslar (${courses.length})`}
            </button>
          ))}
        </div>

        {tab === "users" && (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>GSM</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Kayıt</TableHead>
                  <TableHead className="w-40">Rol Değiştir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{u.gsm}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${roleColors[u.role] ?? ""}`}>
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u._count?.enrollments ?? 0} kurs
                    </TableCell>
                    <TableCell>
                      <Select value={u.role} onValueChange={(v) => updateRole(u.id, v)}>
                        <SelectTrigger className="h-7 text-xs w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STUDENT">Öğrenci</SelectItem>
                          <SelectItem value="INSTRUCTOR">Eğitmen</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {tab === "courses" && (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Kurs Adı</TableHead>
                  <TableHead>Eğitmen</TableHead>
                  <TableHead>Kayıt</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="w-28"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.instructorName ?? c.instructor?.name}
                    </TableCell>
                    <TableCell className="text-sm">{c._count?.enrollments ?? 0} kişi</TableCell>
                    <TableCell>
                      <Badge variant={
                        c.status === "PUBLISHED" ? "default" :
                        c.status === "ARCHIVED" ? "destructive" : "secondary"
                      }>
                        {c.status === "PUBLISHED" ? "Yayında" : c.status === "DRAFT" ? "Taslak" : "Arşiv"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {c.status !== "ARCHIVED" && (
                        <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5"
                          onClick={() => archiveCourse(c.id)}>
                          Arşivle
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </main>
    </div>
  );
}
