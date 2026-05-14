import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SubmitExamDto } from './dto/submit-exam.dto';
import { AttemptStatus, QuestionType } from '@prisma/client';

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  // ── Instructor operations ───────────────────────────────────────────

  async upsertExam(moduleId: string, instructorId: string, dto: CreateExamDto) {
    const mod = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });
    if (!mod) throw new NotFoundException('Modül bulunamadı');
    if (mod.course.instructorId !== instructorId) throw new ForbiddenException('Yetkiniz yok');

    return this.prisma.exam.upsert({
      where: { moduleId },
      create: { moduleId, ...dto },
      update: dto,
    });
  }

  async addQuestion(examId: string, instructorId: string, dto: CreateQuestionDto) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { module: { include: { course: true } } },
    });
    if (!exam) throw new NotFoundException('Sınav bulunamadı');
    if (exam.module.course.instructorId !== instructorId) throw new ForbiddenException('Yetkiniz yok');

    return this.prisma.question.create({
      data: {
        exam: { connect: { id: examId } },
        type: dto.type,
        text: dto.text,
        options: dto.options as any,
        orderIndex: dto.orderIndex,
      },
    });
  }

  async deleteQuestion(questionId: string, instructorId: string) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: { exam: { include: { module: { include: { course: true } } } } },
    });
    if (!question) throw new NotFoundException('Soru bulunamadı');
    if (question.exam.module.course.instructorId !== instructorId) throw new ForbiddenException('Yetkiniz yok');
    return this.prisma.question.delete({ where: { id: questionId } });
  }

  async getExamWithQuestions(examId: string, instructorId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: { orderBy: { orderIndex: 'asc' } },
        module: { include: { course: true } },
      },
    });
    if (!exam) throw new NotFoundException('Sınav bulunamadı');
    if (exam.module.course.instructorId !== instructorId) throw new ForbiddenException('Yetkiniz yok');
    return exam;
  }

  // ── Student: Start Attempt ──────────────────────────────────────────

  async startAttempt(examId: string, userId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: { orderBy: { orderIndex: 'asc' } },
        module: {
          include: {
            lessons: { select: { id: true } },
            course: { include: { modules: { orderBy: { orderIndex: 'asc' }, include: { exam: true } } } },
          },
        },
      },
    });
    if (!exam) throw new NotFoundException('Sınav bulunamadı');

    // Check enrollment
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: exam.module.courseId } },
    });
    if (!enrollment) throw new ForbiddenException('Bu kursa kayıtlı değilsiniz');

    // Module lock check: sıradaki modüllerin sınavını geçmiş mi?
    await this.checkModuleLock(exam.module, userId);

    // IN_PROGRESS resume
    const inProgress = await this.prisma.examAttempt.findFirst({
      where: { userId, examId, status: AttemptStatus.IN_PROGRESS },
    });
    if (inProgress) {
      // Expire check
      if (new Date() > inProgress.expiresAt) {
        await this.prisma.examAttempt.update({
          where: { id: inProgress.id },
          data: { status: AttemptStatus.EXPIRED },
        });
      } else {
        const questions = this.prepareQuestions(exam.questions, exam.shuffle);
        return { attempt: inProgress, questions };
      }
    }

    // Attempt limit check — only SUBMITTED + EXPIRED count, not IN_PROGRESS
    const usedAttempts = await this.prisma.examAttempt.count({
      where: { userId, examId, status: { not: AttemptStatus.IN_PROGRESS } },
    });
    if (usedAttempts >= exam.maxAttempts) {
      throw new ForbiddenException(`Maksimum deneme hakkını (${exam.maxAttempts}) kullandınız`);
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + exam.timeLimitMin * 60 * 1000);

    const attempt = await this.prisma.examAttempt.create({
      data: { userId, examId, expiresAt },
    });

    const questions = this.prepareQuestions(exam.questions, exam.shuffle);
    return { attempt, questions };
  }

  // ── Student: Submit Attempt ─────────────────────────────────────────

  async submitAttempt(examId: string, userId: string, dto: SubmitExamDto) {
    const attempt = await this.prisma.examAttempt.findFirst({
      where: { id: dto.attemptId, userId, examId },
      include: { exam: { include: { questions: true } } },
    });
    if (!attempt) throw new NotFoundException('Deneme bulunamadı');
    if (attempt.status === AttemptStatus.SUBMITTED) {
      throw new BadRequestException('Bu deneme zaten gönderilmiş');
    }

    const now = new Date();
    const isExpired = now > attempt.expiresAt;
    const finalStatus = isExpired ? AttemptStatus.EXPIRED : AttemptStatus.SUBMITTED;

    // Save answers
    for (const ans of dto.answers) {
      await this.prisma.userAnswer.upsert({
        where: { attemptId_questionId: { attemptId: attempt.id, questionId: ans.questionId } },
        create: {
          attemptId: attempt.id,
          questionId: ans.questionId,
          selectedOptionIds: ans.selectedOptionIds,
        },
        update: { selectedOptionIds: ans.selectedOptionIds },
      });
    }

    // Grade
    const questions = attempt.exam.questions;
    let totalScore = 0;
    for (const q of questions) {
      const userAns = dto.answers.find(a => a.questionId === q.id);
      const selected = userAns?.selectedOptionIds ?? [];
      totalScore += this.gradeAnswer(q, selected);
    }
    const score = questions.length > 0 ? (totalScore / questions.length) * 100 : 0;

    const updated = await this.prisma.examAttempt.update({
      where: { id: attempt.id },
      data: { status: finalStatus, submittedAt: now, score },
    });

    // Certificate check
    let certificate = null;
    if (score >= attempt.exam.passingScore) {
      certificate = await this.checkAndIssueCertificate(userId, attempt.exam.moduleId);
    }

    return { attempt: updated, score, passed: score >= attempt.exam.passingScore, certificate };
  }

  // ── Student: Get Result ─────────────────────────────────────────────

  async getResult(examId: string, userId: string) {
    const attempt = await this.prisma.examAttempt.findFirst({
      where: { userId, examId, status: { in: [AttemptStatus.SUBMITTED, AttemptStatus.EXPIRED] } },
      orderBy: { score: 'desc' },
      include: {
        answers: true,
        exam: { include: { questions: true } },
      },
    });
    if (!attempt) throw new NotFoundException('Tamamlanmış deneme bulunamadı');

    const feedback = attempt.exam.questions.map(q => {
      const userAns = attempt.answers.find(a => a.questionId === q.id);
      const selected = (userAns?.selectedOptionIds as string[]) ?? [];
      const options = q.options as Array<{ id: string; text: string; isCorrect: boolean }>;
      const correctIds = options.filter(o => o.isCorrect).map(o => o.id);
      const pointEarned = this.gradeAnswer(q, selected);

      return {
        questionId: q.id,
        text: q.text,
        type: q.type,
        options,
        selectedOptionIds: selected,
        correctOptionIds: correctIds,
        pointEarned,
        maxPoint: 1,
      };
    });

    return {
      attemptId: attempt.id,
      score: attempt.score,
      status: attempt.status,
      submittedAt: attempt.submittedAt,
      expiresAt: attempt.expiresAt,
      passingScore: attempt.exam.passingScore,
      passed: (attempt.score ?? 0) >= attempt.exam.passingScore,
      feedback,
    };
  }

  async getAttempts(examId: string, userId: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Sınav bulunamadı');

    const attempts = await this.prisma.examAttempt.findMany({
      where: { userId, examId },
      orderBy: { startedAt: 'desc' },
    });

    const usedCount = attempts.filter(a => a.status !== AttemptStatus.IN_PROGRESS).length;
    const remaining = exam.maxAttempts - usedCount;
    return { attempts, remaining: Math.max(0, remaining), maxAttempts: exam.maxAttempts };
  }

  // ── Private helpers ─────────────────────────────────────────────────

  private async checkModuleLock(mod: any, userId: string) {
    // Bu modülün tüm dersleri tamamlanmış olmalı
    const lessonIds = (mod.lessons as Array<{ id: string }>).map(l => l.id);
    if (lessonIds.length > 0) {
      const completedCount = await this.prisma.lessonProgress.count({
        where: { userId, lessonId: { in: lessonIds } },
      });
      if (completedCount < lessonIds.length) {
        throw new ForbiddenException('Sınava girebilmek için modüldeki tüm dersleri tamamlamanız gerekiyor');
      }
    }

    const courseModules = mod.course.modules as Array<{ id: string; orderIndex: number; exam: any }>;
    const sortedModules = [...courseModules].sort((a, b) => a.orderIndex - b.orderIndex);
    const modIndex = sortedModules.findIndex(m => m.id === mod.id);

    if (modIndex <= 0) return; // İlk modül her zaman açık

    const prevModule = sortedModules[modIndex - 1];
    if (!prevModule.exam) return; // Önceki modülde sınav yoksa geç

    const prevExamId = prevModule.exam.id;
    const passed = await this.prisma.examAttempt.findFirst({
      where: {
        userId,
        examId: prevExamId,
        status: AttemptStatus.SUBMITTED,
        score: { gte: prevModule.exam.passingScore },
      },
    });

    if (!passed) {
      throw new ForbiddenException('Bu sınava girebilmek için önceki modül sınavını geçmeniz gerekiyor');
    }
  }

  private prepareQuestions(questions: any[], shuffle: boolean) {
    const q = questions.map(question => {
      const opts = question.options as Array<{ id: string; text: string; isCorrect: boolean }>;
      return {
        id: question.id,
        type: question.type,
        text: question.text,
        orderIndex: question.orderIndex,
        // isCorrect stripped
        options: opts.map(o => ({ id: o.id, text: o.text })),
      };
    });

    if (shuffle) {
      for (let i = q.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [q[i], q[j]] = [q[j], q[i]];
      }
    }
    return q;
  }

  private gradeAnswer(question: any, selected: string[]): number {
    const options = question.options as Array<{ id: string; text: string; isCorrect: boolean }>;
    const correctIds = options.filter(o => o.isCorrect).map(o => o.id);
    const correctSet = new Set(correctIds);
    const selectedSet = new Set(selected);

    if (question.type === QuestionType.MULTIPLE_CHOICE || question.type === QuestionType.TRUE_FALSE) {
      if (selectedSet.size !== 1) return 0;
      return correctSet.has([...selectedSet][0]) ? 1 : 0;
    }

    if (question.type === QuestionType.MULTI_SELECT) {
      let hit = 0, wrong = 0;
      for (const s of selectedSet) {
        correctSet.has(s) ? hit++ : wrong++;
      }
      return Math.max(0, (hit - wrong) / correctIds.length);
    }
    return 0;
  }

  private async checkAndIssueCertificate(userId: string, passedModuleId: string) {
    // Get course from module
    const mod = await this.prisma.module.findUnique({
      where: { id: passedModuleId },
      include: {
        course: {
          include: {
            modules: {
              include: { exam: true },
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });
    if (!mod) return null;

    const courseId = mod.courseId;
    const courseModules = mod.course.modules;

    // All modules with exams must have at least one passing attempt
    for (const m of courseModules) {
      if (!m.exam) continue;
      const passed = await this.prisma.examAttempt.findFirst({
        where: {
          userId,
          examId: m.exam.id,
          status: AttemptStatus.SUBMITTED,
          score: { gte: m.exam.passingScore },
        },
      });
      if (!passed) return null;
    }

    // All passed! Issue certificate
    const existing = await this.prisma.certificate.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) return existing;

    const number = `EDU-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    return this.prisma.certificate.create({
      data: { number, userId, courseId },
    });
  }
}
