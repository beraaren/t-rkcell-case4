import { Controller, Get, Patch, Body } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CoursesService } from '../courses/courses.service';
import { IsOptional, IsString } from 'class-validator';

class UpdateProfileDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() bio?: string;
}

@Controller('me')
export class UsersController {
  constructor(private coursesService: CoursesService) {}

  @Get('courses')
  getMyCourses(@CurrentUser() user: any) {
    return this.coursesService.getMyCourses(user.id);
  }
}
