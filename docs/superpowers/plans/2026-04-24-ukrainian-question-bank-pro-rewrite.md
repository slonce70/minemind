# Ukrainian Question Bank Pro Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite every Ukrainian Minecraft question and answer set so Ukrainian is the primary authored language and all three difficulty modes feel meaningfully harder, with hard mode behaving like a real pro-mode quiz.

**Architecture:** `content/minecraft/minecraft-master-bank.v2.json` is the source of truth. Topic agents prepare rewrite maps by `id`; the controller applies them centrally, regenerates `content/minecraft/minecraft-question-bank.v1.json`, and strengthens tests in `tests/content-master-validator.test.ts` plus related difficulty tests.

**Tech Stack:** Expo, TypeScript, Node test runner, JSON content pipeline, `npx tsx scripts/export-master-question-packs.ts`.

---

### Difficulty Contract

**Easy / Будівничий**
- Not baby-level. Ask practical survival or recognition questions with scenario context.
- The answer should require understanding the clue, not matching a word from the prompt.
- Distractors should be plausible within Minecraft, not random objects.

**Medium / Дослідник**
- Ask about applying a mechanic, choosing the right tool/block/structure, or understanding a second-order rule.
- Use compact scenarios from real play: farms, caves, villages, Nether trips, combat prep.
- Distractors should be same-category alternatives.

**Hard / Про-режим**
- Every hard prompt starts with `Про-режим:`.
- Ask like an experienced survival, technical, or progression player: risk management, optimization, edge-case rules, route planning, farms, redstone behavior, enchantment tradeoffs.
- Avoid simple “which biome/item/mob” phrasing unless wrapped in a concrete pro scenario.

### Task 1: Topic Agent Rewrite Maps

**Files:**
- Read: `content/minecraft/minecraft-master-bank.v2.json`
- Produce scratch maps under `/tmp/minemind-rewrites/<topic>.json`

- [ ] **Step 1: Split records by topic**

Use the eight `topicId` values:
`survival-basics`, `crafting-and-smelting`, `blocks-and-building`, `mobs-and-combat`, `farming-and-animals`, `villagers-and-enchanting`, `biomes-and-structures`, `nether-end-and-redstone`.

- [ ] **Step 2: For each record, author Ukrainian copy**

Each map entry must include:

```json
{
  "id": "record-id",
  "prompt": "Ukrainian prompt",
  "options": ["Correct/localized option or distractor", "Option 2", "Option 3", "Option 4"],
  "explanation": "Ukrainian explanation"
}
```

Preserve option order from English so `correctIndex` stays valid after export.

- [ ] **Step 3: Self-check each map**

Reject entries where:
- the prompt contains the exact Ukrainian correct option;
- hard prompt does not start with `Про-режим:`;
- options are random rather than same-domain distractors;
- Ukrainian sounds translated from English instead of authored.

### Task 2: Integrate Rewrites

**Files:**
- Modify: `content/minecraft/minecraft-master-bank.v2.json`
- Modify: `content/minecraft/minecraft-question-bank.v1.json`

- [ ] **Step 1: Apply all maps to master bank**

For every map entry, replace `localized.uk.prompt`, `localized.uk.options`, and `localized.uk.explanation` on the matching master record.

- [ ] **Step 2: Regenerate runtime bank**

Run:

```bash
npx tsx scripts/export-master-question-packs.ts --out content/minecraft/minecraft-question-bank.v1.json
```

Expected: `Exported 360 runtime question record(s)`.

### Task 3: Guardrails and Verification

**Files:**
- Modify: `tests/content-master-validator.test.ts`
- Modify: `tests/quiz-service.test.ts`
- Modify if needed: `src/features/content/difficulty-config.ts`
- Modify if needed: `src/i18n/resources.ts`

- [ ] **Step 1: Keep hard-mode guardrails**

Ensure tests assert every hard Ukrainian prompt starts with `Про-режим:` and carries scenario context.

- [ ] **Step 2: Keep no-self-answer guardrails**

Ensure tests assert prompts do not include their exact correct Ukrainian option.

- [ ] **Step 3: Run full validation**

Run:

```bash
npm run validate
```

Expected: tests pass, TypeScript passes, Expo web export succeeds.

### Task 4: Browser Smoke

**Files:**
- No file edits.

- [ ] **Step 1: Start local web app**

Run:

```bash
npm run web -- --port 8081
```

- [ ] **Step 2: Verify home and hard mode in Browser Use**

Open `http://localhost:8081/home`, confirm the third mode is `Про-режим`, then start or inspect a hard solo round and confirm question copy uses pro-mode scenario language.
