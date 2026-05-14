import { IsInt, IsBoolean, IsOptional, Min, Max } from 'class-validator';

export class CreateExamDto {
  @IsInt()
  @Min(1)
  timeLimitMin: number;

  @IsInt()
  @Min(0)
  @Max(100)
  passingScore: number;

  @IsOptional()
  @IsBoolean()
  shuffle?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxAttempts?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  questionCount?: number;
}
