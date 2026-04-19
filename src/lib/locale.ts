import { getLocales } from 'expo-localization';

export const appLocales = ['uk', 'en', 'ru'] as const;
export const defaultAppLocale = 'uk' as const;

export type AppLocale = (typeof appLocales)[number];

export function normalizeLocale(input?: string | null): AppLocale {
  const value = input?.toLowerCase() ?? '';

  if (value.startsWith('uk')) {
    return 'uk';
  }

  if (value.startsWith('ru')) {
    return 'ru';
  }

  return defaultAppLocale;
}

export function getDeviceLocale() {
  const locale = getLocales()[0];

  return normalizeLocale(locale?.languageTag ?? locale?.languageCode);
}
