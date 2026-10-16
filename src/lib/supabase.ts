import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import { GameError, isApiErrorCode } from '../../supabase/functions/_shared/error-codes';
import { reportError } from './monitoring';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: false,
        persistSession: true,
        storage: AsyncStorage,
      },
    })
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  return supabase;
}

export async function getAuthenticatedUser() {
  const client = requireSupabase();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) {
    throw error ?? new Error('User is not authenticated.');
  }

  return user;
}

export async function invokeSupabaseFunction<
  TResponse,
  TPayload extends string | Record<string, unknown> | undefined = undefined,
>(
  functionName: string,
  payload?: TPayload
) {
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke(functionName, {
    body: payload,
  });

  if (error) {
    const gameError = await toGameError(error);

    // Expected game outcomes (room full, round over...) are not bugs; everything else is.
    if (!(gameError instanceof GameError) || gameError.code === 'server_error') {
      reportError(gameError, { functionName });
    }

    throw gameError;
  }

  return data as TResponse;
}

/** Non-2xx function responses carry `{ code, error }`; keep the code so the UI can translate it. */
async function toGameError(error: unknown) {
  const context = (error as { context?: { clone?: () => { json: () => Promise<unknown> } } }).context;

  try {
    const body = (await context?.clone?.().json()) as { code?: unknown; error?: unknown } | undefined;

    if (isApiErrorCode(body?.code)) {
      return new GameError(body.code, typeof body.error === 'string' ? body.error : body.code);
    }
  } catch {
    // Not a JSON body (relay or network failure): keep the original error.
  }

  return error;
}
