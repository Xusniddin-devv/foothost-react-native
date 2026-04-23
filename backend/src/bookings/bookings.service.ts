import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Booking } from './booking.entity';
import { Lobby } from '../lobbies/lobby.entity';
import { FieldSlot } from '../fields/field-slot.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Lobby) private lobbyRepo: Repository<Lobby>,
    private dataSource: DataSource,
    @Inject(forwardRef(() => NotificationsService))
    private notifications: NotificationsService,
    @Inject(forwardRef(() => PaymentsService))
    private payments: PaymentsService,
  ) {}

  async book(
    lobbyId: string,
    fieldSlotId: string,
    userId: string,
  ): Promise<Booking> {
    const lobby = await this.lobbyRepo.findOne({ where: { id: lobbyId } });
    if (!lobby) throw new NotFoundException('Lobby not found');
    if (lobby.creatorId !== userId) {
      throw new ForbiddenException('Only the creator can book a slot');
    }
    if (lobby.status !== 'paid') {
      throw new BadRequestException('Lobby must be fully paid before booking');
    }

    const booking = await this.dataSource.transaction(async (manager) => {
      const slot = await manager
        .getRepository(FieldSlot)
        .createQueryBuilder('slot')
        .where('slot.id = :id', { id: fieldSlotId })
        .setLock('pessimistic_write')
        .getOne();

      if (!slot) throw new NotFoundException('Slot not found');
      if (slot.status !== 'available') {
        throw new ConflictException('Slot is no longer available');
      }

      await manager.update(FieldSlot, fieldSlotId, { status: 'locked' });

      const saved = await manager.save(
        manager.create(Booking, {
          lobbyId,
          fieldSlotId,
          status: 'confirmed',
          confirmedAt: new Date(),
        }),
      );

      await manager.update(FieldSlot, fieldSlotId, { status: 'booked' });
      await manager.update(Lobby, lobbyId, { status: 'booked' });

      return saved;
    });

    const slot = await this.dataSource
      .getRepository(FieldSlot)
      .findOne({ where: { id: fieldSlotId } });
    if (slot) this.notifications.emitLobbyBooked(lobbyId, slot);

    return booking;
  }

  findByLobby(lobbyId: string): Promise<Booking | null> {
    return this.bookingRepo.findOne({ where: { lobbyId } });
  }

  async cancel(lobbyId: string, userId: string): Promise<void> {
    const lobby = await this.lobbyRepo.findOne({ where: { id: lobbyId } });
    if (!lobby) throw new NotFoundException('Lobby not found');
    if (lobby.creatorId !== userId) throw new ForbiddenException();

    const booking = await this.findByLobby(lobbyId);
    if (booking) {
      await this.bookingRepo.update(booking.id, { status: 'cancelled' });
      await this.dataSource
        .getRepository(FieldSlot)
        .update(booking.fieldSlotId, { status: 'available' });
    }

    await this.lobbyRepo.update(lobbyId, { status: 'cancelled' });
    await this.payments.refundAll(lobbyId);
    this.notifications.emitLobbyCancelled(lobbyId, 'creator_cancelled');
  }
}
