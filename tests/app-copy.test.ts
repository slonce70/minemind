import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  defaultPlayerErrorMessages,
  toPlayerSafeErrorMessage,
} from '../src/features/shared/app-copy';
import i18n from '../src/i18n';
import { playerErrorResources } from '../src/i18n/player-error-resources';
import {
  appLocales,
  defaultAppLocale,
  type AppLocale,
} from '../src/lib/locale';

const expectedPlayerErrorMessages = {
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
} as const;

test('player-safe error copy follows every supported locale', async () => {
  const appCopySource = readFileSync(
    new URL('../src/features/shared/app-copy.ts', import.meta.url),
    'utf8'
  );
  const originalLocale = appLocales.includes(i18n.language as AppLocale)
    ? (i18n.language as AppLocale)
    : defaultAppLocale;

  assert.deepEqual(Object.keys(playerErrorResources).sort(), [...appLocales].sort());
  assert.deepEqual(playerErrorResources, expectedPlayerErrorMessages);
  assert.doesNotMatch(
    appCopySource,
    /Something went wrong|Connection problem|Your session expired/
  );

  try {
    for (const locale of appLocales) {
      await i18n.changeLanguage(locale);
      const expected = expectedPlayerErrorMessages[locale];

      assert.equal(i18n.t('errors.player.generic'), expected.generic);
      assert.equal(i18n.t('errors.player.network'), expected.network);
      assert.equal(i18n.t('errors.player.session'), expected.session);
      assert.equal(defaultPlayerErrorMessages.generic, expected.generic);
      assert.equal(defaultPlayerErrorMessages.network, expected.network);
      assert.equal(defaultPlayerErrorMessages.session, expected.session);
      assert.equal(
        toPlayerSafeErrorMessage(new Error('Failed to fetch room state')),
        expected.network
      );
      assert.equal(
        toPlayerSafeErrorMessage(new Error('Auth session expired')),
        expected.session
      );
      assert.equal(
        toPlayerSafeErrorMessage(new Error('Unexpected backend detail')),
        expected.generic
      );
      assert.equal(toPlayerSafeErrorMessage(null), expected.generic);
      assert.equal(
        toPlayerSafeErrorMessage(
          new Error('Unexpected backend detail'),
          'Caller fallback'
        ),
        'Caller fallback'
      );
    }
  } finally {
    await i18n.changeLanguage(originalLocale);
  }
});
