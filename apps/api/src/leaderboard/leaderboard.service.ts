import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService) {}

  async getLeaderboard(limit = 50) {
    const students = await this.prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        name: true,
        certificates: { select: { id: true } },
        attempts: {
          where: { status: 'SUBMITTED' },
          select: { examId: true, score: true },
        },
      },
    });

    const rows = students.map(s => {
      const completedCourses = s.certificates.length;

      // En yüksek skoru her sınav için al
      const bestByExam = new Map<string, number>();
      for (const a of s.attempts) {
        const cur = bestByExam.get(a.examId) ?? -1;
        if ((a.score ?? 0) > cur) bestByExam.set(a.examId, a.score ?? 0);
      }
      const scores = [...bestByExam.values()];
      const accuracy = scores.length > 0 ? scores.reduce((x, y) => x + y, 0) / scores.length : 0;

      // Harmonic mean: courseScore = (completedCourses * 20) cap 100, accuracy 0..100
      const courseScore = Math.min(completedCourses * 20, 100);
      const harmonic = (courseScore > 0 && accuracy > 0)
        ? (2 * courseScore * accuracy) / (courseScore + accuracy)
        : 0;

      return {
        userId: s.id,
        name: s.name,
        completedCourses,
        accuracy: Math.round(accuracy * 10) / 10,
        score: Math.round(harmonic * 10) / 10,
      };
    });

    rows.sort((a, b) => b.score - a.score);
    return rows.slice(0, limit).map((r, i) => ({ rank: i + 1, ...r }));
  }
}
