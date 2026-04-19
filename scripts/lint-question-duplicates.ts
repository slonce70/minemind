import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type DuplicateLintIssue = {
  ids: [string, string];
  kind: 'duplicate-prompt' | 'same-answer-set' | 'template-overuse';
};

type DuplicateLintRecord = {
  correctAnswer: string;
  distractors: string[];
  id: string;
  promptEn: string;
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePrompt(value: string) {
  return normalizeText(value);
}

function normalizeAnswerSet(correctAnswer: string, distractors: string[]) {
  return [correctAnswer, ...distractors].map(normalizeText).sort().join('|');
}

function buildTemplateSignature(promptEn: string) {
  return normalizePrompt(promptEn)
    .split(' ')
    .slice(0, 4)
    .join(' ');
}

export function findDuplicateQuestionRisks(records: DuplicateLintRecord[]): DuplicateLintIssue[] {
  const issues: DuplicateLintIssue[] = [];
  const seenPrompts = new Map<string, string>();
  const seenAnswerSets = new Map<string, string>();
  const seenTemplates = new Map<string, string>();
  const templateCounts = new Map<string, number>();

  for (const record of records) {
    const promptKey = normalizePrompt(record.promptEn);
    const previousPromptId = seenPrompts.get(promptKey);
    if (previousPromptId) {
      issues.push({ ids: [previousPromptId, record.id], kind: 'duplicate-prompt' });
    } else {
      seenPrompts.set(promptKey, record.id);
    }

    const answerSetKey = normalizeAnswerSet(record.correctAnswer, record.distractors);
    const previousAnswerSetId = seenAnswerSets.get(answerSetKey);
    if (previousAnswerSetId) {
      issues.push({ ids: [previousAnswerSetId, record.id], kind: 'same-answer-set' });
    } else {
      seenAnswerSets.set(answerSetKey, record.id);
    }

    const templateKey = buildTemplateSignature(record.promptEn);
    const previousTemplateId = seenTemplates.get(templateKey);
    const templateCount = templateCounts.get(templateKey) ?? 0;
    if (previousTemplateId && templateKey.length > 0 && templateCount >= 2) {
      issues.push({ ids: [previousTemplateId, record.id], kind: 'template-overuse' });
    } else if (!previousTemplateId) {
      seenTemplates.set(templateKey, record.id);
    }
    templateCounts.set(templateKey, templateCount + 1);
  }

  return issues;
}

function main() {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const masterBankPath = path.join(repoRoot, 'content/minecraft/minecraft-master-bank.v2.json');
  const masterBank = JSON.parse(readFileSync(masterBankPath, 'utf8')) as DuplicateLintRecord[];
  const issues = findDuplicateQuestionRisks(masterBank);

  if (issues.length > 0) {
    console.error(JSON.stringify(issues, null, 2));
    process.exit(1);
  }

  console.log(`Duplicate lint passed for ${masterBank.length} master question record(s).`);
}

main();
