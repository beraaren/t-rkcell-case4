import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { courses as coursesApi } from "@/lib/api";

export const Route = createFileRoute("/instructor")({ component: InstructorPanel });

function InstructorPanel() {
  const { user, loading } = useAuth();
  const [myCourses, setMyCourses] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && user?.role === "INSTRUCTOR") {
      coursesApi.list().then(setMyCourses).catch(() => {});
    }
  }, [loading, user]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "INSTRUCTOR") return <Navigate to="/courses" />;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <h1 className="text-3xl font-bold">Eğitmen Panel</h1>
        <div className="grid md:grid-cols-3 gap-4">
          {myCourses.map((c: any) => (
            <Card key={c.id} className="p-5 space-y-3">
              <div className="text-3xl">{c.coverEmoji ?? "📚"}</div>
              <h3 className="font-semibold">{c.title}</h3>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary">{c.enrollmentCount ?? 0} kayıt</Badge>
                <Badge>{c.status}</Badge>
              </div>
              <Link to="/courses/$id" params={{ id: c.id }} className="text-sm text-accent-foreground underline">
                Kursu Görüntüle →
              </Link>
            </Card>
          ))}
        </div>
        {myCourses.length === 0 && (
          <p className="text-sm text-muted-foreground">Henüz kurs oluşturmadın.</p>
        )}
      </main>
    </div>
  );
}
