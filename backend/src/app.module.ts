import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity';
import { OtpCode } from './auth/otp-code.entity';
import { Field } from './fields/field.entity';
import { FieldSlot } from './fields/field-slot.entity';
import { Lobby } from './lobbies/lobby.entity';
import { LobbyPlayer } from './lobbies/lobby-player.entity';
import { Team } from './teams/team.entity';
import { Payment } from './payments/payment.entity';
import { Booking } from './bookings/booking.entity';
import { Review } from './reviews/review.entity';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, OtpCode, Field, FieldSlot, Lobby, LobbyPlayer, Team, Payment, Booking, Review],
      synchronize: process.env.NODE_ENV !== 'production',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }),
    AuthModule,
  ],
})
export class AppModule {}
