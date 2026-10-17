import { Platform, Share } from 'react-native';

import { requestParentalGate } from '../parental/parental-gate';
import { buildChallengeUrl, type ChallengeSpec } from './solo-round-builder';

/**
 * Where challenge links point: the hosted web app when EXPO_PUBLIC_WEB_URL is set (opens for
 * anyone), the current site on web, else the app scheme.
 */
export function challengeLinkBase() {
  const configured = process.env.EXPO_PUBLIC_WEB_URL?.trim();

  if (configured) {
    return configured;
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'minemind://';
}

/**
 * After the parental gate, opens the share sheet; on web without one, copies the link. Returns
 * 'copied' when it did, 'cancelled' when no adult got through the gate.
 */
export async function shareChallenge(challenge: ChallengeSpec, message: (url: string) => string) {
  const url = buildChallengeUrl(challengeLinkBase(), challenge);

  if (!(await requestParentalGate())) {
    return { result: 'cancelled' as const, url };
  }

  if (Platform.OS === 'web') {
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;

    if (nav?.share) {
      await nav.share({ text: message(url), url }).catch(() => undefined);
      return { result: 'shared' as const, url };
    }

    await nav?.clipboard?.writeText(url).catch(() => undefined);
    return { result: 'copied' as const, url };
  }

  await Share.share({ message: message(url) });
  return { result: 'shared' as const, url };
}
