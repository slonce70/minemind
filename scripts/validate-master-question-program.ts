import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateMasterQuestionProgram } from '../src/features/content/master-content-validator';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readJsonFile<T>(relativePath: string): T {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), 'utf8')) as T;
}

const sourceRegister = readJsonFile('content/minecraft/minecraft-source-register.v1.json');
const slotBlueprint = readJsonFile('content/minecraft/minecraft-question-slots.v1.json');
const masterBank = readJsonFile('content/minecraft/minecraft-master-bank.v2.json');

const validated = validateMasterQuestionProgram({ sourceRegister, slotBlueprint, masterBank });

console.log(
  `Validated master question program with ${validated.sourceRegister.length} source entries, ${validated.slotBlueprint.length} slot records, and ${validated.masterBank.length} master question record(s).`
);
