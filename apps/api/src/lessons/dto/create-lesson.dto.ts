import { IsString, IsInt, Min } from 'class-validator';

export class CreateLessonDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsInt()
  @Min(1)
  estimatedDuration: number;

  @IsInt()
  @Min(1)
  orderIndex: number;
}
