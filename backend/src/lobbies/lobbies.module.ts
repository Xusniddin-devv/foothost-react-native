import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Lobby } from './lobby.entity';
import { LobbyPlayer } from './lobby-player.entity';
import { Field } from '../fields/field.entity';
import { User } from '../users/user.entity';
import { LobbiesService } from './lobbies.service';
import { LobbiesController } from './lobbies.controller';
import { LobbyExpiryJob } from './lobby-expiry.job';
import { TeamsModule } from '../teams/teams.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lobby, LobbyPlayer, Field, User]),
    ScheduleModule.forRoot(),
    TeamsModule,
    forwardRef(() => NotificationsModule),
    forwardRef(() => PaymentsModule),
  ],
  controllers: [LobbiesController],
  providers: [LobbiesService, LobbyExpiryJob],
  exports: [LobbiesService, TypeOrmModule],
})
export class LobbiesModule {}
