import { useEffect } from 'react';
import { AppState } from 'react-native';

import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../state/app-store';
import { supabaseProgressRemote, syncProgressWith } from './cloud-sync';

let running: Promise<void> | null = null;

/** One sync at a time; failures (offline, no session yet) wait for the next trigger. */
export function syncProgressNow() {
  running ??= (async () => {
    try {
      const session = supabase ? (await supabase.auth.getSession()).data.session : null;
      const remote = session && supabase ? supabaseProgressRemote(supabase, session.user.id) : null;

      if (!remote) {
        return;
      }

      const merged = await syncProgressWith(remote, useAppStore.getState().progress);

      useAppStore.getState().mergeRemoteProgress(merged);
    } catch {
      // Offline-first: the device copy stays authoritative until the next successful sync.
    } finally {
      running = null;
    }
  })();

  return running;
}

/** Keeps the cloud copy in step: on start, after progress changes, and when the app returns. */
export function useProgressSync() {
  const enabled = useAppStore((state) => state.hasHydrated && Boolean(state.profile)) && Boolean(supabase);
  const updatedAt = useAppStore((state) => state.progress.updatedAt);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const timer = setTimeout(() => void syncProgressNow(), 1500);

    return () => clearTimeout(timer);
  }, [enabled, updatedAt]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void syncProgressNow();
      }
    });

    return () => subscription.remove();
  }, [enabled]);
}
