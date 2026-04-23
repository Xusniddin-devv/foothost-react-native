import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class EskizService {
  private readonly logger = new Logger(EskizService.name);
  private token: string | null = null;

  private async getToken(): Promise<string> {
    if (this.token) return this.token;
    const res = await axios.post('https://notify.eskiz.uz/api/auth/login', {
      email: process.env.ESKIZ_EMAIL,
      password: process.env.ESKIZ_PASSWORD,
    });
    this.token = res.data.data.token as string;
    return this.token;
  }

  async sendSms(phone: string, message: string): Promise<void> {
    try {
      const token = await this.getToken();
      await axios.post(
        'https://notify.eskiz.uz/api/message/sms/send',
        { mobile_phone: phone, message, from: '4546' },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (err: unknown) {
      this.logger.error('Eskiz SMS failed', (err as any)?.response?.data);
      if ((err as any)?.response?.status === 401) this.token = null;
      throw err;
    }
  }
}
