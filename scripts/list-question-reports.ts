// Questions players reported as wrong, most reported first (read-only).
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/list-question-reports.ts [--days 30]
// Fix a confirmed mistake in the master bank, re-check it (scripts/audit-game-version.ts --confirm)
// and ship it with npm run export:content plus an OTA update.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createClient } from '@supabase/supabase-js';

import type { MasterQuestionRecord } from '../src/features/content/master-types';

type ReportRow = { content_id: string; created_at: string; locale: string; reason: string };

export function summarizeReports(rows: ReportRow[]) {
  const byQuestion = new Map<string, { locales: Set<string>; reasons: Record<string, number>; total: number }>();

  for (const row of rows) {
    const entry = byQuestion.get(row.content_id) ?? { locales: new Set<string>(), reasons: {}, total: 0 };
    entry.total += 1;
    entry.locales.add(row.locale);
    entry.reasons[row.reason] = (entry.reasons[row.reason] ?? 0) + 1;
    byQuestion.set(row.content_id, entry);
  }

  return [...byQuestion.entries()]
    .map(([contentId, entry]) => ({ contentId, locales: [...entry.locales].sort(), reasons: entry.reasons, total: entry.total }))
    .sort((left, right) => right.total - left.total || left.contentId.localeCompare(right.contentId));
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (never commit the key).');
    process.exit(2);
  }

  const daysIndex = process.argv.indexOf('--days');
  const days = daysIndex >= 0 ? Number(process.argv[daysIndex + 1]) : 30;
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const client = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await client
    .from('question_reports')
    .select('content_id, created_at, locale, reason')
    .gte('created_at', since)
    .limit(10_000);

  if (error) {
    throw error;
  }

  const bankPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../content/minecraft/minecraft-master-bank.v2.json');
  const bank = new Map(
    (JSON.parse(readFileSync(bankPath, 'utf8')) as MasterQuestionRecord[]).map((record) => [record.id, record])
  );

  console.log(`# Question reports, last ${days} days (${data.length})\n`);
  console.log('| reports | id | reasons | locales | question | answer |');
  console.log('| --- | --- | --- | --- | --- | --- |');

  for (const entry of summarizeReports(data)) {
    const record = bank.get(entry.contentId);
    const reasons = Object.entries(entry.reasons)
      .map(([reason, count]) => `${reason} ×${count}`)
      .join(', ');
    console.log(
      `| ${entry.total} | ${entry.contentId} | ${reasons} | ${entry.locales.join(' ')} | ${record?.promptEn ?? '(not in bank)'} | ${record?.correctAnswer ?? ''} |`
    );
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
