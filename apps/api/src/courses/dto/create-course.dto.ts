import { IsString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Level } from '@prisma/client';

export class CreateCourseDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  category: string;

  @IsEnum(Level)
  level: Level;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsInt()
  @Min(1)
  estimatedDuration: number;
}
