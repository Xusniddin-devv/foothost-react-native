import { ForbiddenException } from '@nestjs/common';

/**
 * Service-level helper: throws ForbiddenException when the user is not the
 * creator of the given lobby. Intended to be called from inside services
 * rather than applied as a NestJS guard.
 */
export function assertIsCreator(
  lobby: { creatorId: string },
  userId: string,
): void {
  if (lobby.creatorId !== userId) {
    throw new ForbiddenException('Not the lobby creator');
  }
}
