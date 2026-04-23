import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { EskizService } from './eskiz.service';
import { JwtStrategy } from './jwt.strategy';
import { User } from '../users/user.entity';
import { OtpCode } from './otp-code.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, OtpCode]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'fallback_secret',
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN ?? '15m') as any },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, OtpService, EskizService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
