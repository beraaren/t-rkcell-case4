import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, Users, Trophy, TrendingUp, Plus, ChevronRight, BarChart3 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth";
import { admin as adminApi } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";

export const Route = createFileRoute("/instructor")({ component: InstructorPanel });

function StatCard({ label, value, icon: Icon, sub }: { label: string; value: string | number; icon: any; sub?: string }) {
  return (
    <Card className="p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-violet-600" />
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </div>
    </Card>
  );
}

function InstructorPanel() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && user?.role === "INSTRUCTOR") {
      adminApi.instructorStats()
        .then(setCourses)
        .catch(() => {})
        .finally(() => setFetching(false));
    }
  }, [loading, user]);

  if (loading || fetching) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "INSTRUCTOR") return <Navigate to="/courses" />;

  const totalEnrollments = courses.reduce((s, c) => s + c.enrollments, 0);
  const totalLessons = courses.reduce((s, c) => s + c.totalLessons, 0);
  const avgCompletion = courses.length > 0
    ? Math.round(courses.reduce((s, c) => s + c.completionRate, 0) / courses.length)
    : 0;
  const avgPassRate = (() => {
    const withExams = courses.filter(c => c.examPassRate !== null);
    return withExams.length > 0
      ? Math.round(withExams.reduce((s, c) => s + c.examPassRate, 0) / withExams.length)
      : null;
  })();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Eğitmen Paneli</h1>
            <p className="text-muted-foreground mt-1">Hoşgeldin, {user.name}</p>
          </div>
          <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => nav({ to: "/courses" })}>
            <Plus className="w-4 h-4 mr-2" /> Yeni Kurs
          </Button>
        </div>

        {/* Özet istatistikler */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Toplam Kurs" value={courses.length} icon={BookOpen} />
          <StatCard label="Toplam Kayıt" value={totalEnrollments} icon={Users} />
          <StatCard label="Toplam Ders" value={totalLessons} icon={BarChart3} />
          <StatCard
            label="Ort. Tamamlama"
            value={`%${avgCompletion}`}
            icon={TrendingUp}
            sub={avgPassRate !== null ? `Sınav geçme: %${avgPassRate}` : undefined}
          />
        </div>

        {courses.length > 0 && (
          <Card className="p-5">
            <h3 className="font-semibold mb-3">Kurs Performansı</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courses.map((c: any) => ({
                  name: c.title.length > 18 ? c.title.slice(0, 18) + "…" : c.title,
                  Kayıt: c.enrollments,
                  Tamamlama: c.completionRate,
                  Geçme: c.examPassRate ?? 0,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Kayıt" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Tamamlama" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Geçme" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Kurs listesi */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-violet-600" /> Kurslarım
          </h2>

          {courses.length === 0 ? (
            <Card className="p-12 text-center space-y-3">
              <BookOpen className="w-10 h-10 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Henüz kurs oluşturmadın.</p>
              <Button variant="outline" onClick={() => nav({ to: "/courses" })}>İlk Kursunu Oluştur</Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {courses.map((c: any) => (
                <Card key={c.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{c.title}</h3>
                        <Badge variant={c.status === "PUBLISHED" ? "default" : c.status === "ARCHIVED" ? "destructive" : "secondary"}>
                          {c.status === "PUBLISHED" ? "Yayında" : c.status === "DRAFT" ? "Taslak" : "Arşiv"}
                        </Badge>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="flex justify-between text-muted-foreground">
                            <span>Kayıtlı öğrenci</span>
                            <span className="font-semibold text-foreground">{c.enrollments}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-muted-foreground">
                            <span>Ders tamamlama</span>
                            <span className="font-semibold text-foreground">%{c.completionRate}</span>
                          </div>
                          <Progress value={c.completionRate} className="h-1.5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-muted-foreground">
                            <span>Sınav geçme</span>
                            <span className="font-semibold text-foreground">
                              {c.examPassRate !== null ? `%${c.examPassRate}` : "—"}
                            </span>
                          </div>
                          {c.examPassRate !== null && <Progress value={c.examPassRate} className="h-1.5" />}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Link to="/instructor/$courseId" params={{ courseId: c.id }}>
                        <Button size="sm" className="bg-violet-600 hover:bg-violet-700 w-full">
                          Düzenle
                        </Button>
                      </Link>
                      <Link to="/courses/$id" params={{ id: c.id }}>
                        <Button variant="outline" size="sm" className="w-full">
                          Görüntüle <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
