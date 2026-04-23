import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './team.entity';

@Injectable()
export class TeamsService {
  constructor(@InjectRepository(Team) private teamRepo: Repository<Team>) {}

  createForLobby(lobbyId: string, count: number): Promise<Team[]> {
    const teams = Array.from({ length: count }, (_, i) =>
      this.teamRepo.create({ lobbyId, name: `Команда ${i + 1}` }),
    );
    return this.teamRepo.save(teams);
  }

  findByLobby(lobbyId: string): Promise<Team[]> {
    return this.teamRepo.find({ where: { lobbyId } });
  }
}
