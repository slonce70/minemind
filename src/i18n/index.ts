import i18n, { type Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { appLocales, defaultAppLocale, type AppLocale } from '../lib/locale';
import { playerErrorResources } from './player-error-resources';
import { resources } from './resources';

const localizedResources = Object.fromEntries(
  appLocales.map((locale) => [
    locale,
    {
      translation: {
        ...resources[locale].translation,
        errors: {
          ...resources[locale].translation.errors,
          player: playerErrorResources[locale],
        },
      },
    },
  ])
) as Resource;

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    compatibilityJSON: 'v4',
    fallbackLng: 'uk',
    interpolation: {
      escapeValue: false,
    },
    lng: defaultAppLocale,
    resources: localizedResources,
  });
}

export async function setI18nLanguage(locale: AppLocale) {
  if (i18n.language !== locale) {
    await i18n.changeLanguage(locale);
  }
}

export default i18n;
