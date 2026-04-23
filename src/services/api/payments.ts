import { apiRequest } from './client';
import type { Payment } from '../../types/api';

export const paymentsApi = {
  status: (lobbyId: string) =>
    apiRequest<Payment[]>({ method: 'GET', url: `/payments/${lobbyId}` }),
  initiate: (lobbyId: string) =>
    apiRequest<{ redirectUrl: string; amount: number; paymentId: string }>({
      method: 'POST',
      url: `/payments/${lobbyId}/initiate`,
    }),
};
