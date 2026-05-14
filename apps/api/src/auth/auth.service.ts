import {
  Injectable,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const FIXED_OTP = '1234';
// in-memory pending: gsm -> { passwordHash, name, role }
const pendingRegistrations = new Map<string, any>();
// in-memory login pending: gsm -> userId
const pendingLogins = new Map<string, string>();

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { gsm: dto.gsm } });
    if (existing) throw new ConflictException('Bu GSM numarası zaten kayıtlı');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    pendingRegistrations.set(dto.gsm, {
      passwordHash,
      name: dto.name,
      role: dto.role,
    });

    return { message: 'OTP gönderildi. Kodu doğrulayın.', gsm: dto.gsm };
  }

  async verifyOtp(gsm: string, code: string) {
    if (code !== FIXED_OTP) throw new BadRequestException('Geçersiz OTP kodu');

    // Login OTP verify
    if (pendingLogins.has(gsm)) {
      const userId = pendingLogins.get(gsm)!;
      pendingLogins.delete(gsm);
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new UnauthorizedException('Kullanıcı bulunamadı');
      return this.generateTokens(user);
    }

    // Register OTP verify
    const pending = pendingRegistrations.get(gsm);
    if (!pending) throw new BadRequestException('Kayıt isteği bulunamadı. Tekrar kayıt olun.');

    pendingRegistrations.delete(gsm);

    const user = await this.prisma.user.create({
      data: {
        gsm,
        passwordHash: pending.passwordHash,
        name: pending.name,
        role: pending.role,
      },
    });

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { gsm: dto.gsm } });
    if (!user) throw new UnauthorizedException('GSM veya şifre hatalı');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('GSM veya şifre hatalı');

    pendingLogins.set(dto.gsm, user.id);
    return { message: 'OTP gönderildi. Kodu doğrulayın.', gsm: dto.gsm };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
      });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException();
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Geçersiz refresh token');
    }
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, gsm: true, name: true, role: true, bio: true, meta: true, createdAt: true },
    });
    return user;
  }

  private generateTokens(user: { id: string; role: string }) {
    const payload = { sub: user.id, role: user.role };
    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'access_secret',
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
    return { accessToken, refreshToken };
  }
}
