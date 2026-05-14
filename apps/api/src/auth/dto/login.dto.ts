import { Matches, IsString } from 'class-validator';

export class LoginDto {
  @Matches(/^05\d{9}$/, { message: 'Geçerli bir GSM numarası giriniz' })
  gsm: string;

  @IsString()
  password: string;
}
