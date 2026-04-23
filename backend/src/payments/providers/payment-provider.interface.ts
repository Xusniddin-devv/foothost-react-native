export interface InitiateParams {
  amount: number;
  userId: string;
  lobbyId: string;
  paymentId: string;
}

export interface InitiateResult {
  providerRef: string;
  redirectUrl: string;
}

export interface WebhookResult {
  providerRef: string;
  status: 'success' | 'failure';
}

export interface PaymentProvider {
  initiate(params: InitiateParams): Promise<InitiateResult>;
  verify(payload: unknown): Promise<WebhookResult>;
  refund(providerRef: string, amount: number): Promise<void>;
}

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');
