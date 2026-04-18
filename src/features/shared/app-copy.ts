export const defaultPlayerErrorMessages = {
  generic: 'Something went wrong. Please try again.',
  network: 'Connection problem. Please try again.',
  session: 'Your session expired. Please try again.',
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
