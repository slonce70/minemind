import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { shuffleOptions } from '../supabase/functions/_shared/game-rules';
import type {
  ContentDifficulty,
  ContentQuestionRecord,
  ContentTopicId,
  QuestionKind,
  QuestionMedia,
} from '../src/features/content/types';

type LocalizedMasterPayload = {
  explanation: string;
  options: string[];
  prompt: string;
};

type ExportReadyMasterRecord = {
  correctAnswer: string;
  id: string;
  isActive: boolean;
  kind?: QuestionKind;
  localized: {
    en: LocalizedMasterPayload;
    uk: LocalizedMasterPayload;
    ru?: LocalizedMasterPayload;
  };
  media?: QuestionMedia;
  optionIcons?: string[];
  sourceVersion: string;
  tags: string[];
  topicId: ContentTopicId;
  difficulty: ContentDifficulty;
};

export function buildRuntimeQuestionRecord(record: ExportReadyMasterRecord): ContentQuestionRecord {
  const sourceCorrectIndex = record.localized.en.options.findIndex((option) => option === record.correctAnswer);
  const russianPayload = record.localized.ru ?? record.localized.uk;

  if (sourceCorrectIndex < 0) {
    throw new Error(`Localized english options for ${record.id} do not contain the correct answer.`);
  }

  const indexes = record.localized.en.options.map((_, index) => index);
  // True/false always reads "true, false". Other questions spread the correct answer across
  // positions in the bank itself (the app shuffles again per round).
  const { correctIndex, order } =
    record.kind === 'true-false'
      ? (() => {
          const trueFirst = record.localized.en.options[0] === 'True' ? [0, 1] : [1, 0];
          return { correctIndex: trueFirst.indexOf(sourceCorrectIndex), order: trueFirst };
        })()
      : shuffleOptions(indexes, sourceCorrectIndex, record.id);

  return {
    ageBand: '8-12',
    categoryId: 'minecraft',
    correctIndex,
    difficulty: record.difficulty,
    explanation: {
      en: record.localized.en.explanation,
      uk: record.localized.uk.explanation,
      ru: russianPayload.explanation,
    },
    id: record.id,
    isActive: record.isActive,
    ...(record.kind ? { kind: record.kind } : {}),
    ...(record.media ? { media: record.media } : {}),
    ...(record.optionIcons ? { optionIcons: order.map((index) => record.optionIcons![index]) } : {}),
    options: order.map((index) => ({
      en: record.localized.en.options[index],
      uk: record.localized.uk.options[index],
      ru: russianPayload.options[index],
    })),
    prompt: {
      en: record.localized.en.prompt,
      uk: record.localized.uk.prompt,
      ru: russianPayload.prompt,
    },
    sourceVersion: record.sourceVersion,
    tags: record.tags,
    topicId: record.topicId,
  };
}

function getOutputPath(repoRoot: string) {
  const outputFlagIndex = process.argv.indexOf('--out');
  const requestedPath = outputFlagIndex >= 0 ? process.argv[outputFlagIndex + 1] : null;

  if (!requestedPath) {
    return null;
  }

  return path.resolve(repoRoot, requestedPath);
}

function main() {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const masterBankPath = path.join(repoRoot, 'content/minecraft/minecraft-master-bank.v2.json');
  const masterBank = JSON.parse(readFileSync(masterBankPath, 'utf8')) as Array<Partial<ExportReadyMasterRecord>>;

  const exportableRecords = masterBank.filter(
    (record): record is ExportReadyMasterRecord =>
      Boolean(
        record.id &&
          record.correctAnswer &&
          record.topicId &&
          record.difficulty &&
          record.sourceVersion &&
          record.tags &&
        record.localized?.en &&
          record.localized?.uk
      )
  );

  const runtimeRecords = exportableRecords.map(buildRuntimeQuestionRecord);
  const outputPath = getOutputPath(repoRoot);

  if (outputPath) {
    writeFileSync(outputPath, `${JSON.stringify(runtimeRecords, null, 2)}\n`, 'utf8');
    console.log(`Exported ${runtimeRecords.length} runtime question record(s) to ${path.relative(repoRoot, outputPath)}.`);
    return;
  }

  console.log(`Exported ${runtimeRecords.length} runtime question record(s). Use --out <path> to write the payload.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
