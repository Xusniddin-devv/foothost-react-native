import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Lobby } from '../lobbies/lobby.entity';
import { FieldSlot } from '../fields/field-slot.entity';

export type BookingStatus = 'confirmed' | 'cancelled';

@Entity('bookings')
@Unique(['lobbyId'])
export class Booking {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() lobbyId!: string;
  @Column() fieldSlotId!: string;
  @ManyToOne(() => Lobby) @JoinColumn({ name: 'lobbyId' }) lobby!: Lobby;
  @ManyToOne(() => FieldSlot) @JoinColumn({ name: 'fieldSlotId' }) fieldSlot!: FieldSlot;
  @Column({ type: 'varchar', default: 'confirmed' }) status!: BookingStatus;
  @Column({ type: 'timestamptz' }) confirmedAt!: Date;
}
