import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('fields')
export class Field {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() ownerId!: string;
  @ManyToOne(() => User) @JoinColumn({ name: 'ownerId' }) owner!: User;
  @Column() name!: string;
  @Column() address!: string;
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true }) lat!: number;
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true }) lng!: number;
  @Column({ type: 'int' }) pricePerHour!: number;
  @Column({ type: 'int', default: 60 }) slotDuration!: number;
  @Column({ type: 'jsonb', default: {} }) amenities!: Record<string, boolean>;
  @Column({ type: 'text', array: true, default: [] }) photos!: string[];
  @Column({ nullable: true }) description!: string;
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 }) rating!: number;
  @CreateDateColumn() createdAt!: Date;
}
