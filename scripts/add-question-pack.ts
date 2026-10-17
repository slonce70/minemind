// Adds a pack of new master-bank questions after the same checks the bank itself passes.
//   npx tsx scripts/add-question-pack.ts <pack.json>            check only
//   npx tsx scripts/add-question-pack.ts <pack.json> --write    check, append, re-export
// A pack is a JSON array of master records (see docs/release/liveops.md for the template).
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { lintQuestionBank } from '../src/features/content/content-lint';
import { minecraftQuestionRecordSchema } from '../src/features/content/content-validator';
import { validateMasterQuestionProgram } from '../src/features/content/master-content-validator';
import type { MasterQuestionRecord } from '../src/features/content/master-types';
import { buildRuntimeQuestionRecord } from './export-master-question-packs';
import { findDuplicateQuestionRisks } from './lint-question-duplicates';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bankPath = path.join(repoRoot, 'content/minecraft/minecraft-master-bank.v2.json');
const readJson = (file: string) => JSON.parse(readFileSync(path.resolve(repoRoot, file), 'utf8'));

/** Problems a pack would bring into the bank; empty when it can be merged. */
export function checkQuestionPack(bank: MasterQuestionRecord[], pack: MasterQuestionRecord[]) {
  const problems: string[] = [];
  const packIds = new Set(pack.map((record) => record.id));
  const merged = [...bank, ...pack];

  try {
    validateMasterQuestionProgram({
      masterBank: merged,
      slotBlueprint: readJson('content/minecraft/minecraft-question-slots.v1.json'),
      sourceRegister: readJson('content/minecraft/minecraft-source-register.v1.json'),
    });
  } catch (error) {
    const issues = (error as { issues?: Array<{ message: string; path?: Array<string | number> }> }).issues ?? [
      { message: String(error) },
    ];

    for (const issue of issues) {
      const index = issue.path?.[1];
      const id = typeof index === 'number' ? merged[index]?.id : '?';
      problems.push(`schema ${id}: ${issue.path?.slice(2).join('.') ?? ''} ${issue.message}`);
    }
  }

  const seen = new Set(bank.map((record) => record.id));

  for (const record of pack) {
    if (seen.has(record.id)) {
      problems.push(`${record.id}: duplicate id`);
    }

    seen.add(record.id);

    if (!record.verifiedForVersion) {
      problems.push(`${record.id}: set verifiedForVersion to the game version the fact was checked on`);
    }

    const en = record.localized?.en?.options ?? [];

    if (en[0] !== record.correctAnswer || JSON.stringify(en.slice(1)) !== JSON.stringify(record.distractors)) {
      problems.push(`${record.id}: localized.en.options must be [correctAnswer, ...distractors]`);
    }

    if (record.promptEn !== record.localized?.en?.prompt || record.explanationEn !== record.localized?.en?.explanation) {
      problems.push(`${record.id}: promptEn/explanationEn must equal localized.en`);
    }
  }

  const runtime = merged.flatMap((record) => {
    try {
      return [buildRuntimeQuestionRecord(record)];
    } catch (error) {
      problems.push(`${record.id}: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  });

  for (const record of runtime.filter((entry) => packIds.has(entry.id))) {
    const parsed = minecraftQuestionRecordSchema.safeParse(record);

    if (!parsed.success) {
      problems.push(`runtime ${record.id}: ${parsed.error.issues.map((issue) => issue.message).join('; ')}`);
    }
  }

  for (const issue of lintQuestionBank(runtime)) {
    if (packIds.has(issue.split(':')[0])) {
      problems.push(`lint ${issue}`);
    }
  }

  for (const issue of findDuplicateQuestionRisks(merged)) {
    if (issue.ids.some((id) => packIds.has(id))) {
      problems.push(`duplicate ${issue.kind}: ${issue.ids.join(' vs ')}`);
    }
  }

  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [packFile] = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));

  if (!packFile) {
    console.error('Usage: npx tsx scripts/add-question-pack.ts <pack.json> [--write]');
    process.exit(2);
  }

  const raw = readFileSync(bankPath, 'utf8');
  const bank = JSON.parse(raw) as MasterQuestionRecord[];
  const pack = JSON.parse(readFileSync(path.resolve(packFile), 'utf8')) as MasterQuestionRecord[];
  const problems = checkQuestionPack(bank, pack);

  if (problems.length > 0) {
    console.error(problems.join('\n'));
    console.error(`\n${problems.length} problem(s); nothing written.`);
    process.exit(1);
  }

  if (!process.argv.includes('--write')) {
    console.log(`OK: ${pack.length} question(s) can be added. Run again with --write to add them.`);
    process.exit(0);
  }

  writeFileSync(bankPath, `${JSON.stringify([...bank, ...pack], null, 2)}${raw.endsWith('\n') ? '\n' : ''}`);
  execSync('npm run export:content && npm run validate:content', { cwd: repoRoot, stdio: 'inherit' });
  console.log(`Added ${pack.length} question(s); the bank now has ${bank.length + pack.length}.`);
}
