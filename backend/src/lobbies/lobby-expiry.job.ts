import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { Lobby } from './lobby.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class LobbyExpiryJob {
  private readonly logger = new Logger(LobbyExpiryJob.name);

  constructor(
    @InjectRepository(Lobby) private lobbyRepo: Repository<Lobby>,
    @Inject(forwardRef(() => NotificationsService))
    private notifications: NotificationsService,
    @Inject(forwardRef(() => PaymentsService))
    private payments: PaymentsService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async expireLobbies(): Promise<void> {
    const expired = await this.lobbyRepo.find({
      where: {
        status: In(['draft', 'active', 'full']),
        expiresAt: LessThan(new Date()),
      },
    });

    for (const lobby of expired) {
      try {
        await this.lobbyRepo.update(lobby.id, { status: 'cancelled' });
        await this.payments.refundAll(lobby.id);
        this.notifications.emitLobbyCancelled(lobby.id, 'expired');
        this.logger.log(`Expired lobby ${lobby.id}`);
      } catch (err) {
        this.logger.error(
          `Failed to expire lobby ${lobby.id}: ${(err as Error).message}`,
        );
      }
    }
  }
}
