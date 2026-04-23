import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, CreateDateColumn } from 'typeorm';
import { Booking } from '../bookings/booking.entity';
import { User } from '../users/user.entity';

@Entity('reviews')
@Unique(['bookingId', 'authorId'])
export class Review {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() bookingId!: string;
  @Column() authorId!: string;
  @ManyToOne(() => Booking) @JoinColumn({ name: 'bookingId' }) booking!: Booking;
  @ManyToOne(() => User) @JoinColumn({ name: 'authorId' }) author!: User;
  @Column({ type: 'smallint' }) fieldRating!: number;
  @Column({ type: 'smallint' }) matchRating!: number;
  @Column({ nullable: true }) comment!: string | null;
  @CreateDateColumn() createdAt!: Date;
}
