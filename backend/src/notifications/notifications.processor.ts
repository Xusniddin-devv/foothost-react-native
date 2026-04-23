import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { LobbyPlayer } from '../lobbies/lobby-player.entity';
import { User } from '../users/user.entity';

const MESSAGES: Record<string, (data?: any) => string> = {
  'lobby:player_joined': (d) => `${d?.name ?? 'Игрок'} вступил в лобби`,
  'lobby:paid': () => 'Оплата собрана! Выберите слот для игры',
  'lobby:booked': (d) =>
    `Поле забронировано${d?.startTime ? `: ${new Date(d.startTime).toLocaleString('ru-RU')}` : ''}`,
  'lobby:cancelled': () => 'Лобби отменено',
};

interface PushJob {
  lobbyId: string;
  event: string;
  data?: unknown;
}

@Processor('notifications')
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);
  private readonly expo = new Expo({
    accessToken: process.env.EXPO_ACCESS_TOKEN,
  });

  constructor(
    @InjectRepository(LobbyPlayer) private playerRepo: Repository<LobbyPlayer>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  @Process('push')
  async handlePush(job: Job<PushJob>): Promise<void> {
    const { lobbyId, event, data } = job.data;
    const players = await this.playerRepo.find({ where: { lobbyId } });
    if (players.length === 0) return;

    const users = await this.userRepo.find({
      where: { id: In(players.map((p) => p.userId)) },
    });

    const body = MESSAGES[event]?.(data) ?? event;
    const messages: ExpoPushMessage[] = users
      .map((u) => u.expoPushToken)
      .filter((t): t is string => !!t && Expo.isExpoPushToken(t))
      .map((to) => ({ to, sound: 'default', body, data: { event, lobbyId } }));

    if (messages.length === 0) return;

    const chunks = this.expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        await this.expo.sendPushNotificationsAsync(chunk);
      } catch (err) {
        this.logger.error(`Expo push failed: ${(err as Error).message}`);
      }
    }
  }
}
