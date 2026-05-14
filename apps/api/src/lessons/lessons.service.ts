import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  async create(moduleId: string, instructorId: string, dto: CreateLessonDto) {
    const mod = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });
    if (!mod) throw new NotFoundException('Modül bulunamadı');
    if (mod.course.instructorId !== instructorId) throw new ForbiddenException('Yetkiniz yok');

    return this.prisma.lesson.create({ data: { ...dto, moduleId } });
  }

  async findOne(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { module: { include: { course: true } } },
    });
    if (!lesson) throw new NotFoundException('Ders bulunamadı');
    return lesson;
  }

  async update(id: string, instructorId: string, dto: UpdateLessonDto) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { module: { include: { course: true } } },
    });
    if (!lesson) throw new NotFoundException('Ders bulunamadı');
    if (lesson.module.course.instructorId !== instructorId) throw new ForbiddenException('Yetkiniz yok');

    return this.prisma.lesson.update({ where: { id }, data: dto });
  }

  async complete(lessonId: string, userId: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Ders bulunamadı');

    await this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: { userId, lessonId },
      update: { completedAt: new Date() },
    });

    return { message: 'Ders tamamlandı' };
  }

  async uncomplete(lessonId: string, userId: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Ders bulunamadı');
    await this.prisma.lessonProgress.deleteMany({ where: { userId, lessonId } });
    return { message: 'Ders ilerleme sıfırlandı' };
  }
}
