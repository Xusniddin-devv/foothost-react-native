import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Lobby } from '../lobbies/lobby.entity';
import { User } from '../users/user.entity';

export type PaymentStatus = 'pending' | 'reserved' | 'confirmed' | 'refunded';

@Entity('payments')
@Unique(['lobbyId', 'userId'])
export class Payment {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() lobbyId!: string;
  @Column() userId!: string;
  @ManyToOne(() => Lobby) @JoinColumn({ name: 'lobbyId' }) lobby!: Lobby;
  @ManyToOne(() => User) @JoinColumn({ name: 'userId' }) user!: User;
  @Column({ type: 'int' }) amount!: number;
  @Column({ type: 'varchar', default: 'pending' }) status!: PaymentStatus;
  @Column({ nullable: true }) providerRef!: string | null;
  @Column({ type: 'timestamptz', nullable: true }) paidAt!: Date | null;
}
