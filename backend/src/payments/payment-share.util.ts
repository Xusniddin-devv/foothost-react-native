export interface ShareParams {
  totalAmount: number;
  confirmedTotal: number;
  maxPlayers: number;
  confirmedCount: number;
}

/**
 * Calculates the next payer's share given the lobby total, amount already
 * confirmed, total player count, and number of confirmed payers. Uses Math.ceil
 * to avoid fractional soums and handles overpay (extra collected from earlier
 * payers is subtracted from the remaining pool).
 */
export function calculateShare({
  totalAmount,
  confirmedTotal,
  maxPlayers,
  confirmedCount,
}: ShareParams): number {
  const remaining = totalAmount - confirmedTotal;
  if (remaining <= 0) return 0;
  const unpaidCount = maxPlayers - confirmedCount;
  if (unpaidCount <= 0) return 0;
  return Math.ceil(remaining / unpaidCount);
}
