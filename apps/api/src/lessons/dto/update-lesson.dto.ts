import { IsString, IsInt, IsOptional, Min, IsUrl } from 'class-validator';

export class UpdateLessonDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() content?: string;
  @IsOptional() @IsUrl() videoUrl?: string;
  @IsOptional() @IsInt() @Min(1) estimatedDuration?: number;
  @IsOptional() @IsInt() @Min(1) orderIndex?: number;
}
