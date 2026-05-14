import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GenerateQuestionsDto {
  @IsString()
  moduleId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(15)
  count?: number;
}
