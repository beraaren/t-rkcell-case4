import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller()
export class LessonsController {
  constructor(private lessonsService: LessonsService) {}

  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Post('modules/:moduleId/lessons')
  create(
    @Param('moduleId') moduleId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateLessonDto,
  ) {
    return this.lessonsService.create(moduleId, user.id, dto);
  }

  @Get('lessons/:id')
  findOne(@Param('id') id: string) {
    return this.lessonsService.findOne(id);
  }

  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Patch('lessons/:id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateLessonDto,
  ) {
    return this.lessonsService.update(id, user.id, dto);
  }

  @Roles(Role.STUDENT)
  @Patch('lessons/:id/complete')
  complete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.lessonsService.complete(id, user.id);
  }
}
