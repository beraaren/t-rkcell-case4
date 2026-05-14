import { Link } from "@tanstack/react-router";
import { Clock, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const levelLabel: Record<string, string> = {
  BEGINNER: "Başlangıç",
  INTERMEDIATE: "Orta",
  ADVANCED: "İleri",
};

const EMOJIS = ["📚", "💻", "🎯", "🚀", "🔬", "🎨", "📊", "⚡"];
function courseEmoji(id: string) {
  return EMOJIS[id.charCodeAt(0) % EMOJIS.length];
}

export function CourseCard({ course }: { course: any }) {
  const totalLessons = (course.modules ?? []).reduce((s: number, m: any) => s + (m.lessons?.length ?? 0), 0);
  const instructorName = course.instructorName ?? course.instructor?.name ?? "";
  return (
    <Link to="/courses/$id" params={{ id: course.id }}>
      <Card className="overflow-hidden hover:border-foreground/30 hover:shadow-lg transition-all h-full p-0">
        <div className="aspect-[16/9] bg-gradient-to-br from-accent/40 to-accent/10 flex items-center justify-center text-6xl">
          {course.coverEmoji ?? courseEmoji(course.id)}
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            {course.category && <Badge variant="secondary">{course.category}</Badge>}
            {course.level && <Badge variant="outline">{levelLabel[course.level] ?? course.level}</Badge>}
          </div>
          <h3 className="font-semibold leading-tight line-clamp-2">{course.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{Math.round((course.estimatedDuration ?? 0) / 60)}sa</span>
            {totalLessons > 0 && <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" />{totalLessons} ders</span>}
            {instructorName && <span className="ml-auto">{instructorName}</span>}
          </div>
        </div>
      </Card>
    </Link>
  );
}
