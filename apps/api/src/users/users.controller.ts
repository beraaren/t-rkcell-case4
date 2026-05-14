import { Controller, Get, Patch, Body } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CoursesService } from '../courses/courses.service';
import { UsersService } from './users.service';
import { IsOptional, IsString, IsArray } from 'class-validator';

class UpdateProfileDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsString() expertise?: string;
  @IsOptional() @IsArray() interests?: string[];
}

@Controller('me')
export class UsersController {
  constructor(
    private coursesService: CoursesService,
    private usersService: UsersService,
  ) {}

  @Get('courses')
  getMyCourses(@CurrentUser() user: any) {
    return this.coursesService.getMyCourses(user.id);
  }

  @Patch('profile')
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }
}
