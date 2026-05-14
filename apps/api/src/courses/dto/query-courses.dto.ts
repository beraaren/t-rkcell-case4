import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Level } from '@prisma/client';

export class QueryCoursesDto {
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsEnum(Level) level?: Level;
  @IsOptional() @IsString() q?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number = 12;
}
