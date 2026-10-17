import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { supabase } from '../../lib/supabase';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string) {
  return emailPattern.test(value.trim());
}

/** Where magic links send the player back: the app's /auth screen. */
export function authRedirectUrl() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/auth`;
  }

  return Linking.createURL('/auth');
}

export type AccountState = { email?: string; isAnonymous: boolean; signedIn: boolean };

export async function readAccountState(): Promise<AccountState> {
  const user = supabase ? (await supabase.auth.getSession()).data.session?.user : undefined;

  return { email: user?.email ?? undefined, isAnonymous: user?.is_anonymous ?? true, signedIn: Boolean(user) };
}

/**
 * Turns the anonymous guest into a permanent account: Supabase emails a confirmation link, and
 * the same user id (and its cloud progress) then belongs to that email.
 */
export async function linkEmail(email: string) {
  if (!supabase) {
    throw new Error('offline');
  }

  const { data, error } = await supabase.auth.updateUser({ email: email.trim() }, { emailRedirectTo: authRedirectUrl() });

  if (error) {
    throw error;
  }

  // Without email confirmations (local stack) the email is set at once; otherwise a link is sent.
  return { confirmed: data.user?.email?.toLowerCase() === email.trim().toLowerCase() };
}

/** Emails a sign-in link for an account linked earlier (no new accounts are created here). */
export async function sendRestoreLink(email: string): Promise<{ confirmed: boolean }> {
  if (!supabase) {
    throw new Error('offline');
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: authRedirectUrl(), shouldCreateUser: false },
  });

  if (error) {
    throw error;
  }

  return { confirmed: false };
}

/** Reads the session a magic link carries (`#access_token=…&refresh_token=…`) and signs in. */
export async function completeSignInFromUrl(url: string) {
  if (!supabase) {
    throw new Error('offline');
  }

  const fragment = url.includes('#') ? url.slice(url.indexOf('#') + 1) : (url.split('?')[1] ?? '');
  const params = new URLSearchParams(fragment);
  const failure = params.get('error_description') ?? params.get('error');

  if (failure) {
    throw new Error(failure);
  }

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (!accessToken || !refreshToken) {
    return false;
  }

  const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });

  if (error) {
    throw error;
  }

  return true;
}
