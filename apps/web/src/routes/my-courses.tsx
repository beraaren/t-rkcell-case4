import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { me as meApi } from "@/lib/api";

export const Route = createFileRoute("/my-courses")({ component: MyCourses });

function MyCourses() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [certCourseIds, setCertCourseIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && user) {
      meApi.courses().then(setItems).catch(() => {});
      meApi.certificates().then((cs: any[]) => {
        setCertCourseIds(new Set((cs ?? []).map((c) => c.courseId)));
      }).catch(() => {});
    }
  }, [loading, user]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-6">Kurslarım</h1>
        {items.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Henüz hiçbir kursa kaydolmadın.</p>
            <Button asChild><Link to="/courses">Kataloğa Git</Link></Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {items.map((item: any) => {
              const course = item.course ?? item;
              const progressPct = item.progressPct ?? item.progress ?? 0;
              const isCompleted = certCourseIds.has(course.id);
              return (
                <Card key={course.id} className={`p-5 space-y-3 ${isCompleted ? "border-green-500/40 bg-green-500/5" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-md bg-gradient-to-br from-violet-500 via-violet-600 to-violet-800 flex items-center justify-center text-2xl font-bold text-white shrink-0 overflow-hidden">
                      {course.coverUrl ? (
                        <img
                          src={course.coverUrl}
                          alt={course.title}
                          className="w-full h-full object-cover"
                          onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                        />
                      ) : (
                        (course.title?.trim()[0] ?? "?").toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">{course.title}</h3>
                        {isCompleted && (
                          <Badge className="bg-green-500 text-white border-0 shrink-0">
                            <Trophy className="w-3 h-3 mr-1" /> Tamamlandı
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{course.instructorName ?? course.instructor?.name}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs"><span>İlerleme</span><span className="font-semibold">{progressPct}%</span></div>
                    <Progress value={progressPct} />
                  </div>
                  <Button asChild size="sm" className={`w-full ${isCompleted ? "bg-green-600 hover:bg-green-700" : ""}`}>
                    <Link to="/learn/$courseId" params={{ courseId: course.id }}>
                      {isCompleted ? "Yeniden İncele" : "Devam Et"}
                    </Link>
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
