import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { VerifiedGuard } from '../common/guards/verified.guard';
import { WebhookSecretGuard } from '../common/guards/webhook-secret.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { JwtPayload } from '../auth/jwt.strategy';

@Controller('payments')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Get(':lobbyId')
  @UseGuards(JwtAuthGuard)
  getStatus(@Param('lobbyId') lobbyId: string) {
    return this.payments.getLobbyPayments(lobbyId);
  }

  @Post(':lobbyId/initiate')
  @UseGuards(JwtAuthGuard, VerifiedGuard)
  initiate(
    @Param('lobbyId') lobbyId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.payments.initiate(lobbyId, user.sub);
  }

  @Post('webhook/:provider')
  @HttpCode(200)
  @UseGuards(WebhookSecretGuard)
  async webhook(
    @Param('provider') provider: string,
    @Body() body: unknown,
  ): Promise<{ received: true }> {
    await this.payments.handleWebhook(provider, body);
    return { received: true };
  }
}
