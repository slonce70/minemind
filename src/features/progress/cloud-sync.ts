import type { SupabaseClient } from '@supabase/supabase-js';

import { mergeProgress, sanitizeProgress, type PlayerProgress } from './progression';

/** The cloud copy as stored: the progress and its version stamp for compare-and-swap. */
export type RemoteProgress = { progress: unknown; updated_at: string };

/** Storage the sync talks to: the player_progress row of the signed-in player. */
export type ProgressRemote = {
  fetch: () => Promise<RemoteProgress | null>;
  /** False when another device wrote first (the row exists). */
  insert: (progress: PlayerProgress) => Promise<boolean>;
  /** False when the row changed since `version` was read. */
  update: (progress: PlayerProgress, version: string) => Promise<boolean>;
};

function stable(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stable).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .filter((key) => (value as Record<string, unknown>)[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stable((value as Record<string, unknown>)[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

/**
 * Merges the device's progress with the cloud copy and writes the result back. A write that loses
 * a race with another device re-reads and merges again, so neither device's progress is lost.
 * Returns the merged progress to keep on the device.
 */
export async function syncProgressWith(remote: ProgressRemote, local: PlayerProgress, attempts = 3): Promise<PlayerProgress> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const row = await remote.fetch();

    if (!row) {
      if (await remote.insert(local)) {
        return local;
      }

      continue;
    }

    const cloud = sanitizeProgress(row.progress);
    const merged = mergeProgress(local, cloud);

    if (stable(merged) === stable(cloud) || (await remote.update(merged, row.updated_at))) {
      return merged;
    }
  }

  throw new Error('Progress kept changing on another device; will sync later.');
}

/** The player_progress row of `userId` (RLS lets players touch only their own). */
export function supabaseProgressRemote(client: SupabaseClient, userId: string): ProgressRemote {
  const table = () => client.from('player_progress');

  return {
    fetch: async () => {
      const { data, error } = await table().select('progress, updated_at').eq('user_id', userId).maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
    insert: async (progress) => {
      const { error } = await table().insert({ progress, user_id: userId, xp: progress.xp });

      if (error?.code === '23505') {
        return false;
      }

      if (error) {
        throw error;
      }

      return true;
    },
    update: async (progress, version) => {
      const { data, error } = await table()
        .update({ progress, xp: progress.xp })
        .eq('user_id', userId)
        .eq('updated_at', version)
        .select('user_id');

      if (error) {
        throw error;
      }

      return (data ?? []).length > 0;
    },
  };
}
