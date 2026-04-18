import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

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
    throw error;
  }

  return data as TResponse;
}
