import { NestFactory } from '@nestjs/core';
import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { NotificationsProcessor } from './notifications/notifications.processor';
import { LobbyPlayer } from './lobbies/lobby-player.entity';
import { User } from './users/user.entity';

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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [LobbyPlayer, User],
      synchronize: false,
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
    }),
    TypeOrmModule.forFeature([LobbyPlayer, User]),
    BullModule.forRoot({ redis: parseRedisUrl(process.env.REDIS_URL) }),
    BullModule.registerQueue({ name: 'notifications' }),
  ],
  providers: [NotificationsProcessor],
})
class WorkerModule {}

async function bootstrap(): Promise<void> {
  const logger = new Logger('Worker');
  await NestFactory.createApplicationContext(WorkerModule);
  logger.log('Notification worker started');
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Worker failed to start:', err);
  process.exit(1);
});
