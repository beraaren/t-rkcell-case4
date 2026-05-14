import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CertificatesService {
  constructor(private prisma: PrismaService) {}

  async getMyCertificates(userId: string) {
    return this.prisma.certificate.findMany({
      where: { userId },
      include: {
        course: { select: { id: true, title: true, category: true, level: true } },
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async verify(number: string) {
    const cert = await this.prisma.certificate.findUnique({
      where: { number },
      include: {
        user: { select: { name: true } },
        course: { select: { title: true, category: true, level: true } },
      },
    });
    if (!cert) throw new NotFoundException('Sertifika bulunamadı');
    return cert;
  }
}
