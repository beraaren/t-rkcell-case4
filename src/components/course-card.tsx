import { Link } from "@tanstack/react-router";
import type { Course } from "@/lib/educell-data";
import { Star, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function CourseCard({ course }: { course: Course }) {
  const hours = Math.round(course.duration_min / 60);
  return (
    <Link
      to="/courses/$courseId"
      params={{ courseId: course.id }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all hover:-translate-y-0.5 hover:shadow-glow"
    >
      <div className={`relative h-36 bg-gradient-to-br ${course.cover}`}>
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute left-4 top-4 flex gap-2">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur">
            {course.category}
          </Badge>
          <Badge variant="outline" className="border-background/50 bg-background/70 backdrop-blur">
            {course.level}
          </Badge>
        </div>
        <div className="absolute right-4 bottom-4 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold backdrop-blur flex items-center gap-1">
          <Star className="h-3 w-3 fill-brand text-brand" /> {course.rating}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-display font-bold text-lg leading-snug text-balance group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{course.description}</p>
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{course.instructor.name}</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{hours}sa</span>
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{course.enrolled.toLocaleString("tr")}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
