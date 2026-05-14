import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  async getByLesson(lessonId: string, userId: string) {
    const note = await this.prisma.note.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });
    return note ?? null;
  }

  async upsertNote(lessonId: string, userId: string, text: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Ders bulunamadı');
    return this.prisma.note.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: { userId, lessonId, text },
      update: { text },
    });
  }

  async deleteNote(lessonId: string, userId: string) {
    await this.prisma.note.deleteMany({ where: { userId, lessonId } });
    return { message: 'Not silindi' };
  }

  async listMyNotes(userId: string) {
    return this.prisma.note.findMany({
      where: { userId },
      include: {
        lesson: {
          select: {
            id: true, title: true,
            module: { select: { id: true, title: true, course: { select: { id: true, title: true } } } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
