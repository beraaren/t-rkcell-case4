import { IsString, IsEnum, Matches, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @Matches(/^05\d{9}$/, { message: 'Geçerli bir GSM numarası giriniz (05XXXXXXXXX)' })
  gsm: string;

  @MinLength(6, { message: 'Şifre en az 6 karakter olmalı' })
  password: string;

  @IsString()
  name: string;

  @IsEnum([Role.STUDENT, Role.INSTRUCTOR], { message: 'Rol STUDENT veya INSTRUCTOR olmalı' })
  role: Role;
}
