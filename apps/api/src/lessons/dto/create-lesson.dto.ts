import { IsString, IsInt, IsOptional, Min, IsUrl } from 'class-validator';

export class CreateLessonDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @IsInt()
  @Min(1)
  estimatedDuration: number;

  @IsInt()
  @Min(1)
  orderIndex: number;
}
