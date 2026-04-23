import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) { return this.auth.register(dto); }

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) { return this.auth.verifyOtp(dto.phone, dto.code); }

  @Post('login')
  login(@Body() dto: LoginDto) { return this.auth.login(dto); }

  @Post('guest')
  guest() { return this.auth.guestToken(); }

  @Post('resend-otp')
  resendOtp(@Body() body: { phone: string }) { return this.auth.resendOtp(body.phone); }
}
