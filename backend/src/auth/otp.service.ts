import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OtpCode } from './otp-code.entity';
import { EskizService } from './eskiz.service';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(OtpCode) private otpRepo: Repository<OtpCode>,
    private eskiz: EskizService,
  ) {}

  async send(phone: string): Promise<void> {
    // Skip actual SMS in test environment
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await this.otpRepo.save({ phone, code, expiresAt, used: false });
    if (process.env.NODE_ENV === 'test') return;
    await this.eskiz.sendSms(phone, `Foothost tasdiqlash kodi: ${code}`);
  }

  async verify(phone: string, code: string): Promise<boolean> {
    const otp = await this.otpRepo.findOne({
      where: { phone, code, used: false },
      order: { expiresAt: 'DESC' },
    });
    if (!otp || otp.expiresAt < new Date()) return false;
    await this.otpRepo.update(otp.id, { used: true });
    return true;
  }
}
