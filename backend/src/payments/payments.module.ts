import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './payment.entity';
import { Lobby } from '../lobbies/lobby.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { RahmatProvider } from './providers/rahmat.provider';
import { PAYMENT_PROVIDER } from './providers/payment-provider.interface';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Lobby]),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    { provide: PAYMENT_PROVIDER, useClass: RahmatProvider },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
