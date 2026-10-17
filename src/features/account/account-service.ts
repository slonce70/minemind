import { Platform, Share } from 'react-native';

import type { QuestionReportReason } from '../../../supabase/functions/_shared/question-reports';
import { invokeSupabaseFunction, isSupabaseConfigured, supabase } from '../../lib/supabase';
import type { AppLocale } from '../../lib/locale';
import { useAppStore } from '../../state/app-store';

/** Whether this device has a server account (offline builds and fresh installs do not). */
async function hasServerAccount() {
  return Boolean(isSupabaseConfigured && (await supabase?.auth.getSession())?.data.session);
}

/**
 * The player's own data as one JSON document: what the server holds (export-my-data) plus what
 * lives only on this device. Offline builds have only the device part.
 */
export async function collectMyData() {
  const { profile, progress, recentMatches, settings } = useAppStore.getState();
  const device = { profile, progress, recentMatches, settings };
  const server = (await hasServerAccount()) ? await invokeSupabaseFunction<Record<string, unknown>, Record<string, never>>('export-my-data', {}) : null;

  return JSON.stringify({ app: 'MineMind', device, exportedAt: new Date().toISOString(), server }, null, 2);
}

/** Saves the export as a file on the web, or hands it to the share sheet on phones. */
export async function deliverMyData(json: string) {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'minemind-my-data.json';
    link.click();
    URL.revokeObjectURL(url);
    return;
  }

  await Share.share({ message: json, title: 'minemind-my-data.json' });
}

/** Deletes the account on the server (everything cascades), then this device's copy. */
export async function deleteMyAccount() {
  if (await hasServerAccount()) {
    await invokeSupabaseFunction('delete-account', { confirm: 'delete-everything' });
    // The session belonged to the deleted user; drop it so a fresh guest starts next time.
    await supabase?.auth.signOut({ scope: 'local' }).catch(() => undefined);
  }

  useAppStore.getState().resetProfile();
}

export const canReportQuestions = isSupabaseConfigured;

export async function reportQuestion(input: { locale: AppLocale; questionId: string; reason: QuestionReportReason }) {
  await invokeSupabaseFunction('report-question', input);
}
