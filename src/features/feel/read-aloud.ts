import * as Speech from 'expo-speech';

import type { AppLocale } from '../../lib/locale';

const speechLanguage: Record<AppLocale, string> = { en: 'en-US', ru: 'ru-RU', uk: 'uk-UA' };

/** Reads the question and its options aloud; a second press stops it. */
export async function toggleReadAloud(text: string, locale: AppLocale) {
  if (await Speech.isSpeakingAsync()) {
    Speech.stop();
    return false;
  }

  Speech.speak(text, { language: speechLanguage[locale], rate: 0.95 });
  return true;
}

export function stopReadAloud() {
  Speech.stop();
}
