import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { ModulesModule } from './modules/modules.module';
import { LessonsModule } from './lessons/lessons.module';
import { UsersModule } from './users/users.module';
import { ExamsModule } from './exams/exams.module';
import { CertificatesModule } from './certificates/certificates.module';
import { InteractionsModule } from './interactions/interactions.module';
import { AdminModule } from './admin/admin.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { NotesModule } from './notes/notes.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CoursesModule,
    ModulesModule,
    LessonsModule,
    UsersModule,
    ExamsModule,
    CertificatesModule,
    InteractionsModule,
    AdminModule,
    LeaderboardModule,
    NotesModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
