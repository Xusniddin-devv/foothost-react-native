import { apiRequest } from './client';
import type { Booking } from '../../types/api';

export const bookingsApi = {
  book: (lobbyId: string, fieldSlotId: string) =>
    apiRequest<Booking>({
      method: 'POST',
      url: `/bookings/${lobbyId}/book`,
      data: { fieldSlotId },
    }),
  get: (lobbyId: string) =>
    apiRequest<Booking | null>({
      method: 'GET',
      url: `/bookings/${lobbyId}`,
    }),
  cancel: (lobbyId: string) =>
    apiRequest<void>({ method: 'DELETE', url: `/bookings/${lobbyId}` }),
};
