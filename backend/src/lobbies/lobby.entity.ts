import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Field } from '../fields/field.entity';

export type LobbyStatus = 'draft' | 'active' | 'full' | 'paid' | 'booked' | 'cancelled';
export type LobbyType = 'open' | 'invite_only' | 'closed';

@Entity('lobbies')
export class Lobby {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() creatorId!: string;
  @ManyToOne(() => User) @JoinColumn({ name: 'creatorId' }) creator!: User;
  @Column() fieldId!: string;
  @ManyToOne(() => Field) @JoinColumn({ name: 'fieldId' }) field!: Field;
  @Column({ type: 'varchar', default: 'draft' }) status!: LobbyStatus;
  @Column({ type: 'varchar', default: 'open' }) type!: LobbyType;
  @Column({ type: 'int' }) maxPlayers!: number;
  @Column({ type: 'int' }) teamCount!: number;
  @Column({ type: 'int' }) durationHours!: number;
  @Column({ type: 'int' }) totalAmount!: number;
  @Column({ unique: true }) inviteCode!: string;
  @Column({ type: 'timestamptz' }) expiresAt!: Date;
  @CreateDateColumn() createdAt!: Date;
}
