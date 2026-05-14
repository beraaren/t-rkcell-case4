import { IsString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Level, CourseStatus } from '@prisma/client';

export class UpdateCourseDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsEnum(Level) level?: Level;
  @IsOptional() @IsString() coverUrl?: string;
  @IsOptional() @IsInt() @Min(1) estimatedDuration?: number;
  @IsOptional() @IsEnum(CourseStatus) status?: CourseStatus;
}
