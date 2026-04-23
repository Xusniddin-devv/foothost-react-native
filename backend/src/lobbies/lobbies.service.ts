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
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Lobby } from './lobby.entity';
import { LobbyPlayer } from './lobby-player.entity';
import { Field } from '../fields/field.entity';
import { User } from '../users/user.entity';
import { TeamsService } from '../teams/teams.service';
import { CreateLobbyDto } from './dto/create-lobby.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { assertIsCreator } from '../common/guards/lobby-creator.guard';

@Injectable()
export class LobbiesService {
  constructor(
    @InjectRepository(Lobby) private lobbyRepo: Repository<Lobby>,
    @InjectRepository(LobbyPlayer) private playerRepo: Repository<LobbyPlayer>,
    @InjectRepository(Field) private fieldRepo: Repository<Field>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private teams: TeamsService,
    @Inject(forwardRef(() => NotificationsService))
    private notifications: NotificationsService,
  ) {}

  findOpen(): Promise<Lobby[]> {
    return this.lobbyRepo.find({
      where: { status: 'active', type: 'open' },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Lobby> {
    const lobby = await this.lobbyRepo.findOne({ where: { id } });
    if (!lobby) throw new NotFoundException('Lobby not found');
    return lobby;
  }

  async getPlayers(lobbyId: string): Promise<LobbyPlayer[]> {
    return this.playerRepo.find({ where: { lobbyId } });
  }

  async create(creatorId: string, dto: CreateLobbyDto): Promise<Lobby> {
    const field = await this.fieldRepo.findOne({ where: { id: dto.fieldId } });
    if (!field) throw new NotFoundException('Field not found');

    const totalAmount = field.pricePerHour * dto.durationHours;
    const lobby = await this.lobbyRepo.save(
      this.lobbyRepo.create({
        creatorId,
        fieldId: dto.fieldId,
        type: dto.type,
        maxPlayers: dto.maxPlayers,
        teamCount: dto.teamCount,
        durationHours: dto.durationHours,
        totalAmount,
        status: 'draft',
        inviteCode: uuidv4(),
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      }),
    );

    await this.teams.createForLobby(lobby.id, dto.teamCount);
    await this.playerRepo.save(
      this.playerRepo.create({ lobbyId: lobby.id, userId: creatorId }),
    );
    return lobby;
  }

  async publish(lobbyId: string, creatorId: string): Promise<Lobby> {
    const lobby = await this.findOne(lobbyId);
    assertIsCreator(lobby, creatorId);
    if (lobby.status !== 'draft') {
      throw new BadRequestException('Only draft lobbies can be published');
    }
    await this.lobbyRepo.update(lobbyId, { status: 'active' });
    return this.findOne(lobbyId);
  }

  async join(
    lobbyId: string,
    userId: string,
    inviteCode?: string,
  ): Promise<Lobby> {
    const lobby = await this.findOne(lobbyId);

    if (lobby.type === 'closed') {
      throw new ForbiddenException('Lobby is closed');
    }
    if (lobby.type === 'invite_only' && lobby.inviteCode !== inviteCode) {
      throw new ForbiddenException('Invalid invite code');
    }
    if (!['active', 'draft'].includes(lobby.status)) {
      throw new ConflictException('Lobby is not joinable');
    }

    const count = await this.playerRepo.count({ where: { lobbyId } });
    if (count >= lobby.maxPlayers) {
      throw new ConflictException('Lobby is full');
    }

    const existing = await this.playerRepo.findOne({
      where: { lobbyId, userId },
    });
    if (existing) throw new ConflictException('Already in lobby');

    await this.playerRepo.save(
      this.playerRepo.create({ lobbyId, userId }),
    );

    if (count + 1 >= lobby.maxPlayers) {
      await this.lobbyRepo.update(lobbyId, { status: 'full' });
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    this.notifications.emitPlayerJoined(lobbyId, {
      userId,
      name: user ? `${user.firstName} ${user.lastName}` : 'Игрок',
    });

    return this.findOne(lobbyId);
  }

  async leave(lobbyId: string, userId: string): Promise<void> {
    const record = await this.playerRepo.findOne({
      where: { lobbyId, userId },
    });
    if (!record) throw new NotFoundException('Not in lobby');
    await this.playerRepo.delete(record.id);

    const lobby = await this.findOne(lobbyId);
    if (lobby.status === 'full') {
      await this.lobbyRepo.update(lobbyId, { status: 'active' });
    }
  }

  async kick(
    lobbyId: string,
    creatorId: string,
    targetUserId: string,
  ): Promise<void> {
    const lobby = await this.findOne(lobbyId);
    assertIsCreator(lobby, creatorId);
    const record = await this.playerRepo.findOne({
      where: { lobbyId, userId: targetUserId },
    });
    if (!record) throw new NotFoundException('Player not in lobby');
    await this.playerRepo.delete(record.id);
  }

  async cancel(lobbyId: string, creatorId: string): Promise<void> {
    const lobby = await this.findOne(lobbyId);
    assertIsCreator(lobby, creatorId);
    await this.lobbyRepo.update(lobbyId, { status: 'cancelled' });
    this.notifications.emitLobbyCancelled(lobbyId, 'creator_cancelled');
  }

  async joinTeam(
    lobbyId: string,
    teamId: string,
    userId: string,
  ): Promise<void> {
    const record = await this.playerRepo.findOne({
      where: { lobbyId, userId },
    });
    if (!record) throw new ForbiddenException('Not in lobby');
    await this.playerRepo.update(record.id, { teamId });
  }
}
