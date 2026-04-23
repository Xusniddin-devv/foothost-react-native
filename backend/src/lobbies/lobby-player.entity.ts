import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm';
import { Lobby } from './lobby.entity';
import { User } from '../users/user.entity';

@Entity('lobby_players')
@Unique(['lobbyId', 'userId'])
export class LobbyPlayer {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() lobbyId!: string;
  @Column() userId!: string;
  @Column({ nullable: true }) teamId!: string;
  @ManyToOne(() => Lobby) @JoinColumn({ name: 'lobbyId' }) lobby!: Lobby;
  @ManyToOne(() => User) @JoinColumn({ name: 'userId' }) user!: User;
  @CreateDateColumn() joinedAt!: Date;
}
