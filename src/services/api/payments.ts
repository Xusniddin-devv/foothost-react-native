import { apiRequest } from './client';
import type { Payment } from '../../types/api';

export const paymentsApi = {
  status: (lobbyId: string) =>
    apiRequest<{
      payments: Payment[];
      confirmedTotal: number;
      totalAmount: number;
      remainingAmount: number;
      nextShare: number;
    }>({ method: 'GET', url: `/payments/${lobbyId}` }),
  initiate: (lobbyId: string, amount?: number) =>
    apiRequest<{ redirectUrl: string; amount: number; paymentId: string }>({
      method: 'POST',
      url: `/payments/${lobbyId}/initiate`,
      data: amount ? { amount } : undefined,
    }),
};
