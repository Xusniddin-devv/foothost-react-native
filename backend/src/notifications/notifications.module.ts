import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { NotificationsProcessor } from './notifications.processor';
import { LobbyPlayer } from '../lobbies/lobby-player.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LobbyPlayer, User]),
    BullModule.registerQueue({ name: 'notifications' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'fallback_secret',
    }),
  ],
  providers: [
    NotificationsGateway,
    NotificationsService,
    NotificationsProcessor,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
