import { Link } from "@tanstack/react-router";
import { Clock, BarChart3, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const levelLabel: Record<string, string> = {
  BEGINNER: "Başlangıç",
  INTERMEDIATE: "Orta",
  ADVANCED: "İleri",
};

export function CourseCard({ course }: { course: any }) {
  const totalLessons = (course.modules ?? []).reduce(
    (s: number, m: any) => s + (m.lessons?.length ?? 0),
    0,
  );
  const instructorName = course.instructorName ?? course.instructor?.name ?? "";
  const initial = (course.title?.trim()[0] ?? "?").toUpperCase();
  const enrollmentCount = course._count?.enrollments ?? course.enrollmentCount ?? 0;

  return (
    <Link to="/courses/$id" params={{ id: course.id }}>
      <Card className="overflow-hidden hover:border-foreground/30 hover:shadow-lg transition-all h-full p-0">
        <div className="aspect-[16/9] bg-gradient-to-br from-violet-500 via-violet-600 to-violet-800 flex items-center justify-center overflow-hidden relative">
          {course.coverUrl ? (
            <img
              src={course.coverUrl}
              alt={course.title}
              className="w-full h-full object-cover"
              onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
            />
          ) : (
            <span className="text-6xl font-bold text-white drop-shadow-lg">{initial}</span>
          )}
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            {course.category && <Badge variant="secondary">{course.category}</Badge>}
            {course.level && <Badge variant="outline">{levelLabel[course.level] ?? course.level}</Badge>}
          </div>
          <h3 className="font-semibold leading-tight line-clamp-2">{course.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t flex-wrap">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{Math.round((course.estimatedDuration ?? 0) / 60)}sa</span>
            {totalLessons > 0 && <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" />{totalLessons} ders</span>}
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{enrollmentCount}</span>
            {instructorName && <span className="ml-auto truncate max-w-[40%]">{instructorName}</span>}
          </div>
        </div>
      </Card>
    </Link>
  );
}
