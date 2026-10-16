import { serviceClient } from './client.ts';
import { GameError } from './error-codes.ts';

export const rateLimits = {
  'create-room': { maxHits: 5, windowSeconds: 10 * 60 },
  'join-room': { maxHits: 20, windowSeconds: 60 },
} as const;

export async function enforceRateLimit(playerId: string, action: keyof typeof rateLimits) {
  const limit = rateLimits[action];
  const { data: allowed, error } = await serviceClient.rpc('consume_rate_limit', {
    max_hits: limit.maxHits,
    target_action: action,
    target_player_id: playerId,
    window_size: `${limit.windowSeconds} seconds`,
  });

  if (error) {
    throw error;
  }

  if (!allowed) {
    throw new GameError('rate_limited', `Too many ${action} requests.`);
  }
}

/** Best effort: closes rooms idle for 2 hours (pg_cron does the same every 15 minutes). */
export async function closeAbandonedRooms() {
  const { error } = await serviceClient.rpc('close_abandoned_rooms');

  if (error) {
    console.error(error);
  }
}
