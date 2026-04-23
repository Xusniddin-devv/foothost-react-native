import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { NotificationsGateway } from './notifications.gateway';
import { Payment } from '../payments/payment.entity';

export interface PlayerInfo {
  userId: string;
  name: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectQueue('notifications') private queue: Queue,
    private gateway: NotificationsGateway,
  ) {}

  private enqueuePush(data: Record<string, unknown>): void {
    this.queue
      .add('push', data, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } })
      .catch(() => undefined);
  }

  emitLobbyPaid(lobbyId: string): void {
    this.gateway.emitToLobby(lobbyId, 'lobby:paid', { lobbyId });
    this.enqueuePush({ lobbyId, event: 'lobby:paid' });
  }

  emitPaymentUpdated(lobbyId: string, payments: Payment[]): void {
    const confirmedAmount = payments
      .filter((p) => p.status === 'confirmed')
      .reduce((s, p) => s + p.amount, 0);
    this.gateway.emitToLobby(lobbyId, 'lobby:payment_updated', {
      lobbyId,
      confirmedAmount,
      payments,
    });
  }

  emitPlayerJoined(lobbyId: string, player: PlayerInfo): void {
    this.gateway.emitToLobby(lobbyId, 'lobby:player_joined', {
      lobbyId,
      ...player,
    });
    this.enqueuePush({
      lobbyId,
      event: 'lobby:player_joined',
      data: player,
    });
  }

  emitLobbyBooked(lobbyId: string, slot: unknown): void {
    this.gateway.emitToLobby(lobbyId, 'lobby:booked', { lobbyId, slot });
    this.enqueuePush({ lobbyId, event: 'lobby:booked', data: slot });
  }

  emitLobbyCancelled(lobbyId: string, reason: string): void {
    this.gateway.emitToLobby(lobbyId, 'lobby:cancelled', { lobbyId, reason });
    this.enqueuePush({
      lobbyId,
      event: 'lobby:cancelled',
      data: { reason },
    });
  }
}
