import i18n from '../../i18n';

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
  if (error instanceof Error) {
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
