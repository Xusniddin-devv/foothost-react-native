import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './payment.entity';
import { Lobby } from '../lobbies/lobby.entity';
import { calculateShare } from './payment-share.util';
import {
  PaymentProvider,
  PAYMENT_PROVIDER,
} from './providers/payment-provider.interface';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Lobby) private lobbyRepo: Repository<Lobby>,
    @Inject(PAYMENT_PROVIDER) private provider: PaymentProvider,
    @Inject(forwardRef(() => NotificationsService))
    private notifications: NotificationsService,
  ) {}

  async getLobbyPayments(lobbyId: string) {
    const lobby = await this.lobbyRepo.findOne({ where: { id: lobbyId } });
    if (!lobby) throw new NotFoundException('Lobby not found');
    const payments = await this.paymentRepo.find({ where: { lobbyId } });
    const confirmed = payments.filter((p) => p.status === 'confirmed');
    const confirmedTotal = confirmed.reduce((s, p) => s + p.amount, 0);
    const nextShare = calculateShare({
      totalAmount: lobby.totalAmount,
      confirmedTotal,
      maxPlayers: lobby.maxPlayers,
      confirmedCount: confirmed.length,
    });
    return {
      payments,
      confirmedTotal,
      totalAmount: lobby.totalAmount,
      nextShare,
    };
  }

  async initiate(
    lobbyId: string,
    userId: string,
  ): Promise<{ redirectUrl: string; amount: number; paymentId: string }> {
    const lobby = await this.lobbyRepo.findOne({ where: { id: lobbyId } });
    if (!lobby) throw new NotFoundException('Lobby not found');
    if (!['active', 'full'].includes(lobby.status)) {
      throw new BadRequestException('Lobby is not accepting payments');
    }

    const existing = await this.paymentRepo.findOne({
      where: { lobbyId, userId },
    });
    if (existing?.status === 'confirmed') {
      throw new BadRequestException('Already paid');
    }

    const payments = await this.paymentRepo.find({ where: { lobbyId } });
    const confirmed = payments.filter((p) => p.status === 'confirmed');
    const amount = calculateShare({
      totalAmount: lobby.totalAmount,
      confirmedTotal: confirmed.reduce((s, p) => s + p.amount, 0),
      maxPlayers: lobby.maxPlayers,
      confirmedCount: confirmed.length,
    });

    let payment =
      existing ??
      this.paymentRepo.create({ lobbyId, userId, amount, status: 'pending' });
    payment.amount = amount;
    payment = await this.paymentRepo.save(payment);

    const result = await this.provider.initiate({
      amount,
      userId,
      lobbyId,
      paymentId: payment.id,
    });
    await this.paymentRepo.update(payment.id, {
      providerRef: result.providerRef,
      status: 'reserved',
    });

    return {
      redirectUrl: result.redirectUrl,
      amount,
      paymentId: payment.id,
    };
  }

  async handleWebhook(_providerName: string, payload: unknown): Promise<void> {
    const result = await this.provider.verify(payload);
    const payment = await this.paymentRepo.findOne({
      where: { providerRef: result.providerRef },
    });
    if (!payment) return;

    if (result.status !== 'success') return;

    await this.paymentRepo.update(payment.id, {
      status: 'confirmed',
      paidAt: new Date(),
    });

    const lobby = await this.lobbyRepo.findOne({
      where: { id: payment.lobbyId },
    });
    if (!lobby) return;

    const all = await this.paymentRepo.find({
      where: { lobbyId: payment.lobbyId },
    });
    const confirmedCount = all.filter((p) => p.status === 'confirmed').length;

    if (confirmedCount >= lobby.maxPlayers) {
      await this.lobbyRepo.update(lobby.id, { status: 'paid' });
      this.notifications.emitLobbyPaid(lobby.id);
    } else {
      this.notifications.emitPaymentUpdated(lobby.id, all);
    }
  }

  async refundAll(lobbyId: string): Promise<void> {
    const payments = await this.paymentRepo.find({
      where: { lobbyId, status: 'confirmed' },
    });
    for (const payment of payments) {
      if (payment.providerRef) {
        await this.provider.refund(payment.providerRef, payment.amount);
      }
      await this.paymentRepo.update(payment.id, { status: 'refunded' });
    }
  }
}
