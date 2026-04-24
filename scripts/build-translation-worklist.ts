import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type TranslationWorklistRecord = {
  difficulty: string;
  id: string;
  promptEn: string;
  reviewStatus: string;
  sources: Array<{ url: string }>;
  topicId: string;
  translationStatus: string;
};

function main() {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const masterBankPath = path.join(repoRoot, 'content/minecraft/minecraft-master-bank.v2.json');
  const masterBank = JSON.parse(readFileSync(masterBankPath, 'utf8')) as TranslationWorklistRecord[];

  const worklist = masterBank
    .filter((record) => record.reviewStatus === 'approved' && record.translationStatus !== 'complete')
    .map((record) => ({
      difficulty: record.difficulty,
      id: record.id,
      promptEn: record.promptEn,
      sourceUrls: record.sources.map((source) => source.url),
      topicId: record.topicId,
      translationStatus: record.translationStatus,
    }));

  console.log(JSON.stringify(worklist, null, 2));
  console.error(`Built translation worklist with ${worklist.length} record(s).`);
}

main();
