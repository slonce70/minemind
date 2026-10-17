// Suggests difficulty changes from answer statistics (public.question_stats).
//
//   npx tsx scripts/suggest-difficulty.ts --stats stats.json        (an export of question_stats)
//   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npx tsx scripts/suggest-difficulty.ts
//   … --min-attempts 50 --out suggestions.json
//
// It only prints (and optionally writes) suggestions; apply the ones you agree with to the master
// bank by hand and run `npm run export:content`.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createClient } from '@supabase/supabase-js';

import { suggestDifficultyChanges, type QuestionStats } from '../src/features/content/difficulty-calibration';
import type { ContentDifficulty } from '../src/features/content/types';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function flag(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function loadStats(): Promise<QuestionStats[]> {
  const file = flag('stats');

  if (file) {
    return JSON.parse(readFileSync(path.resolve(file), 'utf8')) as QuestionStats[];
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Pass --stats <file> or set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  const { data, error } = await createClient(url, key, { auth: { persistSession: false } })
    .from('question_stats')
    .select('content_id, attempts, correct, timed_answers, answer_ms_total');

  if (error) {
    throw error;
  }

  return data as QuestionStats[];
}

async function main() {
  const bank = JSON.parse(
    readFileSync(path.join(repoRoot, 'content/minecraft/minecraft-master-bank.v2.json'), 'utf8')
  ) as { difficulty: ContentDifficulty; id: string; promptEn: string }[];
  const stats = await loadStats();
  const suggestions = suggestDifficultyChanges(bank, stats, Number(flag('min-attempts') ?? 30));
  const prompts = new Map(bank.map((record) => [record.id, record.promptEn]));

  console.log(`${stats.length} question(s) with statistics, ${suggestions.length} suggestion(s).`);

  for (const entry of suggestions) {
    const seconds = entry.averageMs === null ? '–' : `${(entry.averageMs / 1000).toFixed(1)} s`;
    console.log(
      `${entry.from} → ${entry.to}  ${Math.round(entry.accuracy * 100)}% of ${entry.attempts}, ${seconds}  ${entry.id}: ${prompts.get(entry.id)}`
    );
  }

  const out = flag('out');

  if (out) {
    writeFileSync(path.resolve(out), `${JSON.stringify(suggestions, null, 2)}\n`);
    console.log(`Wrote ${out}.`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
