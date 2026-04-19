import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { defaultAppLocale, type AppLocale } from '../lib/locale';
import { resources } from './resources';

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    compatibilityJSON: 'v4',
    fallbackLng: 'uk',
    interpolation: {
      escapeValue: false,
    },
    lng: defaultAppLocale,
    resources,
  });
}

export async function setI18nLanguage(locale: AppLocale) {
  if (i18n.language !== locale) {
    await i18n.changeLanguage(locale);
  }
}

export default i18n;
