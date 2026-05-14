import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModuleDto } from './dto/create-module.dto';

@Injectable()
export class ModulesService {
  constructor(private prisma: PrismaService) {}

  async create(courseId: string, instructorId: string, dto: CreateModuleDto) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Kurs bulunamadı');
    if (course.instructorId !== instructorId) throw new ForbiddenException('Yetkiniz yok');

    return this.prisma.module.create({ data: { ...dto, courseId } });
  }

  async findByCourse(courseId: string) {
    return this.prisma.module.findMany({
      where: { courseId },
      orderBy: { orderIndex: 'asc' },
      include: {
        lessons: { orderBy: { orderIndex: 'asc' } },
        exam: { select: { id: true, timeLimitMin: true, passingScore: true } },
      },
    });
  }

  async findOne(id: string) {
    const mod = await this.prisma.module.findUnique({
      where: { id },
      include: {
        lessons: { orderBy: { orderIndex: 'asc' } },
        exam: true,
      },
    });
    if (!mod) throw new NotFoundException('Modül bulunamadı');
    return mod;
  }
}
