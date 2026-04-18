# MineMind Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand MineMind with difficulty modes, a scalable Minecraft content system, stronger kid-facing Minecraft-inspired presentation, and explicit online-ready room architecture.

**Architecture:** Keep the current Expo Router app and redesigned shell, but add a new content domain, a stable difficulty model, themed asset surfaces, and backend-aligned room contracts. Implement this in layered phases so offline/local gameplay improves immediately while future Supabase-backed rooms become easier to evolve.

**Tech Stack:** Expo Router, React Native, TypeScript, Zustand, TanStack Query, i18next, Supabase Functions, Zod, Node test runner, local asset pipeline, JSON content validation scripts

---

## File Structure

### Existing files to modify

- `app/home.tsx`
- `app/solo.tsx`
- `app/rooms.tsx`
- `app/results.tsx`
- `src/state/app-store.ts`
- `src/features/quiz/types.ts`
- `src/features/quiz/mock-data.ts`
- `src/features/quiz/quiz-service.ts`
- `src/features/quiz/use-solo-round.ts`
- `src/features/rooms/types.ts`
- `src/features/rooms/use-room-lobby.ts`
- `src/features/home/home-view.tsx`
- `src/features/results/results-view.tsx`
- `src/features/rooms/room-lobby-view.tsx`
- `src/i18n/resources.ts`
- `src/theme/tokens.ts`
- `src/components/ui/card.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/stat-pill.tsx`
- `app.json`

### New files to create

- `src/features/content/types.ts`
- `src/features/content/difficulty-config.ts`
- `src/features/content/topic-config.ts`
- `src/features/content/content-loader.ts`
- `src/features/content/content-validator.ts`
- `src/features/content/content-selection.ts`
- `src/features/home/difficulty-selector.tsx`
- `src/features/results/result-badges.ts`
- `src/features/rooms/room-match-settings.ts`
- `src/features/ui/world-background.tsx`
- `src/features/ui/badge-chip.tsx`
- `src/features/ui/icon-map.ts`
- `src/features/ui/theme-art.ts`
- `content/minecraft/minecraft-question-bank.v1.json`
- `docs/content/minecraft-content-guide.md`
- `scripts/validate-question-bank.ts`
- `scripts/export-question-packs.ts`
- `tests/content-model.test.ts`
- `tests/content-selection.test.ts`
- `tests/difficulty-flow.test.ts`
- `tests/room-settings.test.ts`
- `tests/result-badges.test.ts`
- `tests/online-contract-shape.test.ts`

### Testing commands used throughout

- `npm test`
- `npm run typecheck`
- `npm run validate`
- `./script/build_and_run.sh --doctor`

## Task 1: Introduce Difficulty As A First-Class Product Model

**Files:**
- Modify: `src/features/quiz/types.ts`
- Modify: `src/state/app-store.ts`
- Modify: `src/features/rooms/types.ts`
- Create: `src/features/content/types.ts`
- Create: `src/features/content/difficulty-config.ts`
- Test: `tests/content-model.test.ts`

- [ ] **Step 1: Write the failing difficulty model test**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';

import { difficultyConfig } from '../src/features/content/difficulty-config';

test('difficulty config exposes stable enums and timer rules', () => {
  assert.deepEqual(Object.keys(difficultyConfig), ['easy', 'medium', 'hard']);
  assert.equal(difficultyConfig.easy.timerSeconds, 20);
  assert.equal(difficultyConfig.medium.timerSeconds, 18);
  assert.equal(difficultyConfig.hard.timerSeconds, 15);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/content-model.test.ts`

Expected: FAIL because the content domain and difficulty config do not exist yet.

- [ ] **Step 3: Add the base product model**

```ts
export type DifficultyMode = 'easy' | 'medium' | 'hard';

export type QuestionTopic =
  | 'survival'
  | 'crafting'
  | 'building'
  | 'mobs'
  | 'farming'
  | 'villagers'
  | 'biomes'
  | 'late_game';

export type DifficultyRule = {
  badgeTone: 'calm' | 'bold' | 'danger';
  id: DifficultyMode;
  scoreMultiplier: number;
  timerSeconds: number;
  translationKey: string;
};
```

```ts
export const difficultyConfig: Record<DifficultyMode, DifficultyRule> = {
  easy: { id: 'easy', timerSeconds: 20, scoreMultiplier: 1, badgeTone: 'calm', translationKey: 'difficulty.builder' },
  medium: { id: 'medium', timerSeconds: 18, scoreMultiplier: 1.1, badgeTone: 'bold', translationKey: 'difficulty.explorer' },
  hard: { id: 'hard', timerSeconds: 15, scoreMultiplier: 1.25, badgeTone: 'danger', translationKey: 'difficulty.netherPro' },
};
```

```ts
type AppState = {
  selectedDifficulty: DifficultyMode;
  setSelectedDifficulty: (difficulty: DifficultyMode) => void;
};
```

- [ ] **Step 4: Update room and result shapes**

```ts
export type ActiveRoom = {
  difficulty: DifficultyMode;
  roomCode: string;
  // existing fields stay here
};

export type QuizResultSummary = {
  difficulty: DifficultyMode;
  // existing fields stay here
};
```

- [ ] **Step 5: Run focused verification**

Run: `npm test -- tests/content-model.test.ts && npm run typecheck`

Expected: PASS with clean type generation around the new model.

- [ ] **Step 6: Commit**

```bash
git add src/features/quiz/types.ts src/state/app-store.ts src/features/rooms/types.ts src/features/content/types.ts src/features/content/difficulty-config.ts tests/content-model.test.ts
git commit -m "feat: add difficulty model foundation"
```

## Task 2: Build A Scalable Minecraft Question Bank And Validation Pipeline

**Files:**
- Create: `content/minecraft/minecraft-question-bank.v1.json`
- Create: `src/features/content/content-validator.ts`
- Create: `scripts/validate-question-bank.ts`
- Create: `docs/content/minecraft-content-guide.md`
- Test: `tests/content-model.test.ts`

- [ ] **Step 1: Write the failing schema test**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';

import { validateQuestionBank } from '../src/features/content/content-validator';

test('question bank validator accepts a fully tagged Minecraft record', () => {
  const result = validateQuestionBank([
    {
      id: 'minecraft-survival-easy-001',
      categoryId: 'minecraft',
      topicId: 'survival',
      difficulty: 'easy',
      ageBand: '8-12',
      prompt: { uk: 'Що робить верстак?', en: 'What does a crafting table do?', ru: 'Что делает верстак?' },
      options: [
        { uk: 'A', en: 'A', ru: 'A' },
        { uk: 'B', en: 'B', ru: 'B' },
        { uk: 'C', en: 'C', ru: 'C' },
        { uk: 'D', en: 'D', ru: 'D' }
      ],
      correctIndex: 1,
      explanation: { uk: 'Факт', en: 'Fact', ru: 'Факт' },
      tags: ['starter'],
      sourceVersion: 'v1',
      isActive: true
    }
  ]);

  assert.equal(result.ok, true);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/content-model.test.ts`

Expected: FAIL because the validator and extended schema are not implemented.

- [ ] **Step 3: Implement the content validator**

```ts
import { z } from 'zod';

const localizedStringSchema = z.object({
  uk: z.string().min(1),
  en: z.string().min(1),
  ru: z.string().min(1),
});

const questionRecordSchema = z.object({
  id: z.string().min(1),
  categoryId: z.literal('minecraft'),
  topicId: z.enum(['survival', 'crafting', 'building', 'mobs', 'farming', 'villagers', 'biomes', 'late_game']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  ageBand: z.literal('8-12'),
  prompt: localizedStringSchema,
  options: z.array(localizedStringSchema).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: localizedStringSchema,
  tags: z.array(z.string().min(1)).min(1),
  sourceVersion: z.string().min(1),
  isActive: z.boolean(),
});
```

```ts
export function validateQuestionBank(input: unknown) {
  const result = z.array(questionRecordSchema).safeParse(input);
  return result.success ? { ok: true, data: result.data } : { ok: false, issues: result.error.issues };
}
```

- [ ] **Step 4: Create the first canonical question bank shell**

```json
[
  {
    "id": "minecraft-survival-easy-001",
    "categoryId": "minecraft",
    "topicId": "survival",
    "difficulty": "easy",
    "ageBand": "8-12",
    "prompt": {
      "uk": "Який блок відкриває сітку 3x3 для більшості рецептів?",
      "en": "Which block unlocks the 3x3 grid for most recipes?",
      "ru": "Какой блок открывает сетку 3x3 для большинства рецептов?"
    },
    "options": [
      { "uk": "Піч", "en": "Furnace", "ru": "Печь" },
      { "uk": "Верстак", "en": "Crafting Table", "ru": "Верстак" },
      { "uk": "Скриня", "en": "Chest", "ru": "Сундук" },
      { "uk": "Ліжко", "en": "Bed", "ru": "Кровать" }
    ],
    "correctIndex": 1,
    "explanation": {
      "uk": "Верстак відкриває сітку 3x3, тому без нього багато рецептів недоступні.",
      "en": "The crafting table unlocks the 3x3 grid, so many recipes stay unavailable without it.",
      "ru": "Верстак открывает сетку 3x3, поэтому без него многие рецепты недоступны."
    },
    "tags": ["starter", "crafting", "core-loop"],
    "sourceVersion": "v1",
    "isActive": true
  }
]
```

- [ ] **Step 5: Add validation tooling**

```ts
import fs from 'node:fs/promises';
import { validateQuestionBank } from '../src/features/content/content-validator';

const raw = await fs.readFile(new URL('../content/minecraft/minecraft-question-bank.v1.json', import.meta.url), 'utf8');
const data = JSON.parse(raw);
const result = validateQuestionBank(data);

if (!result.ok) {
  console.error(result.issues);
  process.exit(1);
}

console.log(`Validated ${result.data.length} question records.`);
```

- [ ] **Step 6: Document the editorial rules**

Write `docs/content/minecraft-content-guide.md` with:

- target audience definition
- banned question patterns
- difficulty writing rules
- topic matrix
- review checklist

- [ ] **Step 7: Run focused verification**

Run: `npm test -- tests/content-model.test.ts && npx tsx scripts/validate-question-bank.ts`

Expected: PASS, with validator output showing at least the seeded records parsed correctly.

- [ ] **Step 8: Commit**

```bash
git add content/minecraft/minecraft-question-bank.v1.json src/features/content/content-validator.ts scripts/validate-question-bank.ts docs/content/minecraft-content-guide.md tests/content-model.test.ts
git commit -m "feat: add scalable Minecraft content schema"
```

## Task 3: Add Content Selection Logic For Difficulty, Topic Spread, And Repeatability

**Files:**
- Create: `src/features/content/topic-config.ts`
- Create: `src/features/content/content-loader.ts`
- Create: `src/features/content/content-selection.ts`
- Modify: `src/features/quiz/quiz-service.ts`
- Test: `tests/content-selection.test.ts`

- [ ] **Step 1: Write the failing content selection test**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';

import { selectQuestionRound } from '../src/features/content/content-selection';

test('round selection returns 8 questions for the requested difficulty', () => {
  const round = selectQuestionRound({
    bank: sampleQuestionBank,
    count: 8,
    difficulty: 'medium',
    seed: 'alpha',
  });

  assert.equal(round.length, 8);
  assert.ok(round.every((entry) => entry.difficulty === 'medium'));
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/content-selection.test.ts`

Expected: FAIL because round selection does not exist yet.

- [ ] **Step 3: Implement topic-aware round assembly**

```ts
export function selectQuestionRound(params: {
  bank: ContentQuestionRecord[];
  count: number;
  difficulty: DifficultyMode;
  seed: string;
}) {
  const candidates = params.bank.filter((entry) => entry.difficulty === params.difficulty && entry.isActive);
  const grouped = groupByTopic(candidates);
  const seededTopics = seededTopicOrder(Object.keys(grouped), params.seed);
  return takeDistributedQuestions(grouped, seededTopics, params.count);
}
```

```ts
export const minecraftTopicConfig = {
  survival: { icon: 'pickaxe', priority: 1 },
  crafting: { icon: 'table', priority: 1 },
  building: { icon: 'block', priority: 1 },
  mobs: { icon: 'sword', priority: 1 },
  farming: { icon: 'wheat', priority: 1 },
  villagers: { icon: 'emerald', priority: 1 },
  biomes: { icon: 'map', priority: 1 },
  late_game: { icon: 'portal', priority: 1 },
};
```

- [ ] **Step 4: Adapt the quiz service**

```ts
export function getSoloQuestionSet(locale: AppLocale, count: number, difficulty: DifficultyMode) {
  const records = loadMinecraftQuestionBank();
  const round = selectQuestionRound({
    bank: records,
    count,
    difficulty,
    seed: `${locale}-${difficulty}-${Date.now().toString().slice(-6)}`,
  });
  return round.map((entry) => localizeQuestion(entry, locale));
}
```

- [ ] **Step 5: Run focused verification**

Run: `npm test -- tests/content-selection.test.ts tests/quiz-service.test.ts && npm run typecheck`

Expected: PASS, with stable round count and correct difficulty filtering.

- [ ] **Step 6: Commit**

```bash
git add src/features/content/topic-config.ts src/features/content/content-loader.ts src/features/content/content-selection.ts src/features/quiz/quiz-service.ts tests/content-selection.test.ts tests/quiz-service.test.ts
git commit -m "feat: add content selection engine"
```

## Task 4: Expand The Question Bank In Approved Batches

**Files:**
- Modify: `content/minecraft/minecraft-question-bank.v1.json`
- Modify: `docs/content/minecraft-content-guide.md`
- Create: `scripts/export-question-packs.ts`

- [ ] **Step 1: Define the batch matrix in docs**

Add this matrix to `docs/content/minecraft-content-guide.md`:

```md
| Topic | Easy | Medium | Hard | Target |
| --- | ---: | ---: | ---: | ---: |
| Survival Basics | 15 | 15 | 15 | 45 |
| Crafting And Smelting | 15 | 15 | 15 | 45 |
| Blocks And Building | 15 | 15 | 15 | 45 |
| Mobs And Combat | 15 | 15 | 15 | 45 |
| Farming And Animals | 15 | 15 | 15 | 45 |
| Villagers And Enchanting | 15 | 15 | 15 | 45 |
| Biomes And Structures | 15 | 15 | 15 | 45 |
| Nether, End, And Redstone | 15 | 15 | 15 | 45 |
```

- [ ] **Step 2: Populate the bank to the first milestone**

Expand `content/minecraft/minecraft-question-bank.v1.json` until it contains at least:

- `60` approved records for milestone A
- all three difficulties represented
- at least four different topics represented

- [ ] **Step 3: Add an exporter for future pack slicing**

```ts
import fs from 'node:fs/promises';

const bank = JSON.parse(await fs.readFile('content/minecraft/minecraft-question-bank.v1.json', 'utf8'));
const active = bank.filter((entry) => entry.isActive);
const byDifficulty = Object.groupBy(active, (entry) => entry.difficulty);

await fs.writeFile('content/minecraft/minecraft-question-packs.summary.json', JSON.stringify(byDifficulty, null, 2));
console.log(`Exported ${active.length} active questions into pack summary slices.`);
```

- [ ] **Step 4: Validate the bank after each content batch**

Run: `npx tsx scripts/validate-question-bank.ts`

Expected: PASS with the new question count printed to stdout.

- [ ] **Step 5: Commit**

```bash
git add content/minecraft/minecraft-question-bank.v1.json docs/content/minecraft-content-guide.md scripts/export-question-packs.ts
git commit -m "feat: expand Minecraft question bank milestone A"
```

## Task 5: Add Difficulty Selection To Home, Solo, Rooms, And Results

**Files:**
- Create: `src/features/home/difficulty-selector.tsx`
- Modify: `app/home.tsx`
- Modify: `app/solo.tsx`
- Modify: `app/rooms.tsx`
- Modify: `app/results.tsx`
- Modify: `src/features/home/home-view.tsx`
- Modify: `src/features/results/results-view.tsx`
- Modify: `src/features/rooms/room-lobby-view.tsx`
- Modify: `src/features/quiz/use-solo-round.ts`
- Modify: `src/features/rooms/use-room-lobby.ts`
- Modify: `src/i18n/resources.ts`
- Test: `tests/difficulty-flow.test.ts`
- Test: `tests/room-settings.test.ts`

- [ ] **Step 1: Write the failing UX flow test**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';

import { difficultyConfig } from '../src/features/content/difficulty-config';

test('difficulty labels exist in all supported locales', () => {
  assert.ok(difficultyConfig.easy.translationKey);
  assert.ok(difficultyConfig.medium.translationKey);
  assert.ok(difficultyConfig.hard.translationKey);
});
```

- [ ] **Step 2: Run the test to verify it fails or stays incomplete**

Run: `npm test -- tests/difficulty-flow.test.ts`

Expected: FAIL until the selector strings and flow wiring are present.

- [ ] **Step 3: Add the reusable difficulty selector**

```tsx
export function DifficultySelector(props: {
  onSelect: (difficulty: DifficultyMode) => void;
  selectedDifficulty: DifficultyMode;
  strings: Record<DifficultyMode, string>;
}) {
  return (
    <View style={styles.row}>
      {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
        <SecondaryButton
          key={difficulty}
          label={props.strings[difficulty]}
          onPress={() => props.onSelect(difficulty)}
          selected={props.selectedDifficulty === difficulty}
        />
      ))}
    </View>
  );
}
```

- [ ] **Step 4: Wire the selector into the player journey**

Implementation targets:

- `home`: choose current solo difficulty
- `rooms`: host-visible room difficulty
- `solo`: use selected difficulty when loading the round
- `results`: show badge text for the cleared difficulty

```ts
const selectedDifficulty = useAppStore((state) => state.selectedDifficulty);
const setSelectedDifficulty = useAppStore((state) => state.setSelectedDifficulty);
```

```ts
const nextQuestions = getSoloQuestionSet(locale, 8, selectedDifficulty);
const timerLimit = difficultyConfig[selectedDifficulty].timerSeconds;
```

- [ ] **Step 5: Add localized strings**

```ts
difficulty: {
  builder: 'Builder',
  explorer: 'Explorer',
  netherPro: 'Nether Pro',
  label: 'Difficulty',
}
```

- [ ] **Step 6: Run focused verification**

Run: `npm test -- tests/difficulty-flow.test.ts tests/room-settings.test.ts && npm run typecheck`

Expected: PASS, and routes compile with difficulty-aware state.

- [ ] **Step 7: Commit**

```bash
git add src/features/home/difficulty-selector.tsx app/home.tsx app/solo.tsx app/rooms.tsx app/results.tsx src/features/home/home-view.tsx src/features/results/results-view.tsx src/features/rooms/room-lobby-view.tsx src/features/quiz/use-solo-round.ts src/features/rooms/use-room-lobby.ts src/i18n/resources.ts tests/difficulty-flow.test.ts tests/room-settings.test.ts
git commit -m "feat: wire difficulty through player flows"
```

## Task 6: Build The Minecraft-Inspired Visual Fantasy Layer

**Files:**
- Create: `src/features/ui/world-background.tsx`
- Create: `src/features/ui/badge-chip.tsx`
- Create: `src/features/ui/icon-map.ts`
- Create: `src/features/ui/theme-art.ts`
- Modify: `src/theme/tokens.ts`
- Modify: `src/components/ui/card.tsx`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/stat-pill.tsx`
- Modify: `src/features/home/home-view.tsx`
- Modify: `src/features/results/results-view.tsx`
- Modify: `src/features/rooms/room-lobby-view.tsx`
- Modify: `app.json`
- Test: `tests/app-shell.test.ts`
- Test: `tests/result-badges.test.ts`

- [ ] **Step 1: Write the failing badge test**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';

import { getResultBadgeModel } from '../src/features/results/result-badges';

test('hard mode win gets a distinct result badge', () => {
  const badge = getResultBadgeModel({ difficulty: 'hard', perfectRound: true });
  assert.equal(badge.id, 'nether-pro-perfect');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/result-badges.test.ts`

Expected: FAIL because badge models and themed surfaces do not exist yet.

- [ ] **Step 3: Add the themed visual primitives**

```tsx
export function WorldBackground(props: { variant: 'overworld' | 'cave' | 'nether' | 'end'; children: React.ReactNode }) {
  return <View style={[styles.base, themeArt[props.variant]]}>{props.children}</View>;
}
```

```ts
export const themeArt = {
  overworld: { backgroundColor: '#13251A' },
  cave: { backgroundColor: '#121A24' },
  nether: { backgroundColor: '#2D1417' },
  end: { backgroundColor: '#1B1630' },
};
```

```ts
export const iconMap = {
  pickaxe: '⛏',
  sword: '🗡',
  block: '◼',
  portal: '◫',
  trophy: '🏆',
};
```

- [ ] **Step 4: Apply the new art direction to core screens**

Implementation targets:

- hero backgrounds on home/results
- badge chips on difficulty and results
- chunkier cards and stronger CTA contrast
- app icon metadata refresh in `app.json`

- [ ] **Step 5: Run focused verification**

Run: `npm test -- tests/app-shell.test.ts tests/result-badges.test.ts && npm run typecheck`

Expected: PASS, with theme and badge utilities compiling cleanly.

- [ ] **Step 6: Commit**

```bash
git add src/features/ui/world-background.tsx src/features/ui/badge-chip.tsx src/features/ui/icon-map.ts src/features/ui/theme-art.ts src/theme/tokens.ts src/components/ui/card.tsx src/components/ui/button.tsx src/components/ui/stat-pill.tsx src/features/home/home-view.tsx src/features/results/results-view.tsx src/features/rooms/room-lobby-view.tsx app.json tests/app-shell.test.ts tests/result-badges.test.ts
git commit -m "feat: add Minecraft-inspired fantasy layer"
```

## Task 7: Make Solo And Results More Reward-Driven By Difficulty

**Files:**
- Create: `src/features/results/result-badges.ts`
- Modify: `src/features/quiz/use-solo-round.ts`
- Modify: `src/features/results/results-view.tsx`
- Modify: `src/features/quiz/quiz-service.ts`
- Modify: `src/i18n/resources.ts`
- Test: `tests/result-badges.test.ts`
- Test: `tests/solo-round.test.ts`

- [ ] **Step 1: Add a failing score behavior test**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';

import { buildQuizResult } from '../src/features/quiz/quiz-service';

test('hard mode applies the configured score multiplier', () => {
  const result = buildQuizResult(sampleQuestions, sampleAnswers, {
    difficulty: 'hard',
    mode: 'solo',
  });

  assert.ok(result.score > 800);
  assert.equal(result.difficulty, 'hard');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/solo-round.test.ts tests/result-badges.test.ts`

Expected: FAIL because result models do not yet apply difficulty-aware reward framing.

- [ ] **Step 3: Update scoring and result metadata**

```ts
const multiplier = difficultyConfig[options.difficulty ?? 'medium'].scoreMultiplier;
const score = Math.round((baseScore + speedBonus) * multiplier);
```

```ts
export function getResultBadgeModel(input: { difficulty: DifficultyMode; perfectRound: boolean }) {
  if (input.difficulty === 'hard' && input.perfectRound) {
    return { id: 'nether-pro-perfect', labelKey: 'results.badges.netherPerfect' };
  }
  return { id: 'standard-clear', labelKey: 'results.badges.standardClear' };
}
```

- [ ] **Step 4: Update results UX**

Implementation targets:

- show difficulty badge in result hero
- show “perfect round” or “streak” badge when earned
- keep replay CTA dominant

- [ ] **Step 5: Run focused verification**

Run: `npm test -- tests/solo-round.test.ts tests/result-badges.test.ts && npm run typecheck`

Expected: PASS, with reward framing tied to difficulty.

- [ ] **Step 6: Commit**

```bash
git add src/features/results/result-badges.ts src/features/quiz/use-solo-round.ts src/features/results/results-view.tsx src/features/quiz/quiz-service.ts src/i18n/resources.ts tests/result-badges.test.ts tests/solo-round.test.ts
git commit -m "feat: add difficulty-aware rewards and badges"
```

## Task 8: Align Rooms With Future Online Match Settings

**Files:**
- Create: `src/features/rooms/room-match-settings.ts`
- Modify: `src/features/rooms/types.ts`
- Modify: `src/features/rooms/use-room-lobby.ts`
- Modify: `src/features/rooms/room-lobby-view.tsx`
- Modify: `src/state/app-store.ts`
- Test: `tests/room-settings.test.ts`
- Test: `tests/online-contract-shape.test.ts`

- [ ] **Step 1: Write the failing room settings test**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';

import { createDefaultRoomMatchSettings } from '../src/features/rooms/room-match-settings';

test('room match settings default to medium difficulty and 8 questions', () => {
  const settings = createDefaultRoomMatchSettings();
  assert.equal(settings.difficulty, 'medium');
  assert.equal(settings.questionCount, 8);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/room-settings.test.ts`

Expected: FAIL because room match settings are not explicit yet.

- [ ] **Step 3: Create the room settings model**

```ts
export type RoomMatchSettings = {
  contentPackVersion: string;
  difficulty: DifficultyMode;
  questionCount: 8;
  topicMode: 'mixed';
};

export function createDefaultRoomMatchSettings(): RoomMatchSettings {
  return {
    contentPackVersion: 'minecraft-v1',
    difficulty: 'medium',
    questionCount: 8,
    topicMode: 'mixed',
  };
}
```

- [ ] **Step 4: Attach settings to room lifecycle**

Implementation targets:

- `ActiveRoom` includes `settings`
- room creation seeds default settings
- host sees the settings in lobby
- local round creation reads from `settings.difficulty`

- [ ] **Step 5: Run focused verification**

Run: `npm test -- tests/room-settings.test.ts tests/online-contract-shape.test.ts && npm run typecheck`

Expected: PASS, and local room types align with future server contracts.

- [ ] **Step 6: Commit**

```bash
git add src/features/rooms/room-match-settings.ts src/features/rooms/types.ts src/features/rooms/use-room-lobby.ts src/features/rooms/room-lobby-view.tsx src/state/app-store.ts tests/room-settings.test.ts tests/online-contract-shape.test.ts
git commit -m "feat: add room match settings foundation"
```

## Task 9: Prepare The Supabase Contract Shape For Future Content Packs And Live Rooms

**Files:**
- Modify: `src/lib/api-contracts.ts`
- Modify: `src/lib/supabase.ts`
- Modify: `src/features/rooms/use-room-lobby.ts`
- Modify: `src/features/quiz/use-solo-round.ts`
- Test: `tests/supabase-contracts.test.ts`
- Test: `tests/online-contract-shape.test.ts`

- [ ] **Step 1: Write the failing contract test**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';

import { roomStateSchema } from '../src/lib/api-contracts';

test('room state schema accepts difficulty and content pack metadata', () => {
  const parsed = roomStateSchema.parse({
    roomCode: 'AB12CD',
    status: 'lobby',
    difficulty: 'medium',
    contentPackVersion: 'minecraft-v1',
    participants: [],
  });

  assert.equal(parsed.difficulty, 'medium');
  assert.equal(parsed.contentPackVersion, 'minecraft-v1');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/supabase-contracts.test.ts tests/online-contract-shape.test.ts`

Expected: FAIL because current schemas do not carry the new online fields.

- [ ] **Step 3: Extend the API schemas**

```ts
export const roomStateSchema = z.object({
  roomCode: z.string().min(1),
  status: z.enum(['lobby', 'active', 'finalizing', 'finished']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  contentPackVersion: z.string().min(1),
  participants: z.array(roomParticipantSchema),
});
```

```ts
export const soloRoundSchema = z.object({
  difficulty: z.enum(['easy', 'medium', 'hard']),
  contentPackVersion: z.string().min(1),
  questions: z.array(questionSchema).length(8),
});
```

- [ ] **Step 4: Keep the local services compatible**

Implementation targets:

- local/demo flows fill these fields too
- room refresh and room resume continue to parse cleanly
- error copy remains child-safe

- [ ] **Step 5: Run focused verification**

Run: `npm test -- tests/supabase-contracts.test.ts tests/online-contract-shape.test.ts && npm run typecheck`

Expected: PASS, with schemas representing the future live room contract.

- [ ] **Step 6: Commit**

```bash
git add src/lib/api-contracts.ts src/lib/supabase.ts src/features/rooms/use-room-lobby.ts src/features/quiz/use-solo-round.ts tests/supabase-contracts.test.ts tests/online-contract-shape.test.ts
git commit -m "feat: align contracts with future online rooms"
```

## Task 10: Close The Planning Wave With Full Validation And Documentation

**Files:**
- Modify: `README.md`
- Modify: `docs/01-product-prd.md`
- Modify: `docs/02-game-design.md`
- Modify: `docs/06-content-system.md`
- Modify: `docs/03-architecture.md`

- [ ] **Step 1: Update product docs**

Make the docs consistent with the new design:

- PRD mentions difficulty modes
- game design explains difficulty timers and scoring
- content system explains the validated bank workflow
- architecture describes content packs and room settings

- [ ] **Step 2: Add project commands**

Update `README.md` with:

```md
- `npx tsx scripts/validate-question-bank.ts`
- `npx tsx scripts/export-question-packs.ts`
```

- [ ] **Step 3: Run the final verification set**

Run: `npm test && npm run typecheck && npm run validate && ./script/build_and_run.sh --doctor`

Expected:

- tests green
- typecheck green
- web export green
- Expo doctor green

- [ ] **Step 4: Commit**

```bash
git add README.md docs/01-product-prd.md docs/02-game-design.md docs/06-content-system.md docs/03-architecture.md
git commit -m "docs: capture expansion wave and validation workflow"
```

## Self-Review

### Spec Coverage

The plan covers all major requirements from the expansion spec:

- difficulty modes -> Tasks 1, 5, 7, 8
- large Minecraft question bank -> Tasks 2, 3, 4
- stronger Minecraft-inspired visuals -> Tasks 5, 6, 7
- future online foundation -> Tasks 8, 9, 10
- documentation and editorial workflow -> Tasks 2, 4, 10

### Placeholder Scan

No `TBD`, `TODO`, or deferred “implement later” instructions are left in this plan.

### Type Consistency

The plan consistently uses:

- `DifficultyMode`
- `RoomMatchSettings`
- `contentPackVersion`
- `topicId`
- `difficulty`

These names should remain stable during implementation.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-18-minemind-expansion-plan.md`. Two execution options:

1. Subagent-Driven (recommended) - I dispatch a fresh subagent per task, review between tasks, fast iteration

2. Inline Execution - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
