import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class InteractionsService {
  constructor(private prisma: PrismaService) {}

  async getComments(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Ders bulunamadı');

    return this.prisma.comment.findMany({
      where: { lessonId, parentId: null },
      include: {
        user: { select: { id: true, name: true, role: true } },
        replies: {
          include: { user: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createComment(lessonId: string, userId: string, dto: CreateCommentDto) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Ders bulunamadı');
    return this.prisma.comment.create({
      data: { lessonId, userId, text: dto.text },
      include: { user: { select: { id: true, name: true, role: true } } },
    });
  }

  async replyToComment(commentId: string, instructorId: string, dto: CreateCommentDto) {
    const parent = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        lesson: {
          include: { module: { include: { course: true } } },
        },
      },
    });
    if (!parent) throw new NotFoundException('Yorum bulunamadı');

    const isInstructor = parent.lesson.module.course.instructorId === instructorId;
    const isOwner = parent.userId === instructorId;
    if (!isInstructor && !isOwner) throw new ForbiddenException('Sadece kurs eğitmeni yanıt verebilir');

    return this.prisma.comment.create({
      data: {
        lessonId: parent.lessonId,
        userId: instructorId,
        parentId: commentId,
        text: dto.text,
      },
      include: { user: { select: { id: true, name: true, role: true } } },
    });
  }

  async createReview(courseId: string, userId: string, dto: CreateReviewDto) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) throw new ForbiddenException('Bu kursa kayıtlı olmayan kullanıcılar değerlendirme yapamaz');

    // Completion gate: tüm dersler tamamlandı + tüm sınavlar geçildi
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            lessons: { select: { id: true } },
            exam: { select: { id: true, passingScore: true } },
          },
        },
      },
    });
    if (!course) throw new ForbiddenException('Kurs bulunamadı');

    const allLessonIds = course.modules.flatMap(m => m.lessons.map(l => l.id));
    const completedCount = await this.prisma.lessonProgress.count({
      where: { userId, lessonId: { in: allLessonIds } },
    });
    if (allLessonIds.length === 0 || completedCount < allLessonIds.length) {
      throw new ForbiddenException('Kursu tamamlamadan değerlendirme yapamazsınız');
    }

    for (const m of course.modules) {
      if (!m.exam) continue;
      const passed = await this.prisma.examAttempt.findFirst({
        where: { userId, examId: m.exam.id, status: 'SUBMITTED', score: { gte: m.exam.passingScore } },
      });
      if (!passed) throw new ForbiddenException('Tüm modül sınavlarını geçmeden değerlendirme yapamazsınız');
    }

    const existing = await this.prisma.review.findUnique({
      where: { courseId_userId: { courseId, userId } },
    });
    if (existing) throw new ConflictException('Bu kursu zaten değerlendirdiniz');

    return this.prisma.review.create({
      data: { courseId, userId, ...dto },
      include: { user: { select: { id: true, name: true } } },
    });
  }

  async getReviews(courseId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { courseId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const avg = reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

    return { reviews, averageRating: Math.round(avg * 10) / 10, total: reviews.length };
  }
}
