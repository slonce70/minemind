import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { normalizeLocale, type AppLocale } from '../lib/locale';
import { resources } from './resources';

const deviceLocale = normalizeLocale(getLocales()[0]?.languageTag);

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    compatibilityJSON: 'v4',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    lng: deviceLocale,
    resources,
  });
}

export async function setI18nLanguage(locale: AppLocale) {
  if (i18n.language !== locale) {
    await i18n.changeLanguage(locale);
  }
}

export default i18n;
