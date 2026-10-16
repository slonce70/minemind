import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type LocalStack = { anonKey: string; serviceRoleKey: string; url: string };

/** Credentials of the LOCAL stack (`supabase start`); refuses anything that is not localhost. */
export function localStack(): LocalStack {
  let stack: LocalStack = {
    anonKey: process.env.E2E_SUPABASE_ANON_KEY ?? '',
    serviceRoleKey: process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ?? '',
    url: process.env.E2E_SUPABASE_URL ?? '',
  };

  if (!stack.url) {
    const status = JSON.parse(execSync('npx -y supabase@2 status -o json', { encoding: 'utf8' })) as Record<string, string>;
    stack = { anonKey: status.ANON_KEY, serviceRoleKey: status.SERVICE_ROLE_KEY, url: status.API_URL };
  }

  assert.match(new URL(stack.url).hostname, /^(127\.0\.0\.1|localhost)$/, 'e2e tests only run against a local Supabase');

  return stack;
}

export type ApiResult = { body: Record<string, any>; status: number };

export type TestPlayer = {
  call: (functionName: string, body: Record<string, unknown>) => Promise<ApiResult>;
  client: SupabaseClient;
  id: string;
  token: string;
};

export function adminClient(stack: LocalStack) {
  return createClient(stack.url, stack.serviceRoleKey, { auth: { persistSession: false } });
}

export async function createPlayer(
  stack: LocalStack,
  nickname: string,
  locale: 'en' | 'ru' | 'uk' = 'uk'
): Promise<TestPlayer> {
  const client = createClient(stack.url, stack.anonKey, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signInAnonymously();

  if (error || !data.session || !data.user) {
    throw error ?? new Error('Anonymous sign-in failed.');
  }

  const token = data.session.access_token;
  const call = async (functionName: string, body: Record<string, unknown>) => {
    const response = await fetch(`${stack.url}/functions/v1/${functionName}`, {
      body: JSON.stringify(body),
      headers: { apikey: stack.anonKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      method: 'POST',
    });

    return { body: (await response.json()) as Record<string, any>, status: response.status };
  };
  const synced = await call('sync-profile', { avatarId: 'fox', locale, nickname });
  assert.equal(synced.status, 200, JSON.stringify(synced.body));

  return { call, client, id: data.user.id, token };
}
