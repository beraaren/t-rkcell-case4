import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { CourseCard } from "@/components/CourseCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { courses as coursesApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/courses")({ component: CoursesPage });

function CoursesPage() {
  const { user, loading } = useAuth();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [level, setLevel] = useState("all");
  const [courseList, setCourseList] = useState<any[]>([]);
  const [cats, setCats] = useState<string[]>([]);

  useEffect(() => {
    const params: any = {};
    if (q) params.q = q;
    if (category !== "all") params.category = category;
    if (level !== "all") params.level = level;
    coursesApi.list(params).then((data) => {
      setCourseList(data);
      const unique = [...new Set(data.map((c: any) => c.category).filter(Boolean))] as string[];
      setCats(unique);
    }).catch(() => {});
  }, [q, category, level]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Kurs Kataloğu</h1>
          <p className="text-muted-foreground mt-1">Yeni bir şey öğrenmeye başla.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kurs ara..." className="pl-9" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kategoriler</SelectItem>
              {cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Seviyeler</SelectItem>
              <SelectItem value="BEGINNER">Başlangıç</SelectItem>
              <SelectItem value="INTERMEDIATE">Orta</SelectItem>
              <SelectItem value="ADVANCED">İleri</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {courseList.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">Sonuç bulunamadı.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courseList.map((c) => <CourseCard key={c.id} course={c} />)}
          </div>
        )}
      </main>
    </div>
  );
}
