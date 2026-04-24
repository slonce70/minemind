import type { MatchRecord } from './match-record';

export function getMatchSourceTranslationKey(record: MatchRecord) {
  if (record.transport === 'supabase') {
    return 'results.sourceValues.online';
  }

  if (record.transport === 'lan-host') {
    return 'results.sourceValues.classroom';
  }

  if (record.transport === 'bluetooth-peer') {
    return 'results.sourceValues.nearby';
  }

  if (record.syncStatus === 'recovered') {
    return 'results.sourceValues.recovered';
  }

  if (record.isDemo) {
    return 'results.sourceValues.demo';
  }

  return 'results.sourceValues.local';
}
