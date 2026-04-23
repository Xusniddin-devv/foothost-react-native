import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('otp_codes')
export class OtpCode {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() phone!: string;
  @Column() code!: string;
  @Column() expiresAt!: Date;
  @Column({ default: false }) used!: boolean;
}
