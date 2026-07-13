import type { AppLocale } from '../lib/locale';

type PlayerErrorMessages = {
  generic: string;
  network: string;
  session: string;
};

export const playerErrorResources = {
  uk: {
    generic: 'Щось пішло не так. Спробуй ще раз.',
    network: 'Проблема зі з’єднанням. Спробуй ще раз.',
    session: 'Термін дії сесії минув. Спробуй ще раз.',
  },
  en: {
    generic: 'Something went wrong. Please try again.',
    network: 'Connection problem. Please try again.',
    session: 'Your session expired. Please try again.',
  },
  ru: {
    generic: 'Что-то пошло не так. Попробуй еще раз.',
    network: 'Проблема с подключением. Попробуй еще раз.',
    session: 'Срок действия сессии истек. Попробуй еще раз.',
  },
} as const satisfies Record<AppLocale, PlayerErrorMessages>;
