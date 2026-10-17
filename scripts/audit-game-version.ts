// After a game update: which questions need a fresh look.
//   npx tsx scripts/audit-game-version.ts --target 1.22              review list (markdown)
//   npx tsx scripts/audit-game-version.ts --target 1.22 --confirm a,b mark facts re-checked on 1.22
//   npx tsx scripts/audit-game-version.ts --check                    CI: every record states its version
// Version-gated questions (facts that changed between updates, or exist only since one) come first;
// with --all, every question last verified on an older version is listed too.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { MasterQuestionRecord } from '../src/features/content/master-types';

export function compareGameVersions(left: string, right: string) {
  const a = left.split('.').map(Number);
  const b = right.split('.').map(Number);

  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);

    if (difference !== 0) {
      return Math.sign(difference);
    }
  }

  return 0;
}

/** Active questions verified on a version older than `target`; version-gated ones unless `all`. */
export function questionsToReview(bank: MasterQuestionRecord[], target: string, all = false) {
  return bank
    .filter((record) => record.isActive && (all || record.versionGated))
    .filter((record) => compareGameVersions(record.verifiedForVersion ?? '0', target) < 0)
    .sort((left, right) => Number(right.versionGated) - Number(left.versionGated) || left.topicId.localeCompare(right.topicId));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const option = (name: string) => {
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] : undefined;
  };
  const bankPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../content/minecraft/minecraft-master-bank.v2.json');
  const raw = readFileSync(bankPath, 'utf8');
  const bank = JSON.parse(raw) as MasterQuestionRecord[];

  if (args.includes('--check')) {
    const missing = bank.filter((record) => !record.verifiedForVersion).map((record) => record.id);

    if (missing.length > 0) {
      console.error(`Questions without verifiedForVersion: ${missing.join(', ')}`);
      process.exit(1);
    }

    console.log(`All ${bank.length} questions state the game version they were checked on.`);
    process.exit(0);
  }

  const target = option('--target');

  if (!target || !/^1\.\d+(?:\.\d+)?$/.test(target)) {
    console.error('Usage: --target <game version like 1.22> [--all] [--confirm id1,id2] | --check');
    process.exit(2);
  }

  const confirm = option('--confirm');

  if (confirm) {
    const ids = new Set(confirm.split(',').map((id) => id.trim()));
    const unknown = [...ids].filter((id) => !bank.some((record) => record.id === id));

    if (unknown.length > 0) {
      console.error(`Unknown ids: ${unknown.join(', ')}`);
      process.exit(1);
    }

    const updated = bank.map((record) => (ids.has(record.id) ? { ...record, verifiedForVersion: target } : record));
    writeFileSync(bankPath, `${JSON.stringify(updated, null, 2)}${raw.endsWith('\n') ? '\n' : ''}`);
    console.log(`Marked ${ids.size} question(s) as verified on ${target}. Run npm run export:content.`);
    process.exit(0);
  }

  const list = questionsToReview(bank, target, args.includes('--all'));
  console.log(`# Questions to re-check for ${target} (${list.length})\n`);
  console.log('| id | topic | gated | verified on | question | answer | source |');
  console.log('| --- | --- | --- | --- | --- | --- | --- |');

  for (const record of list) {
    console.log(
      `| ${record.id} | ${record.topicId} | ${record.versionGated ? 'yes' : ''} | ${record.verifiedForVersion ?? '—'} | ${record.promptEn} | ${record.correctAnswer} | ${record.sources[0].url} |`
    );
  }
}
