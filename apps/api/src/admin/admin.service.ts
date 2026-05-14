import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, CourseStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getUsers(page = 1, limit = 20) {
    const [total, users] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
        select: { id: true, gsm: true, name: true, role: true, createdAt: true, _count: { select: { enrollments: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { users, total, page, totalPages: Math.ceil(total / limit) };
  }

  async updateUserRole(userId: string, role: Role) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');
    return this.prisma.user.update({ where: { id: userId }, data: { role } });
  }

  async getCourses(page = 1, limit = 20) {
    const [total, courses] = await Promise.all([
      this.prisma.course.count(),
      this.prisma.course.findMany({
        skip: (page - 1) * limit,
        take: limit,
        include: {
          instructor: { select: { id: true, name: true } },
          _count: { select: { enrollments: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { courses, total, page, totalPages: Math.ceil(total / limit) };
  }

  async archiveCourse(courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Kurs bulunamadı');
    return this.prisma.course.update({
      where: { id: courseId },
      data: { status: CourseStatus.ARCHIVED },
    });
  }

  async getStats() {
    const [users, courses, enrollments, certificates, students, instructors, attempts] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.course.count({ where: { status: { not: 'ARCHIVED' } } }),
      this.prisma.enrollment.count(),
      this.prisma.certificate.count(),
      this.prisma.user.count({ where: { role: Role.STUDENT } }),
      this.prisma.user.count({ where: { role: Role.INSTRUCTOR } }),
      this.prisma.examAttempt.count({ where: { status: 'SUBMITTED' } }),
    ]);

    const passedAttempts = await this.prisma.examAttempt.count({
      where: {
        status: 'SUBMITTED',
        exam: { is: {} },
        score: { gte: 60 },
      },
    });

    const passRate = attempts > 0 ? Math.round((passedAttempts / attempts) * 100) : 0;

    return { users, courses, enrollments, certificates, students, instructors, attempts, passRate };
  }

  async getInstructorStats(instructorId: string) {
    const instructorCourses = await this.prisma.course.findMany({
      where: { instructorId },
      include: {
        _count: { select: { enrollments: true } },
        modules: {
          include: {
            lessons: {
              include: { progress: { select: { id: true } } },
            },
            exam: {
              include: {
                attempts: { where: { status: 'SUBMITTED' }, select: { score: true } },
              },
            },
          },
        },
      },
    });

    return instructorCourses.map(c => {
      const totalLessonProgress = c.modules.flatMap(m => m.lessons.flatMap(l => l.progress)).length;
      const totalLessons = c.modules.flatMap(m => m.lessons).length;
      const allAttempts = c.modules.flatMap(m => m.exam?.attempts ?? []);
      const passedAttempts = allAttempts.filter(a => (a.score ?? 0) >= 60).length;
      const examPassRate = allAttempts.length > 0 ? Math.round((passedAttempts / allAttempts.length) * 100) : null;
      const completionRate = totalLessons > 0 && c._count.enrollments > 0
        ? Math.round((totalLessonProgress / (totalLessons * c._count.enrollments)) * 100)
        : 0;

      return {
        id: c.id,
        title: c.title,
        status: c.status,
        enrollments: c._count.enrollments,
        completionRate,
        examPassRate,
        totalLessons,
      };
    });
  }
}
