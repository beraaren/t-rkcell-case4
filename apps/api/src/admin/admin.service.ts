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
    const [users, courses, enrollments, certificates] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.course.count(),
      this.prisma.enrollment.count(),
      this.prisma.certificate.count(),
    ]);
    return { users, courses, enrollments, certificates };
  }
}
