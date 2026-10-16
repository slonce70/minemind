// Error reporting to Sentry (or any Sentry-compatible service) over its plain HTTP envelope API.
// Off unless EXPO_PUBLIC_SENTRY_DSN is set, so local builds, tests and forks never send anything.
// No PII: players are anonymous kids, events carry only the error, platform and context.
// ponytail: JS errors only, no native crashes or source maps; switch to @sentry/react-native
// once release builds go through EAS and need those.

const maxReportsPerSession = 20;

let reportsSent = 0;

type ParsedDsn = { endpoint: string; publicKey: string };

export function parseSentryDsn(dsn: string | undefined): ParsedDsn | null {
  const match = dsn?.trim().match(/^(https?):\/\/([^@/]+)@([^/]+)\/(?:(.+)\/)?(\d+)$/);

  if (!match) {
    return null;
  }

  const [, protocol, publicKey, host, pathPrefix, projectId] = match;
  const prefix = pathPrefix ? `/${pathPrefix}` : '';

  return {
    endpoint: `${protocol}://${host}${prefix}/api/${projectId}/envelope/?sentry_key=${publicKey}&sentry_version=7`,
    publicKey,
  };
}

function randomEventId() {
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export function buildSentryEnvelope(input: {
  context?: Record<string, unknown>;
  environment: string;
  error: unknown;
  now: Date;
  platform: string;
}) {
  const error = input.error instanceof Error ? input.error : new Error(String(input.error));
  const eventId = randomEventId();
  const event = {
    environment: input.environment,
    event_id: eventId,
    exception: { values: [{ type: error.name, value: error.message }] },
    extra: { ...input.context, stack: error.stack },
    level: 'error',
    platform: 'javascript',
    tags: { platform: input.platform },
    timestamp: input.now.getTime() / 1000,
  };

  return [
    JSON.stringify({ event_id: eventId, sent_at: input.now.toISOString() }),
    JSON.stringify({ type: 'event' }),
    JSON.stringify(event),
  ].join('\n');
}

const dsn = parseSentryDsn(process.env.EXPO_PUBLIC_SENTRY_DSN);

export const isMonitoringEnabled = dsn !== null;

function environment() {
  return (globalThis as { __DEV__?: boolean }).__DEV__ ? 'development' : 'production';
}

function platform() {
  return 'document' in globalThis ? 'web' : 'native';
}

export function reportError(error: unknown, context?: Record<string, unknown>) {
  if (!dsn || reportsSent >= maxReportsPerSession) {
    return;
  }

  reportsSent += 1;
  void fetch(dsn.endpoint, {
    body: buildSentryEnvelope({ context, environment: environment(), error, now: new Date(), platform: platform() }),
    headers: { 'Content-Type': 'application/x-sentry-envelope' },
    method: 'POST',
  }).catch(() => undefined);
}

type ErrorHandler = (error: unknown, isFatal?: boolean) => void;
type ErrorUtilsLike = { getGlobalHandler: () => ErrorHandler; setGlobalHandler: (handler: ErrorHandler) => void };

/** Reports uncaught errors; the platform's own handling (red box, crash) still runs. */
export function initMonitoring() {
  if (!dsn) {
    return;
  }

  const errorUtils = (globalThis as { ErrorUtils?: ErrorUtilsLike }).ErrorUtils;

  if (errorUtils) {
    const previousHandler = errorUtils.getGlobalHandler();
    errorUtils.setGlobalHandler((error, isFatal) => {
      reportError(error, { isFatal });
      previousHandler(error, isFatal);
    });
  }

  // Web build: the browser's own error events.
  const browser = globalThis as {
    addEventListener?: (type: string, listener: (event: { error?: unknown; message?: string; reason?: unknown }) => void) => void;
  };

  if ('document' in globalThis && browser.addEventListener) {
    browser.addEventListener('error', (event) => reportError(event.error ?? event.message));
    browser.addEventListener('unhandledrejection', (event) => reportError(event.reason));
  }
}
