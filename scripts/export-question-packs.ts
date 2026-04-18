import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateQuestionBank } from '../src/features/content/content-validator';
import {
  contentDifficulties,
  contentTopics,
  type ContentDifficulty,
  type ContentQuestionRecord,
  type ContentTopicId,
} from '../src/features/content/types';

type DifficultySlices = Record<ContentDifficulty, ContentQuestionRecord[]>;
type TopicCounts = Record<ContentTopicId, number>;

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const questionBankPath = path.join(repoRoot, 'content/minecraft/minecraft-question-bank.v1.json');

function createDifficultySlices(records: ContentQuestionRecord[]): DifficultySlices {
  return contentDifficulties.reduce<DifficultySlices>(
    (slices, difficulty) => {
      slices[difficulty] = records.filter((record) => record.difficulty === difficulty);
      return slices;
    },
    { easy: [], medium: [], hard: [] }
  );
}

function createTopicCounts(records: ContentQuestionRecord[]): TopicCounts {
  return contentTopics.reduce<TopicCounts>(
    (counts, topicId) => {
      counts[topicId] = records.filter((record) => record.topicId === topicId).length;
      return counts;
    },
    {
      'survival-basics': 0,
      'crafting-and-smelting': 0,
      'blocks-and-building': 0,
      'mobs-and-combat': 0,
      'farming-and-animals': 0,
      'villagers-and-enchanting': 0,
      'biomes-and-structures': 0,
      'nether-end-and-redstone': 0,
    }
  );
}

function getOutputPath(): string | null {
  const outputFlagIndex = process.argv.indexOf('--out');
  const requestedPath = outputFlagIndex >= 0 ? process.argv[outputFlagIndex + 1] : null;

  if (!requestedPath) {
    return null;
  }

  return path.resolve(repoRoot, requestedPath);
}

async function main() {
  const raw = await readFile(questionBankPath, 'utf8');
  const records = validateQuestionBank(JSON.parse(raw));
  const activeRecords = records.filter((record) => record.isActive);
  const byDifficulty = createDifficultySlices(activeRecords);
  const summary = {
    byDifficulty: contentDifficulties.reduce<Record<ContentDifficulty, number>>(
      (counts, difficulty) => {
        counts[difficulty] = byDifficulty[difficulty].length;
        return counts;
      },
      { easy: 0, medium: 0, hard: 0 }
    ),
    byTopic: createTopicCounts(activeRecords),
    totalActive: activeRecords.length,
  };
  const payload = {
    summary,
    packs: byDifficulty,
  };
  const outputPath = getOutputPath();

  if (outputPath) {
    await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    console.log(
      `Exported ${activeRecords.length} active questions into pack slices at ${path.relative(repoRoot, outputPath)}.`
    );
    return;
  }

  console.log(
    JSON.stringify(
      {
        summary,
        sampleIdsByDifficulty: contentDifficulties.reduce<Record<ContentDifficulty, string[]>>(
          (samples, difficulty) => {
            samples[difficulty] = byDifficulty[difficulty].slice(0, 5).map((record) => record.id);
            return samples;
          },
          { easy: [], medium: [], hard: [] }
        ),
      },
      null,
      2
    )
  );
  console.error(`Exported ${activeRecords.length} active questions into pack slices. Use --out <path> to write the full payload.`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Question pack export failed: ${message}`);
  process.exit(1);
});
