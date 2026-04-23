import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../users/user.entity';
import { OtpService } from './otp.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
    private otpService: OtpService,
  ) {}

  async register(dto: RegisterDto): Promise<{ userId: string; message: string }> {
    const exists = await this.userRepo.findOne({ where: { phone: dto.phone } });
    if (exists) throw new ConflictException('Phone already registered');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.userRepo.save({
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      passwordHash,
    });
    await this.otpService.send(dto.phone);
    return { userId: user.id, message: 'OTP sent' };
  }

  async verifyOtp(phone: string, code: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userRepo.findOne({ where: { phone } });
    if (!user) throw new BadRequestException('User not found');
    const valid = await this.otpService.verify(phone, code);
    if (!valid) throw new BadRequestException('Invalid or expired OTP');
    await this.userRepo.update(user.id, { isPhoneVerified: true });
    return this.issueTokens({ ...user, isPhoneVerified: true });
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userRepo.findOne({ where: { phone: dto.phone } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const match = await bcrypt.compare(dto.password, user.passwordHash);
    if (!match) throw new UnauthorizedException('Invalid credentials');
    return this.issueTokens(user);
  }

  guestToken(): { accessToken: string } {
    const token = this.jwtService.sign(
      { sub: uuidv4(), phone: null, isGuest: true, isVerified: false },
      { expiresIn: '24h' },
    );
    return { accessToken: token };
  }

  async resendOtp(phone: string): Promise<{ message: string }> {
    await this.otpService.send(phone);
    return { message: 'OTP sent' };
  }

  private issueTokens(user: User): { accessToken: string; refreshToken: string } {
    const payload: JwtPayload = {
      sub: user.id,
      phone: user.phone,
      isGuest: false,
      isVerified: user.isPhoneVerified,
      role: user.role,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        secret: process.env.JWT_REFRESH_SECRET ?? 'fallback_refresh',
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '30d') as any,
      }),
    };
  }
}
