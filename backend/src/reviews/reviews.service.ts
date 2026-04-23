import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './review.entity';
import { Booking } from '../bookings/booking.entity';
import { LobbyPlayer } from '../lobbies/lobby-player.entity';
import { Lobby } from '../lobbies/lobby.entity';
import { Field } from '../fields/field.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    @InjectRepository(Review) private reviewRepo: Repository<Review>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(LobbyPlayer) private playerRepo: Repository<LobbyPlayer>,
    @InjectRepository(Lobby) private lobbyRepo: Repository<Lobby>,
    @InjectRepository(Field) private fieldRepo: Repository<Field>,
  ) {}

  async create(
    bookingId: string,
    authorId: string,
    dto: CreateReviewDto,
  ): Promise<Review> {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    const played = await this.playerRepo.findOne({
      where: { lobbyId: booking.lobbyId, userId: authorId },
    });
    if (!played) {
      throw new ForbiddenException('You did not participate in this match');
    }

    const existing = await this.reviewRepo.findOne({
      where: { bookingId, authorId },
    });
    if (existing) throw new ConflictException('Review already submitted');

    const review = await this.reviewRepo.save(
      this.reviewRepo.create({ bookingId, authorId, ...dto }),
    );

    this.updateFieldRating(booking.lobbyId).catch((err) =>
      this.logger.warn(`Failed to update field rating: ${err?.message}`),
    );

    return review;
  }

  findByField(fieldId: string): Promise<Review[]> {
    return this.reviewRepo
      .createQueryBuilder('r')
      .innerJoin('bookings', 'b', 'b.id = r.bookingId')
      .innerJoin('lobbies', 'l', 'l.id = b.lobbyId')
      .where('l.fieldId = :fieldId', { fieldId })
      .orderBy('r.createdAt', 'DESC')
      .getMany();
  }

  private async updateFieldRating(lobbyId: string): Promise<void> {
    const lobby = await this.lobbyRepo.findOne({ where: { id: lobbyId } });
    if (!lobby) return;

    const result = await this.reviewRepo
      .createQueryBuilder('r')
      .innerJoin('bookings', 'b', 'b.id = r.bookingId')
      .innerJoin('lobbies', 'l', 'l.id = b.lobbyId')
      .where('l.fieldId = :fieldId', { fieldId: lobby.fieldId })
      .select('AVG(r.fieldRating)', 'avg')
      .getRawOne<{ avg: string | null }>();

    const avg = Number(result?.avg ?? 0);
    await this.fieldRepo.update(lobby.fieldId, { rating: avg });
  }
}
