import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Lobby } from '../lobbies/lobby.entity';

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() lobbyId!: string;
  @ManyToOne(() => Lobby) @JoinColumn({ name: 'lobbyId' }) lobby!: Lobby;
  @Column() name!: string;
}
