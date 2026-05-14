import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async updateProfile(userId: string, dto: {
    name?: string; bio?: string; expertise?: string; interests?: string[];
  }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Kullanıcı bulunamadı');

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.bio !== undefined) data.bio = dto.bio;

    if (dto.expertise !== undefined || dto.interests !== undefined) {
      const meta = (user.meta as any) ?? {};
      if (dto.expertise !== undefined) meta.expertise = dto.expertise;
      if (dto.interests !== undefined) meta.interests = dto.interests;
      data.meta = meta;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, gsm: true, name: true, role: true, bio: true, meta: true, createdAt: true },
    });
  }
}
