import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateQuestionBank } from '../src/features/content/content-validator';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const questionBankPath = path.join(repoRoot, 'content/minecraft/minecraft-question-bank.v1.json');

function main() {
  const raw = readFileSync(questionBankPath, 'utf8');
  const data = JSON.parse(raw);
  const validated = validateQuestionBank(data);

  console.log(`Validated ${validated.length} Minecraft question record(s) from ${path.relative(repoRoot, questionBankPath)}`);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Question bank validation failed: ${message}`);
  process.exit(1);
}
