import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { QueryCoursesDto } from './dto/query-courses.dto';
import { CourseStatus } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryCoursesDto) {
    const { category, level, q, page = 1, limit = 12 } = query;
    const where: any = { status: CourseStatus.PUBLISHED };
    if (category) where.category = category;
    if (level) where.level = level;
    if (q) where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];

    const [total, courses] = await Promise.all([
      this.prisma.course.count({ where }),
      this.prisma.course.findMany({
        where,
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

  async findOne(id: string, userId?: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        instructor: { select: { id: true, name: true, bio: true } },
        modules: {
          orderBy: { orderIndex: 'asc' },
          include: {
            lessons: { orderBy: { orderIndex: 'asc' }, select: { id: true, title: true, estimatedDuration: true, orderIndex: true } },
            exam: { select: { id: true, timeLimitMin: true, passingScore: true, maxAttempts: true } },
          },
        },
        _count: { select: { enrollments: true, reviews: true } },
      },
    });
    if (!course) throw new NotFoundException('Kurs bulunamadı');

    let isEnrolled = false;
    if (userId) {
      const enroll = await this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: id } },
      });
      isEnrolled = !!enroll;
    }

    return { ...course, isEnrolled };
  }

  async create(instructorId: string, dto: CreateCourseDto) {
    return this.prisma.course.create({
      data: { ...dto, instructorId },
    });
  }

  async update(id: string, instructorId: string, dto: UpdateCourseDto) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Kurs bulunamadı');
    if (course.instructorId !== instructorId) throw new ForbiddenException('Bu kursu düzenleme yetkiniz yok');
    return this.prisma.course.update({ where: { id }, data: dto });
  }

  async enroll(courseId: string, userId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.status !== CourseStatus.PUBLISHED) {
      throw new NotFoundException('Kurs bulunamadı');
    }

    const existing = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) throw new ConflictException('Bu kursa zaten kayıtlısınız');

    return this.prisma.enrollment.create({ data: { userId, courseId } });
  }

  async getMyCourses(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            instructor: { select: { id: true, name: true } },
            modules: {
              include: {
                lessons: { select: { id: true } },
                exam: { select: { id: true, passingScore: true } },
              },
            },
            _count: { select: { enrollments: true } },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    const result = await Promise.all(enrollments.map(async (e) => {
      const totalLessons = e.course.modules.reduce((s, m) => s + m.lessons.length, 0);
      const completedLessons = await this.prisma.lessonProgress.count({
        where: {
          userId,
          lesson: { module: { courseId: e.courseId } },
        },
      });
      const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      return { ...e, progress };
    }));

    return result;
  }

  async getCurriculum(courseId: string, userId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { orderIndex: 'asc' },
          include: {
            lessons: {
              orderBy: { orderIndex: 'asc' },
              include: { progress: { where: { userId }, select: { id: true } } },
            },
            exam: {
              select: {
                id: true, timeLimitMin: true, passingScore: true, maxAttempts: true,
                attempts: {
                  where: { userId, status: 'SUBMITTED' },
                  select: { score: true },
                  orderBy: { submittedAt: 'desc' },
                },
              },
            },
          },
        },
      },
    });

    if (!course) throw new NotFoundException('Kurs bulunamadı');

    const modules = course.modules.map((mod, idx) => {
      let locked = false;
      if (idx > 0) {
        const prevMod = course.modules[idx - 1];
        const prevExam = prevMod.exam;
        if (prevExam) {
          const passed = prevExam.attempts?.some(a => a.score !== null && a.score >= prevExam.passingScore);
          locked = !passed;
        }
      }

      return {
        ...mod,
        isUnlocked: !locked,
        lessons: mod.lessons.map(l => ({
          id: l.id,
          title: l.title,
          estimatedDuration: l.estimatedDuration,
          orderIndex: l.orderIndex,
          isCompleted: l.progress.length > 0,
        })),
        exam: mod.exam ? {
          id: mod.exam.id,
          timeLimitMin: mod.exam.timeLimitMin,
          passingScore: mod.exam.passingScore,
          maxAttempts: mod.exam.maxAttempts,
          bestScore: mod.exam.attempts?.length
            ? Math.max(...mod.exam.attempts.map(a => a.score ?? 0))
            : null,
          passed: mod.exam.attempts?.some(a => a.score !== null && a.score >= mod.exam!.passingScore) ?? false,
        } : null,
      };
    });

    return { courseId, title: course.title, modules };
  }

  async getInstructorCourses(instructorId: string) {
    return this.prisma.course.findMany({
      where: { instructorId },
      include: {
        _count: { select: { enrollments: true, modules: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
