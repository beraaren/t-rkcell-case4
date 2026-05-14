import { Controller, Post, Get, Delete, Body, Param } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SubmitExamDto } from './dto/submit-exam.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller()
export class ExamsController {
  constructor(private examsService: ExamsService) {}

  // Instructor
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Post('modules/:moduleId/exam')
  upsertExam(
    @Param('moduleId') moduleId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateExamDto,
  ) {
    return this.examsService.upsertExam(moduleId, user.id, dto);
  }

  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Post('exams/:examId/questions')
  addQuestion(
    @Param('examId') examId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.examsService.addQuestion(examId, user.id, dto);
  }

  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Delete('questions/:questionId')
  deleteQuestion(@Param('questionId') questionId: string, @CurrentUser() user: any) {
    return this.examsService.deleteQuestion(questionId, user.id);
  }

  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Get('exams/:examId/manage')
  getExamWithQuestions(@Param('examId') examId: string, @CurrentUser() user: any) {
    return this.examsService.getExamWithQuestions(examId, user.id);
  }

  // Student
  @Post('exams/:examId/start')
  startAttempt(@Param('examId') examId: string, @CurrentUser() user: any) {
    return this.examsService.startAttempt(examId, user.id);
  }

  @Post('exams/:examId/submit')
  submitAttempt(
    @Param('examId') examId: string,
    @CurrentUser() user: any,
    @Body() dto: SubmitExamDto,
  ) {
    return this.examsService.submitAttempt(examId, user.id, dto);
  }

  @Get('exams/:examId/result')
  getResult(@Param('examId') examId: string, @CurrentUser() user: any) {
    return this.examsService.getResult(examId, user.id);
  }

  @Get('exams/:examId/attempts')
  getAttempts(@Param('examId') examId: string, @CurrentUser() user: any) {
    return this.examsService.getAttempts(examId, user.id);
  }
}
