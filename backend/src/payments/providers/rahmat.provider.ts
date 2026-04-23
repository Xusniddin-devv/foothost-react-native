import { Injectable, Logger } from '@nestjs/common';
import {
  PaymentProvider,
  InitiateParams,
  InitiateResult,
  WebhookResult,
} from './payment-provider.interface';

@Injectable()
export class RahmatProvider implements PaymentProvider {
  private readonly logger = new Logger(RahmatProvider.name);

  async initiate(params: InitiateParams): Promise<InitiateResult> {
    // TODO: replace with real Rahmat API call when credentials are available.
    return {
      providerRef: `rahmat_stub_${params.paymentId}`,
      redirectUrl: `https://rahmat.uz/pay?ref=${params.paymentId}&amount=${params.amount}`,
    };
  }

  async verify(payload: unknown): Promise<WebhookResult> {
    // TODO: validate Rahmat signature header once real integration is wired up.
    const body = (payload ?? {}) as {
      transaction_id?: string;
      status?: string;
    };
    return {
      providerRef: body.transaction_id ?? '',
      status: body.status === 'paid' ? 'success' : 'failure',
    };
  }

  async refund(providerRef: string, amount: number): Promise<void> {
    // TODO: call Rahmat refund API.
    this.logger.log(`Refund stub: ${providerRef} amount=${amount}`);
  }
}
