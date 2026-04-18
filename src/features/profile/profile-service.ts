import { invokeSupabaseFunction, supabase } from '../../lib/supabase';
import type { GuestProfile } from '../../state/app-store';
import { toPlayerSafeErrorMessage } from '../shared/app-copy';

export async function ensureGuestSession(profile: GuestProfile) {
  if (!supabase) {
    return { mode: 'offline' as const };
  }

  const currentUser = (await supabase.auth.getUser()).data.user;
  const user = currentUser ?? (await supabase.auth.signInAnonymously()).data.user;

  if (!user) {
    throw new Error('Unable to create anonymous session.');
  }

  try {
    await invokeSupabaseFunction<{ profileId: string }, GuestProfile>('sync-profile', profile);
  } catch (error) {
    throw new Error(toPlayerSafeErrorMessage(error));
  }

  return { mode: 'supabase' as const, userId: user.id };
}
