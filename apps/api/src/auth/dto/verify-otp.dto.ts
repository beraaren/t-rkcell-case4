import { Matches, Length } from 'class-validator';

export class VerifyOtpDto {
  @Matches(/^05\d{9}$/)
  gsm: string;

  @Length(4, 4, { message: 'OTP 4 haneli olmalı' })
  code: string;
}
