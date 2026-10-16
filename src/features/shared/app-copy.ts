import i18n from 'i18next';

import { isApiErrorCode } from '../../../supabase/functions/_shared/error-codes';

const playerErrorTranslationKeys = {
  generic: 'errors.player.generic',
  network: 'errors.player.network',
  session: 'errors.player.session',
} as const;

export const defaultPlayerErrorMessages = {
  get generic() {
    return i18n.t(playerErrorTranslationKeys.generic);
  },
  get network() {
    return i18n.t(playerErrorTranslationKeys.network);
  },
  get session() {
    return i18n.t(playerErrorTranslationKeys.session);
  },
} as const;

export function toPlayerSafeErrorMessage(
  error: unknown,
  fallback = defaultPlayerErrorMessages.generic
) {
  const code = (error as { code?: unknown } | null)?.code;

  if (isApiErrorCode(code)) {
    return i18n.t(`errors.codes.${code}`);
  }

  if (error instanceof Error) {
    // supabase-js: the request never reached the function (offline, DNS, relay down).
    if (error.name === 'FunctionsFetchError' || error.name === 'FunctionsRelayError') {
      return defaultPlayerErrorMessages.network;
    }

    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return defaultPlayerErrorMessages.network;
    }

    if (message.includes('session') || message.includes('auth')) {
      return defaultPlayerErrorMessages.session;
    }
  }

  return fallback;
}
