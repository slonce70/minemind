# MineMind Minecraft Question Program Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-safe Minecraft question program that grows MineMind from `60` localized records to a validated, source-grounded `1080`-question English master-bank with controlled export and translation workflows.

**Architecture:** Keep the current runtime question model for the app, but add a separate authoring layer with source provenance, slot quotas, review states, duplicate linting, and export tooling. Use a staged content pipeline: source register -> slot blueprint -> master-bank authoring -> validation/lint -> editorial approval -> translation/export.

**Tech Stack:** TypeScript, Node test runner, Zod, JSON content files, existing MineMind content pipeline, Expo/TypeScript repo tooling, `tsx` scripts

---

## File Structure

### Existing files to modify

- `src/features/content/types.ts`
- `src/features/content/content-validator.ts`
- `scripts/export-question-packs.ts`
- `docs/content/minecraft-content-guide.md`

### New files to create

- `src/features/content/master-types.ts`
- `src/features/content/master-content-validator.ts`
- `content/minecraft/minecraft-source-register.v1.json`
- `content/minecraft/minecraft-question-slots.v1.json`
- `content/minecraft/minecraft-master-bank.v2.json`
- `docs/content/minecraft-question-authoring-guide.md`
- `scripts/validate-master-question-program.ts`
- `scripts/lint-question-duplicates.ts`
- `scripts/export-master-question-packs.ts`
- `scripts/build-translation-worklist.ts`
- `tests/content-master-model.test.ts`
- `tests/content-master-validator.test.ts`
- `tests/content-duplicate-lint.test.ts`
- `tests/content-export-pipeline.test.ts`

### Testing commands used throughout

- `npm test`
- `npm test -- tests/content-master-model.test.ts`
- `npm test -- tests/content-master-validator.test.ts`
- `npm test -- tests/content-duplicate-lint.test.ts`
- `npm test -- tests/content-export-pipeline.test.ts`
- `npx tsx scripts/validate-master-question-program.ts`
- `npx tsx scripts/lint-question-duplicates.ts`
- `npx tsx scripts/export-master-question-packs.ts --out <path>`

## Task 1: Introduce The Master Question Program Model

**Files:**
- Create: `src/features/content/master-types.ts`
- Modify: `src/features/content/types.ts`
- Test: `tests/content-master-model.test.ts`

- [ ] **Step 1: Write the failing master-model test**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  canonScopes,
  masterQuestionReviewStatuses,
  minecraftQuestionProgramTarget,
  minecraftTopicClusters,
} from '../src/features/content/master-types';

test('minecraft question program target is fixed at 1080 records', () => {
  assert.equal(minecraftQuestionProgramTarget.totalQuestions, 1080);
  assert.equal(minecraftQuestionProgramTarget.questionsPerTopicPerDifficulty, 45);
});

test('master content model exposes canon scope and review enums', () => {
  assert.deepEqual(canonScopes, ['common-canon', 'java-only', 'bedrock-only']);
  assert.deepEqual(masterQuestionReviewStatuses, [
    'draft',
    'auto-validated',
    'editor-reviewed',
    'approved',
    'rejected',
  ]);
});

test('every topic has exactly three internal clusters', () => {
  assert.equal(minecraftTopicClusters['survival-basics'].length, 3);
  assert.equal(minecraftTopicClusters['nether-end-and-redstone'].length, 3);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/content-master-model.test.ts`

Expected: FAIL because `master-types.ts` does not exist.

- [ ] **Step 3: Add the master program constants and types**

```ts
import type { ContentDifficulty, ContentTopicId } from './types';

export const canonScopes = ['common-canon', 'java-only', 'bedrock-only'] as const;

export type CanonScope = (typeof canonScopes)[number];

export const masterQuestionReviewStatuses = [
  'draft',
  'auto-validated',
  'editor-reviewed',
  'approved',
  'rejected',
] as const;

export type MasterQuestionReviewStatus = (typeof masterQuestionReviewStatuses)[number];

export const minecraftQuestionProgramTarget = {
  totalQuestions: 1080,
  topics: 8,
  difficulties: 3,
  questionsPerTopicPerDifficulty: 45,
  questionsPerClusterPerDifficulty: 15,
} as const;

export const minecraftTopicClusters: Record<ContentTopicId, [string, string, string]> = {
  'survival-basics': ['health-hunger-safety', 'spawn-night-shelter', 'movement-hazards-utility'],
  'crafting-and-smelting': ['stations-recipes', 'tools-fuel-smelting', 'materials-progression'],
  'blocks-and-building': ['natural-materials', 'block-behavior', 'utility-building-blocks'],
  'mobs-and-combat': ['passive-neutral-mobs', 'hostile-mobs', 'combat-safety'],
  'farming-and-animals': ['crops-growth', 'animals-breeding', 'food-farm-loops'],
  'villagers-and-enchanting': ['professions-workstations', 'trading-economy', 'enchanting-upgrades'],
  'biomes-and-structures': ['biome-recognition', 'natural-generated-structures', 'loot-and-purpose'],
  'nether-end-and-redstone': ['nether-travel-materials', 'end-progression', 'simple-redstone'],
};

export type QuestionSourceRecord = {
  accessedAt: string;
  evidenceNote: string;
  title: string;
  type: 'wiki' | 'official-article' | 'official-release-note' | 'technical-reference';
  url: string;
};

export type MasterQuestionRecord = {
  ageBand: '8-12';
  canonScope: CanonScope;
  categoryId: 'minecraft';
  clusterId: string;
  correctAnswer: string;
  difficulty: ContentDifficulty;
  distractors: [string, string, string];
  explanationEn: string;
  id: string;
  isActive: boolean;
  promptEn: string;
  reviewStatus: MasterQuestionReviewStatus;
  sourceVersion: string;
  sources: [QuestionSourceRecord, ...QuestionSourceRecord[]];
  tags: string[];
  topicId: ContentTopicId;
  translationStatus: 'not-started' | 'in-progress' | 'complete';
  versionGated: boolean;
};
```

- [ ] **Step 4: Export the shared topic and difficulty types from the current runtime model**

```ts
export type ContentQuestionRecord = {
  ageBand: ContentAgeBand;
  categoryId: ContentCategoryId;
  correctIndex: number;
  difficulty: ContentDifficulty;
  explanation: LocalizedString;
  id: string;
  isActive: boolean;
  options: [LocalizedString, LocalizedString, LocalizedString, LocalizedString];
  prompt: LocalizedString;
  sourceVersion: string;
  tags: string[];
  topicId: ContentTopicId;
};
```

- [ ] **Step 5: Run focused verification**

Run: `npm test -- tests/content-master-model.test.ts && npm run typecheck`

Expected: PASS with the new master model exported cleanly.

- [ ] **Step 6: Commit**

```bash
git add src/features/content/master-types.ts src/features/content/types.ts tests/content-master-model.test.ts
git commit -m "feat: add minecraft question program master model"
```

## Task 2: Create The Source Register And 1080-Slot Blueprint

**Files:**
- Create: `content/minecraft/minecraft-source-register.v1.json`
- Create: `content/minecraft/minecraft-question-slots.v1.json`
- Test: `tests/content-master-validator.test.ts`

- [ ] **Step 1: Write the failing quota test**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('question slot blueprint sums to 1080 records', () => {
  const slots = JSON.parse(
    readFileSync(new URL('../content/minecraft/minecraft-question-slots.v1.json', import.meta.url), 'utf8')
  );

  const total = slots.reduce((sum: number, slot: { targetCount: number }) => sum + slot.targetCount, 0);
  assert.equal(total, 1080);
});

test('source register includes primary Minecraft Wiki and minecraft.net entries', () => {
  const sources = JSON.parse(
    readFileSync(new URL('../content/minecraft/minecraft-source-register.v1.json', import.meta.url), 'utf8')
  );

  assert.ok(sources.some((entry: { id: string }) => entry.id === 'wiki-block'));
  assert.ok(sources.some((entry: { id: string }) => entry.id === 'official-how-to-craft'));
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/content-master-validator.test.ts`

Expected: FAIL because both content files do not exist yet.

- [ ] **Step 3: Create the source register with canonical ids**

```json
[
  {
    "id": "wiki-block",
    "title": "Block - Minecraft Wiki",
    "type": "wiki",
    "url": "https://minecraft.wiki/w/Block",
    "accessedAt": "2026-04-19",
    "topics": ["blocks-and-building", "crafting-and-smelting"],
    "canonScope": "common-canon",
    "notes": "Primary source for common block names and broad block behavior."
  },
  {
    "id": "wiki-mob",
    "title": "Mob - Minecraft Wiki",
    "type": "wiki",
    "url": "https://minecraft.wiki/w/Mob",
    "accessedAt": "2026-04-19",
    "topics": ["mobs-and-combat", "farming-and-animals"],
    "canonScope": "common-canon",
    "notes": "Primary source for mob lists and broad classifications."
  },
  {
    "id": "official-how-to-craft",
    "title": "How to craft | Minecraft",
    "type": "official-article",
    "url": "https://www.minecraft.net/article/how-craft",
    "accessedAt": "2026-04-19",
    "topics": ["crafting-and-smelting", "survival-basics"],
    "canonScope": "common-canon",
    "notes": "Official starter phrasing for crafting and furnace basics."
  }
]
```

- [ ] **Step 4: Create the slot blueprint with exact quota math**

```ts
import { writeFileSync } from 'node:fs';

import { contentDifficulties, contentTopics } from '../src/features/content/types';
import { minecraftTopicClusters } from '../src/features/content/master-types';

const slots = contentTopics.flatMap((topicId) =>
  contentDifficulties.flatMap((difficulty) =>
    minecraftTopicClusters[topicId].map((clusterId) => ({
      topicId,
      difficulty,
      clusterId,
      targetCount: 15,
    }))
  )
);

writeFileSync('content/minecraft/minecraft-question-slots.v1.json', `${JSON.stringify(slots, null, 2)}\n`, 'utf8');
```

This must produce:

- `72` slot records
- `24` topic-difficulty pairs
- `3` clusters per topic-difficulty pair
- `1080` total target questions

- [ ] **Step 5: Run focused verification**

Run: `npm test -- tests/content-master-validator.test.ts`

Expected: PASS with the source register present and the slot total equal to `1080`.

- [ ] **Step 6: Commit**

```bash
git add content/minecraft/minecraft-source-register.v1.json content/minecraft/minecraft-question-slots.v1.json tests/content-master-validator.test.ts
git commit -m "feat: add minecraft source register and slot blueprint"
```

## Task 3: Implement Master Validation And Program CLI

**Files:**
- Create: `src/features/content/master-content-validator.ts`
- Create: `scripts/validate-master-question-program.ts`
- Test: `tests/content-master-validator.test.ts`

- [ ] **Step 1: Add failing validation tests**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';

import { validateMasterQuestionProgram } from '../src/features/content/master-content-validator';

test('master question program rejects records without sources', () => {
  assert.throws(() =>
    validateMasterQuestionProgram({
      sourceRegister: [],
      slotBlueprint: [],
      masterBank: [
        {
          id: 'survival-easy-001',
          categoryId: 'minecraft',
          topicId: 'survival-basics',
          clusterId: 'health-hunger-safety',
          difficulty: 'easy',
          ageBand: '8-12',
          canonScope: 'common-canon',
          promptEn: 'Which item restores hunger?',
          correctAnswer: 'Bread',
          distractors: ['Stone', 'Sand', 'Stick'],
          explanationEn: 'Bread is a food item.',
          tags: ['food'],
          sourceVersion: 'minecraft-v2',
          reviewStatus: 'draft',
          translationStatus: 'not-started',
          versionGated: false,
          isActive: false,
          sources: [],
        },
      ],
    }),
    /at least one source/
  );
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/content-master-validator.test.ts`

Expected: FAIL because the master validator does not exist.

- [ ] **Step 3: Implement the master validator**

```ts
import { z } from 'zod';

import { contentDifficulties, contentTopics } from './types';
import { canonScopes, masterQuestionReviewStatuses } from './master-types';

const sourceRecordSchema = z.object({
  accessedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  evidenceNote: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(['wiki', 'official-article', 'official-release-note', 'technical-reference']),
  url: z.string().url(),
});

const masterQuestionRecordSchema = z.object({
  ageBand: z.literal('8-12'),
  canonScope: z.enum(canonScopes),
  categoryId: z.literal('minecraft'),
  clusterId: z.string().min(1),
  correctAnswer: z.string().min(1),
  difficulty: z.enum(contentDifficulties),
  distractors: z.tuple([z.string().min(1), z.string().min(1), z.string().min(1)]),
  explanationEn: z.string().min(1),
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  isActive: z.boolean(),
  promptEn: z.string().min(1),
  reviewStatus: z.enum(masterQuestionReviewStatuses),
  sourceVersion: z.string().regex(/^[a-z0-9]+(?:[-.][a-z0-9]+)*$/),
  sources: z.array(sourceRecordSchema).min(1),
  tags: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)).min(1),
  topicId: z.enum(contentTopics),
  translationStatus: z.enum(['not-started', 'in-progress', 'complete']),
  versionGated: z.boolean(),
});

export function validateMasterQuestionProgram(input: unknown) {
  return z
    .object({
      sourceRegister: z.array(z.object({ id: z.string().min(1) }).passthrough()),
      slotBlueprint: z.array(z.object({ targetCount: z.number().int().positive() }).passthrough()),
      masterBank: z.array(masterQuestionRecordSchema),
    })
    .parse(input);
}
```

- [ ] **Step 4: Add the CLI validator**

```ts
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { validateMasterQuestionProgram } from '../src/features/content/master-content-validator';

const repoRoot = path.resolve(import.meta.dirname, '..');

const sourceRegister = JSON.parse(
  readFileSync(path.join(repoRoot, 'content/minecraft/minecraft-source-register.v1.json'), 'utf8')
);
const slotBlueprint = JSON.parse(
  readFileSync(path.join(repoRoot, 'content/minecraft/minecraft-question-slots.v1.json'), 'utf8')
);
const masterBank = JSON.parse(
  readFileSync(path.join(repoRoot, 'content/minecraft/minecraft-master-bank.v2.json'), 'utf8')
);

const validated = validateMasterQuestionProgram({ sourceRegister, slotBlueprint, masterBank });
console.log(`Validated master question program with ${validated.masterBank.length} master record(s).`);
```

- [ ] **Step 5: Run focused verification**

Run: `npm test -- tests/content-master-validator.test.ts && npx tsx scripts/validate-master-question-program.ts`

Expected: PASS once the validator and CLI are wired.

- [ ] **Step 6: Commit**

```bash
git add src/features/content/master-content-validator.ts scripts/validate-master-question-program.ts tests/content-master-validator.test.ts
git commit -m "feat: add master question program validation"
```

## Task 4: Add Duplicate And Template Linting

**Files:**
- Create: `scripts/lint-question-duplicates.ts`
- Test: `tests/content-duplicate-lint.test.ts`

- [ ] **Step 1: Write the failing duplicate-lint test**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';

import { findDuplicateQuestionRisks } from '../scripts/lint-question-duplicates';

test('duplicate lint flags identical normalized prompts', () => {
  const issues = findDuplicateQuestionRisks([
    {
      id: 'q1',
      promptEn: 'Which mob explodes when it gets close to the player?',
      correctAnswer: 'Creeper',
      distractors: ['Zombie', 'Cow', 'Wolf'],
    },
    {
      id: 'q2',
      promptEn: 'Which mob explodes when it gets close to the player?',
      correctAnswer: 'Creeper',
      distractors: ['Zombie', 'Pig', 'Wolf'],
    },
  ]);

  assert.equal(issues.length, 1);
  assert.equal(issues[0]?.kind, 'duplicate-prompt');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/content-duplicate-lint.test.ts`

Expected: FAIL because the lint script does not exist.

- [ ] **Step 3: Implement duplicate and template checks**

```ts
export type DuplicateLintIssue = {
  ids: [string, string];
  kind: 'duplicate-prompt' | 'same-answer-set' | 'template-overuse';
};

function normalizePrompt(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

export function findDuplicateQuestionRisks(records: Array<{
  id: string;
  promptEn: string;
  correctAnswer: string;
  distractors: string[];
}>): DuplicateLintIssue[] {
  const issues: DuplicateLintIssue[] = [];
  const seenPrompts = new Map<string, string>();

  for (const record of records) {
    const promptKey = normalizePrompt(record.promptEn);
    const previous = seenPrompts.get(promptKey);
    if (previous) {
      issues.push({ ids: [previous, record.id], kind: 'duplicate-prompt' });
      continue;
    }
    seenPrompts.set(promptKey, record.id);
  }

  return issues;
}
```

- [ ] **Step 4: Add a CLI entry point**

```ts
if (import.meta.url === `file://${process.argv[1]}`) {
  const issues = findDuplicateQuestionRisks(masterBank);
  if (issues.length > 0) {
    console.error(JSON.stringify(issues, null, 2));
    process.exit(1);
  }

  console.log(`Duplicate lint passed for ${masterBank.length} record(s).`);
}
```

- [ ] **Step 5: Run focused verification**

Run: `npm test -- tests/content-duplicate-lint.test.ts && npx tsx scripts/lint-question-duplicates.ts`

Expected: PASS when the current bank has no duplicate-prompt failures.

- [ ] **Step 6: Commit**

```bash
git add scripts/lint-question-duplicates.ts tests/content-duplicate-lint.test.ts
git commit -m "feat: add minecraft question duplicate lint"
```

## Task 5: Build Export And Translation Worklist Tooling

**Files:**
- Create: `scripts/export-master-question-packs.ts`
- Create: `scripts/build-translation-worklist.ts`
- Test: `tests/content-export-pipeline.test.ts`

- [ ] **Step 1: Write the failing export test**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';

import { buildRuntimeQuestionRecord } from '../scripts/export-master-question-packs';

test('approved translated master records map to runtime question shape', () => {
  const runtimeRecord = buildRuntimeQuestionRecord({
    id: 'survival-easy-001',
    topicId: 'survival-basics',
    difficulty: 'easy',
    tags: ['food'],
    sourceVersion: 'minecraft-v2',
    isActive: true,
    promptEn: 'Which food item can restore hunger?',
    correctAnswer: 'Bread',
    distractors: ['Stone', 'Stick', 'Sand'],
    localized: {
      en: {
        prompt: 'Which food item can restore hunger?',
        explanation: 'Bread is a common food item.',
        options: ['Bread', 'Stone', 'Stick', 'Sand'],
      },
      uk: {
        prompt: 'Яка їжа відновлює голод?',
        explanation: 'Хліб — звична їжа в Minecraft.',
        options: ['Хліб', 'Камінь', 'Палиця', 'Пісок'],
      },
      ru: {
        prompt: 'Какая еда восстанавливает голод?',
        explanation: 'Хлеб — обычная еда в Minecraft.',
        options: ['Хлеб', 'Камень', 'Палка', 'Песок'],
      },
    },
  });

  assert.equal(runtimeRecord.correctIndex, 0);
  assert.equal(runtimeRecord.prompt.en, 'Which food item can restore hunger?');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/content-export-pipeline.test.ts`

Expected: FAIL because the export helper does not exist.

- [ ] **Step 3: Implement the export mapper**

```ts
export function buildRuntimeQuestionRecord(record: {
  id: string;
  topicId: string;
  difficulty: string;
  tags: string[];
  sourceVersion: string;
  isActive: boolean;
  correctAnswer: string;
  localized: {
    en: { prompt: string; explanation: string; options: [string, string, string, string] };
    uk: { prompt: string; explanation: string; options: [string, string, string, string] };
    ru: { prompt: string; explanation: string; options: [string, string, string, string] };
  };
}) {
  return {
    ageBand: '8-12',
    categoryId: 'minecraft',
    correctIndex: record.localized.en.options.indexOf(record.correctAnswer),
    difficulty: record.difficulty,
    explanation: {
      en: record.localized.en.explanation,
      uk: record.localized.uk.explanation,
      ru: record.localized.ru.explanation,
    },
    id: record.id,
    isActive: record.isActive,
    options: record.localized.en.options.map((_, index) => ({
      en: record.localized.en.options[index],
      uk: record.localized.uk.options[index],
      ru: record.localized.ru.options[index],
    })) as [
      { en: string; uk: string; ru: string },
      { en: string; uk: string; ru: string },
      { en: string; uk: string; ru: string },
      { en: string; uk: string; ru: string },
    ],
    prompt: {
      en: record.localized.en.prompt,
      uk: record.localized.uk.prompt,
      ru: record.localized.ru.prompt,
    },
    sourceVersion: record.sourceVersion,
    tags: record.tags,
    topicId: record.topicId,
  };
}
```

- [ ] **Step 4: Add the translation worklist builder**

```ts
const worklist = masterBank
  .filter((record) => record.reviewStatus === 'approved' && record.translationStatus !== 'complete')
  .map((record) => ({
    id: record.id,
    promptEn: record.promptEn,
    topicId: record.topicId,
    difficulty: record.difficulty,
    sources: record.sources.map((source) => source.url),
  }));
```

- [ ] **Step 5: Run focused verification**

Run: `npm test -- tests/content-export-pipeline.test.ts && npx tsx scripts/build-translation-worklist.ts && npx tsx scripts/export-master-question-packs.ts --out /tmp/master-packs.json`

Expected: PASS with a translation worklist and exported runtime payload.

- [ ] **Step 6: Commit**

```bash
git add scripts/export-master-question-packs.ts scripts/build-translation-worklist.ts tests/content-export-pipeline.test.ts
git commit -m "feat: add master question export tooling"
```

## Task 6: Seed The First 120 Approved English Master Records

**Files:**
- Create: `content/minecraft/minecraft-master-bank.v2.json`
- Create: `docs/content/minecraft-question-authoring-guide.md`
- Test: `tests/content-master-validator.test.ts`

- [ ] **Step 1: Extend the validator test with wave-one health checks**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('wave one master bank ships 120 approved records across all topics', () => {
  const bank = JSON.parse(
    readFileSync(new URL('../content/minecraft/minecraft-master-bank.v2.json', import.meta.url), 'utf8')
  );

  assert.equal(bank.length, 120);
  assert.ok(bank.every((record: { canonScope: string }) => record.canonScope === 'common-canon'));
  assert.ok(bank.every((record: { reviewStatus: string }) => record.reviewStatus === 'approved'));
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/content-master-validator.test.ts`

Expected: FAIL because the master bank file does not exist yet.

- [ ] **Step 3: Seed the authoring guide with hard rules**

```md
# Minecraft Question Authoring Guide

- Use only Minecraft Wiki, minecraft.net, and approved technical references.
- Do not write meme or brand-history questions.
- Every record must include at least one source URL and one evidence note.
- Every record must be understandable by a player aged 8-12.
- Hard questions may be deeper, but must still be common-canon.
```

- [ ] **Step 4: Seed the first 120 approved master records**

```json
[
  {
    "id": "survival-basics-easy-health-hunger-001",
    "ageBand": "8-12",
    "canonScope": "common-canon",
    "categoryId": "minecraft",
    "clusterId": "health-hunger-safety",
    "correctAnswer": "Bread",
    "difficulty": "easy",
    "distractors": ["Stone", "Stick", "Sand"],
    "explanationEn": "Bread is a common food item that restores hunger.",
    "isActive": true,
    "promptEn": "Which item can restore hunger when a player eats it?",
    "reviewStatus": "approved",
    "sourceVersion": "minecraft-v2",
    "sources": [
      {
        "accessedAt": "2026-04-19",
        "evidenceNote": "minecraft.net survival basics and common in-game food knowledge",
        "title": "How to survive your first day | Minecraft",
        "type": "official-article",
        "url": "https://www.minecraft.net/it-it/article/how-survive-your-first-day"
      }
    ],
    "tags": ["food", "survival", "hunger"],
    "topicId": "survival-basics",
    "translationStatus": "not-started",
    "versionGated": false
  }
]
```

Distribute the full `120` as:

- `5` approved records for each of the `24` topic-difficulty pairs

- [ ] **Step 5: Run focused verification**

Run: `npm test -- tests/content-master-validator.test.ts && npx tsx scripts/validate-master-question-program.ts && npx tsx scripts/lint-question-duplicates.ts`

Expected: PASS with `120` approved common-canon records.

- [ ] **Step 6: Commit**

```bash
git add content/minecraft/minecraft-master-bank.v2.json docs/content/minecraft-question-authoring-guide.md tests/content-master-validator.test.ts
git commit -m "feat: seed first 120 minecraft master questions"
```

## Task 7: Expand The Bank To 360 Approved Records

**Files:**
- Modify: `content/minecraft/minecraft-master-bank.v2.json`
- Test: `tests/content-master-validator.test.ts`

- [ ] **Step 1: Raise the milestone test from 120 to 360 in a second assertion**

```ts
test('wave two expands the approved master bank to 360 records', () => {
  const bank = JSON.parse(
    readFileSync(new URL('../content/minecraft/minecraft-master-bank.v2.json', import.meta.url), 'utf8')
  );

  assert.equal(bank.length, 360);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/content-master-validator.test.ts`

Expected: FAIL because the bank still contains only `120` records.

- [ ] **Step 3: Extend the bank to 360 approved records**

Use the slot blueprint to bring each topic-difficulty pair from `5` records to `15` records:

- `24` topic-difficulty pairs
- `15` approved records each
- total `360`

Example id shape:

```json
{
  "id": "mobs-and-combat-medium-hostile-mobs-011",
  "topicId": "mobs-and-combat",
  "difficulty": "medium",
  "clusterId": "hostile-mobs"
}
```

- [ ] **Step 4: Re-run the lint and validation suite**

Run: `npm test -- tests/content-master-validator.test.ts && npx tsx scripts/validate-master-question-program.ts && npx tsx scripts/lint-question-duplicates.ts`

Expected: PASS with `360` approved records and no duplicate-prompt failures.

- [ ] **Step 5: Commit**

```bash
git add content/minecraft/minecraft-master-bank.v2.json tests/content-master-validator.test.ts
git commit -m "feat: expand minecraft master bank to 360 records"
```

## Task 8: Expand The Bank To The Full 1080-Question Program

**Files:**
- Modify: `content/minecraft/minecraft-master-bank.v2.json`
- Modify: `tests/content-master-validator.test.ts`
- Modify: `docs/content/minecraft-question-authoring-guide.md`

- [ ] **Step 1: Add the final target assertion**

```ts
test('final milestone reaches 1080 approved master records', () => {
  const bank = JSON.parse(
    readFileSync(new URL('../content/minecraft/minecraft-master-bank.v2.json', import.meta.url), 'utf8')
  );

  assert.equal(bank.length, 1080);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/content-master-validator.test.ts`

Expected: FAIL because the bank still contains `360` records.

- [ ] **Step 3: Fill the remaining slot blueprint quotas**

Bring every topic-difficulty pair to the full `45` records:

- `24` topic-difficulty pairs
- `45` records each
- total `1080`

Final quota formula:

```ts
const expectedTotal = 8 * 3 * 45;
```

- [ ] **Step 4: Add final editorial instructions for the full-bank phase**

```md
## Full-Bank Phase Rules

- No topic-difficulty pair may exceed 45 active records.
- No cluster may exceed 15 records inside a topic-difficulty pair.
- Any record with unresolved factual ambiguity must be marked rejected, not left active.
- Any Java-only or Bedrock-only fact must be version-gated or excluded from common-canon.
```

- [ ] **Step 5: Run the full program verification**

Run:

```bash
npm test -- tests/content-master-model.test.ts tests/content-master-validator.test.ts tests/content-duplicate-lint.test.ts tests/content-export-pipeline.test.ts
npx tsx scripts/validate-master-question-program.ts
npx tsx scripts/lint-question-duplicates.ts
npx tsx scripts/build-translation-worklist.ts
npx tsx scripts/export-master-question-packs.ts --out /tmp/master-packs.json
```

Expected: PASS with a validated `1080`-record master bank and exportable runtime payload.

- [ ] **Step 6: Commit**

```bash
git add content/minecraft/minecraft-master-bank.v2.json docs/content/minecraft-question-authoring-guide.md tests/content-master-validator.test.ts
git commit -m "feat: complete 1080-question minecraft master program"
```

## Self-Review

- Spec coverage: this plan covers the master schema, source register, slot blueprint, validators, duplicate linting, export tooling, first-wave seed, `360` milestone, and final `1080` milestone.
- Red-flag scan: no unresolved filler markers or cross-task shorthand remain.
- Type consistency: the plan uses the same topic ids, canon scopes, review statuses, and `1080` target throughout.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-19-minemind-minecraft-question-program.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
