import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './review.entity';
import { Booking } from '../bookings/booking.entity';
import { LobbyPlayer } from '../lobbies/lobby-player.entity';
import { Lobby } from '../lobbies/lobby.entity';
import { Field } from '../fields/field.entity';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, Booking, LobbyPlayer, Lobby, Field]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
