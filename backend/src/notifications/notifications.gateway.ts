import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN ?? '*' },
  namespace: '/lobbies',
})
export class NotificationsGateway implements OnGatewayConnection {
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer() server!: Server;

  constructor(private jwtService: JwtService) {}

  handleConnection(client: Socket): void {
    try {
      const token = (client.handshake.auth?.token ??
        client.handshake.query?.token) as string | undefined;
      if (!token) {
        client.disconnect();
        return;
      }
      this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET ?? 'fallback_secret',
      });
    } catch (err) {
      this.logger.warn(`Rejected socket: ${(err as Error).message}`);
      client.disconnect();
    }
  }

  @SubscribeMessage('lobby:join_room')
  joinRoom(
    @MessageBody() data: { lobbyId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    client.join(`lobby:${data.lobbyId}`);
  }

  @SubscribeMessage('lobby:leave_room')
  leaveRoom(
    @MessageBody() data: { lobbyId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    client.leave(`lobby:${data.lobbyId}`);
  }

  emitToLobby(lobbyId: string, event: string, payload: unknown): void {
    this.server?.to(`lobby:${lobbyId}`).emit(event, payload);
  }
}
