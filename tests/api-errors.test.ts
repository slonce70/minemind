import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

import i18n from 'i18next';

import { apiErrorCodes, GameError } from '../supabase/functions/_shared/error-codes.ts';
import { errorResponse } from '../supabase/functions/_shared/http.ts';
import { toPlayerSafeErrorMessage } from '../src/features/shared/app-copy';
import { buildSentryEnvelope, isMonitoringEnabled, parseSentryDsn } from '../src/lib/monitoring';
import { apiErrorResources, playerErrorResources } from '../src/i18n/player-error-resources';

test('edge functions answer with a code and an HTTP status, hiding unexpected details', async () => {
  const expected = errorResponse(new GameError('room_full', 'Room is full.'));
  assert.equal(expected.status, 409);
  assert.deepEqual(await expected.json(), { code: 'room_full', error: 'Room is full.' });

  const originalConsoleError = console.error;
  console.error = () => undefined;
  const unexpected = errorResponse(new Error('duplicate key value violates unique constraint "rooms_pkey"'));
  console.error = originalConsoleError;

  assert.equal(unexpected.status, 500);
  assert.deepEqual(await unexpected.json(), { code: 'server_error', error: 'Internal error.' });
});

test('every edge function reports failures through errorResponse', () => {
  const functionsDir = new URL('../supabase/functions/', import.meta.url);

  for (const entry of readdirSync(functionsDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) {
      continue;
    }

    const source = readFileSync(new URL(`${entry.name}/index.ts`, functionsDir), 'utf8');
    assert.match(source, /return errorResponse\(error\);/, entry.name);
    assert.doesNotMatch(source, /error instanceof Error \? error\.message/, entry.name);
  }
});

test('every error code is translated and shown in the player language', async () => {
  for (const locale of ['uk', 'en', 'ru'] as const) {
    assert.deepEqual(Object.keys(apiErrorResources[locale]).sort(), [...apiErrorCodes].sort(), locale);
  }

  await i18n.init({
    fallbackLng: 'uk',
    lng: 'uk',
    resources: Object.fromEntries(
      (['uk', 'en', 'ru'] as const).map((locale) => [
        locale,
        { translation: { errors: { codes: apiErrorResources[locale], player: playerErrorResources[locale] } } },
      ])
    ),
  });

  for (const locale of ['uk', 'en', 'ru'] as const) {
    await i18n.changeLanguage(locale);
    assert.equal(toPlayerSafeErrorMessage(new GameError('room_full')), apiErrorResources[locale].room_full);
    assert.equal(
      toPlayerSafeErrorMessage(Object.assign(new Error('Failed to send a request'), { name: 'FunctionsFetchError' })),
      playerErrorResources[locale].network
    );
  }
});

test('error reporting is off without a DSN and targets the Sentry envelope API with one', () => {
  assert.equal(isMonitoringEnabled, false);
  assert.equal(parseSentryDsn(undefined), null);
  assert.equal(parseSentryDsn('not a dsn'), null);
  assert.deepEqual(parseSentryDsn('https://abc123@o42.ingest.sentry.io/4507'), {
    endpoint: 'https://o42.ingest.sentry.io/api/4507/envelope/?sentry_key=abc123&sentry_version=7',
    publicKey: 'abc123',
  });

  const [header, itemHeader, event] = buildSentryEnvelope({
    context: { functionName: 'join-room' },
    environment: 'production',
    error: new GameError('server_error', 'boom'),
    now: new Date('2026-10-17T10:00:00Z'),
    platform: 'native',
  })
    .split('\n')
    .map((line) => JSON.parse(line));

  assert.equal(itemHeader.type, 'event');
  assert.equal(event.event_id, header.event_id);
  assert.deepEqual(event.exception.values, [{ type: 'GameError', value: 'boom' }]);
  assert.equal(event.extra.functionName, 'join-room');
});
