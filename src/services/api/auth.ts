import { apiRequest } from './client';
import type {
  AuthTokens,
  LoginDto,
  RegisterDto,
  User,
  VerifyOtpDto,
} from '../../types/api';

export const authApi = {
  register: (dto: RegisterDto) =>
    apiRequest<{ userId: string; message: string }>({
      method: 'POST',
      url: '/auth/register',
      data: dto,
    }),

  verifyOtp: (dto: VerifyOtpDto) =>
    apiRequest<AuthTokens>({
      method: 'POST',
      url: '/auth/verify-otp',
      data: dto,
    }),

  login: (dto: LoginDto) =>
    apiRequest<AuthTokens>({
      method: 'POST',
      url: '/auth/login',
      data: dto,
    }),

  guestToken: () =>
    apiRequest<{ accessToken: string }>({
      method: 'POST',
      url: '/auth/guest',
    }),

  resendOtp: (phone: string) =>
    apiRequest<{ message: string }>({
      method: 'POST',
      url: '/auth/resend-otp',
      data: { phone },
    }),

  me: () => apiRequest<User>({ method: 'GET', url: '/users/me' }),
};
