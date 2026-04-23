import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

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
import { News } from './news/news.entity';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FieldsModule } from './fields/fields.module';
import { LobbiesModule } from './lobbies/lobbies.module';
import { TeamsModule } from './teams/teams.module';
import { PaymentsModule } from './payments/payments.module';
import { BookingsModule } from './bookings/bookings.module';
import { ReviewsModule } from './reviews/reviews.module';
import { NotificationsModule } from './notifications/notifications.module';
import { NewsModule } from './news/news.module';
import { UploadsModule } from './uploads/uploads.module';

function parseRedisUrl(url?: string) {
  if (!url) return { host: 'localhost', port: 6379 };
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 6379,
    password: parsed.password || undefined,
    username: parsed.username || undefined,
    tls: parsed.protocol === 'rediss:' ? {} : undefined,
  };
}

const UPLOAD_ROOT = process.env.UPLOAD_ROOT ?? join(process.cwd(), 'uploads');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [
        User,
        OtpCode,
        Field,
        FieldSlot,
        Lobby,
        LobbyPlayer,
        Team,
        Payment,
        Booking,
        Review,
        News,
      ],
      synchronize: process.env.NODE_ENV !== 'production',
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
    }),
    BullModule.forRoot({ redis: parseRedisUrl(process.env.REDIS_URL) }),
    ServeStaticModule.forRoot({
      rootPath: UPLOAD_ROOT,
      serveRoot: '/uploads',
      serveStaticOptions: { index: false, fallthrough: false },
    }),
    UploadsModule,
    AuthModule,
    UsersModule,
    FieldsModule,
    LobbiesModule,
    TeamsModule,
    PaymentsModule,
    BookingsModule,
    ReviewsModule,
    NotificationsModule,
    NewsModule,
  ],
})
export class AppModule {}
