# MineMind Audit Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the confirmed audit findings from the 2026-06-07 read-only audit and leave the project with a consistent content gate, release gate, documentation set, and maintainability follow-up record.

**Architecture:** Keep runtime behavior unchanged. First make the master content schema match the existing master bank and exporter contract, then wire that validation into release checks, then update stale docs and record reviewed React Doctor/classroom risks without suppressing analyzer output blindly.

**Tech Stack:** Expo SDK 55, React Native 0.83, TypeScript 5.9, Node test runner through `tsx --test`, Zod 4, Supabase Edge Functions, Deno checks, React Doctor.

---

## Scope And Order

This plan intentionally avoids a broad refactor. The audit found one confirmed failing gate, several stale docs, and a set of maintainability diagnostics that need triage before code changes. Execute in this order:

1. Repair the master content schema contract.
2. Promote the repaired content validation into release validation.
3. Refresh stale content and internal testing docs.
4. Record React Doctor triage with evidence.
5. Add classroom LAN production-readiness evidence requirements.
6. Run the final verification suite.

## File Structure

- `src/features/content/master-types.ts` defines TypeScript shape for authoring-time master question records.
- `src/features/content/master-content-validator.ts` defines the Zod schema for the master content program.
- `tests/content-master-validator.test.ts` proves the schema accepts export-ready localized master records and still rejects source-less records.
- `package.json` exposes content validation as a named script and includes it in release validation.
- `tests/app-shell.test.ts` protects the release script wiring.
- `README.md`, `docs/06-content-system.md`, `docs/09-test-plan.md`, and `docs/13-internal-testing-checklist.md` describe the current gates and content count.
- `docs/14-maintainability-triage.md` records current React Doctor findings, evidence, classification, and next probes.

## Task 1: Make Master Content Schema Accept Localized Records

**Files:**
- Modify: `tests/content-master-validator.test.ts`
- Modify: `src/features/content/master-types.ts`
- Modify: `src/features/content/master-content-validator.ts`

- [ ] **Step 1: Write the failing localized master schema test**

Insert this test in `tests/content-master-validator.test.ts` after the existing `master question program rejects records without sources` test:

```ts
test('master question program accepts localized export-ready records', () => {
  const validated = validateMasterQuestionProgram({
    sourceRegister: [
      {
        accessedAt: '2026-04-19',
        canonScope: 'common-canon',
        id: 'wiki-food',
        notes: 'Food source reference for hunger recovery questions.',
        title: 'Food - Minecraft Wiki',
        topics: ['survival-basics'],
        type: 'wiki',
        url: 'https://minecraft.wiki/w/Food',
      },
    ],
    slotBlueprint: [
      {
        clusterId: 'health-hunger-safety',
        difficulty: 'easy',
        targetCount: 15,
        topicId: 'survival-basics',
      },
    ],
    masterBank: [
      {
        ageBand: '8-12',
        canonScope: 'common-canon',
        categoryId: 'minecraft',
        clusterId: 'health-hunger-safety',
        correctAnswer: 'Bread',
        difficulty: 'easy',
        distractors: ['Stone', 'Sand', 'Stick'],
        explanationEn: 'Bread is a food item that restores hunger.',
        id: 'bread-restores-hunger',
        isActive: true,
        localized: {
          en: {
            explanation: 'Bread is a food item that restores hunger.',
            options: ['Bread', 'Stone', 'Sand', 'Stick'],
            prompt: 'Which item restores hunger?',
          },
          uk: {
            explanation: 'Хліб є їжею, яка відновлює голод.',
            options: ['Хліб', 'Камінь', 'Пісок', 'Палиця'],
            prompt: 'Який предмет відновлює голод?',
          },
        },
        promptEn: 'Which item restores hunger?',
        reviewStatus: 'approved',
        sourceVersion: 'minecraft-v2',
        sources: [
          {
            accessedAt: '2026-04-19',
            evidenceNote: 'Food reference for bread and hunger restoration.',
            title: 'Food - Minecraft Wiki',
            type: 'wiki',
            url: 'https://minecraft.wiki/w/Food',
          },
        ],
        tags: ['food'],
        topicId: 'survival-basics',
        translationStatus: 'complete',
        versionGated: false,
      },
    ],
  });

  assert.equal(validated.masterBank[0].localized.uk.options[0], 'Хліб');
});
```

- [ ] **Step 2: Run the focused test and confirm the failure**

Run:

```bash
npx tsx --test tests/content-master-validator.test.ts
```

Expected: FAIL with a Zod error containing `Unrecognized key: "localized"`.

- [ ] **Step 3: Add localized payload types**

In `src/features/content/master-types.ts`, add this type after `QuestionSourceRecord`:

```ts
export type MasterLocalizedPayload = {
  explanation: string;
  options: [string, string, string, string];
  prompt: string;
};
```

Then add this property to `MasterQuestionRecord` between `isActive` and `notes`:

```ts
  localized: {
    en: MasterLocalizedPayload;
    uk: MasterLocalizedPayload;
    ru?: MasterLocalizedPayload;
  };
```

- [ ] **Step 4: Extend the Zod schema**

In `src/features/content/master-content-validator.ts`, add this schema after `slotBlueprintEntrySchema`:

```ts
const localizedMasterPayloadSchema = z.strictObject({
  explanation: z.string().trim().min(1),
  options: z.tuple([
    z.string().trim().min(1),
    z.string().trim().min(1),
    z.string().trim().min(1),
    z.string().trim().min(1),
  ]),
  prompt: z.string().trim().min(1),
});
```

Then add this property to `masterQuestionRecordSchema` between `isActive` and `notes`:

```ts
  localized: z.strictObject({
    en: localizedMasterPayloadSchema,
    uk: localizedMasterPayloadSchema,
    ru: localizedMasterPayloadSchema.optional(),
  }),
```

- [ ] **Step 5: Verify content schema and standalone master validator**

Run:

```bash
npx tsx --test tests/content-master-validator.test.ts
npx tsx scripts/validate-master-question-program.ts
```

Expected:

```text
tests/content-master-validator.test.ts: all tests pass
Validated master question program with 26 source entries, 72 slot records, and 360 master question record(s).
```

- [ ] **Step 6: Commit Task 1**

```bash
git add src/features/content/master-types.ts src/features/content/master-content-validator.ts tests/content-master-validator.test.ts
git commit -m "fix: align master content schema with localized records"
```

## Task 2: Add Content Validation To The Release Gate

**Files:**
- Modify: `package.json`
- Modify: `tests/app-shell.test.ts`

- [ ] **Step 1: Write the failing release-script wiring test**

Insert this test in `tests/app-shell.test.ts` after `release validation enforces exported web bundle budgets`:

```ts
test('release validation runs the full content authoring gate', () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  ) as {
    scripts: Record<string, string>;
  };

  assert.equal(
    packageJson.scripts['validate:content'],
    'npx tsx scripts/validate-question-bank.ts && npx tsx scripts/validate-master-question-program.ts && npx tsx scripts/lint-question-duplicates.ts'
  );
  assert.match(packageJson.scripts['validate:release'], /npm run validate:content/);
  assert.ok(
    packageJson.scripts['validate:release'].indexOf('npm run validate:content') <
      packageJson.scripts['validate:release'].indexOf('npm run doctor:expo')
  );
});
```

- [ ] **Step 2: Run the focused test and confirm the failure**

Run:

```bash
npx tsx --test tests/app-shell.test.ts
```

Expected: FAIL because `validate:content` is missing.

- [ ] **Step 3: Update package scripts**

In `package.json`, replace the scripts block lines for `check:edge`, `validate`, and `validate:release` with this exact block:

```json
    "check:edge": "node scripts/check-edge-functions.mjs",
    "validate:content": "npx tsx scripts/validate-question-bank.ts && npx tsx scripts/validate-master-question-program.ts && npx tsx scripts/lint-question-duplicates.ts",
    "validate": "npm test && npm run typecheck && npm run export:web",
    "validate:release": "npm test && npm run typecheck && npm run validate:content && npm run doctor:expo && npm run audit:security && npm run check:edge && npm run smoke:web-export && npm run check:web-budget"
```

- [ ] **Step 4: Verify script wiring and content gate**

Run:

```bash
npx tsx --test tests/app-shell.test.ts
npm run validate:content
```

Expected:

```text
tests/app-shell.test.ts: all tests pass
Validated 360 Minecraft question record(s) from content/minecraft/minecraft-question-bank.v1.json
Validated master question program with 26 source entries, 72 slot records, and 360 master question record(s).
Duplicate lint passed for 360 master question record(s).
```

- [ ] **Step 5: Commit Task 2**

```bash
git add package.json tests/app-shell.test.ts
git commit -m "chore: include content authoring gate in release validation"
```

## Task 3: Refresh Stale Content And Testing Documentation

**Files:**
- Modify: `README.md`
- Modify: `docs/06-content-system.md`
- Modify: `docs/09-test-plan.md`
- Modify: `docs/13-internal-testing-checklist.md`

- [ ] **Step 1: Update content system status**

Replace `docs/06-content-system.md` lines 3-8 with:

```md
## Launch Content
- одна категорія: `Minecraft`
- три мови: `uk`, `en`, `ru`
- базовий тон: дружній, енергійний, без токсичності
- поточний runtime bank: `360` валідованих записів у `content/minecraft/minecraft-question-bank.v1.json`
- master content program: `360` approved localized records today, з target-моделлю `1080` records у slot blueprint
```

- [ ] **Step 2: Update editorial workflow commands**

Replace `docs/06-content-system.md` lines 22-27 with:

```md
## Editorial Workflow
- авторинг іде через master JSON bank у `content/minecraft/minecraft-master-bank.v2.json`
- `npm run validate:content` перевіряє runtime bank, master program schema, і duplicate lint
- `npx tsx scripts/export-master-question-packs.ts --out content/minecraft/minecraft-question-bank.v1.json` синхронізує runtime bank з localized master records
- `npm run validate:release` запускає content gate разом із tests, typecheck, Expo Doctor, security audit, Edge Function check, web smoke, і bundle budget
- для backend path готуємо `question_packs` і `questions` у Supabase
- canonical source лишається в repo, навіть якщо згодом з'явиться CSV/JSON import workflow
```

- [ ] **Step 3: Update internal testing validation commands**

Replace `docs/13-internal-testing-checklist.md` lines 9-13 with:

```md
## Validation Commands
- `npm test`
- `npm run typecheck`
- `npm run validate:content`
- `npm run check:edge`
- `npm run smoke:web-export`
- `npm run check:web-budget`
- `npm run validate:release`
```

- [ ] **Step 4: Update README command list**

In `README.md`, add this bullet after `npm run typecheck`:

```md
- `npm run validate:content`
```

- [ ] **Step 5: Verify docs mention the current gate and no stale 60-record status remains**

Run:

```bash
rg -n "60 active|60` актив|milestone A: `60|validate:content|360" README.md docs/06-content-system.md docs/09-test-plan.md docs/13-internal-testing-checklist.md
```

Expected:

```text
No matches for stale 60-record status.
Matches for validate:content and 360 in README.md or docs.
```

If `rg` prints stale 60-record status lines, replace those lines with the current `360` runtime bank wording from Step 1 and rerun the command.

- [ ] **Step 6: Commit Task 3**

```bash
git add README.md docs/06-content-system.md docs/09-test-plan.md docs/13-internal-testing-checklist.md
git commit -m "docs: refresh content and testing gates"
```

## Task 4: Record React Doctor Triage Without Suppressing Findings

**Files:**
- Create: `docs/14-maintainability-triage.md`
- Modify: `docs/09-test-plan.md`

- [ ] **Step 1: Capture the current React Doctor full-scan result**

Run:

```bash
npm run doctor:react
```

Expected: React Doctor reports score around `82 / 100 Needs work` with warnings in `src/features/rooms/live-room-service.ts`, `src/features/quiz/use-solo-round.ts`, Supabase function entrypoints, and unused-export groups.

- [ ] **Step 2: Create the triage document**

Create `docs/14-maintainability-triage.md` with:

```md
# Maintainability Triage

## Latest Reviewed Scan

- Command: `npm run doctor:react`
- Baseline score: `82 / 100`
- Reviewed date: `2026-06-07`

## Classifications

| Finding | File | Classification | Evidence | Next Probe |
| --- | --- | --- | --- | --- |
| `await inside a loop` | `src/features/rooms/live-room-service.ts` | intentional polling loop | `finalizeLiveRoomRound` calls `finalize-round`, breaks on `completed`, then waits `FINALIZE_WAIT_INTERVAL_MS` before retrying. The awaits are sequential by design because each response determines whether another attempt is needed. | Keep as reviewed unless finalization UX changes. |
| `event logic handled in an effect` | `src/features/quiz/use-solo-round.ts` | needs source review before editing | The flagged lines are mode-derived constants, but the surrounding hook contains result and classroom effects. Behavior is covered by room/classroom tests, yet a direct refactor may be risky. | Add focused tests before changing result publication or recovery effects. |
| `await before an early-return guard` | `supabase/functions/get-room-round/index.ts` | security-sensitive ordering | The function checks room membership before reporting whether a room has an active round. Moving the active-round guard earlier may reveal room state to non-members. | Keep membership before round-state disclosure unless product security requirements change. |
| `unused Edge Function entrypoints` | `supabase/functions/*/index.ts` | analyzer blind spot | `scripts/check-edge-functions.mjs` discovers every non-shared function directory and Deno-checks each `index.ts`. These files are invoked by Supabase, not imported by app TypeScript. | Do not delete entrypoints based on static import analysis. |
| `unused dev dependency` | `package.json` | needs package-level verification | `deno` is available during npm scripts and CI also installs Deno with `denoland/setup-deno`. The package may be redundant, but removing it changes local `npm run check:edge` behavior on machines without global Deno. | Verify `npm run check:edge` after removing the dependency in a separate dependency cleanup branch. |

## Rule

Do not suppress React Doctor findings globally. Confirm each finding from source code, add a focused regression test when behavior can change, then make the smallest behavior-preserving edit.
```

- [ ] **Step 3: Link triage from the test plan**

Append this section to `docs/09-test-plan.md`:

```md
### React Doctor maintainability triage

Use `npm run doctor:react` for full-repository maintainability review and `npm run doctor:react:diff` before PR handoff. Current reviewed classifications live in `docs/14-maintainability-triage.md`; do not delete Supabase Edge Function entrypoints or change live-room finalization polling based only on static analyzer output.
```

- [ ] **Step 4: Verify the triage document has concrete file references**

Run:

```bash
rg -n "live-room-service|use-solo-round|get-room-round|check-edge-functions|doctor:react" docs/14-maintainability-triage.md docs/09-test-plan.md
```

Expected: matches in both docs files for React Doctor command and reviewed file paths.

- [ ] **Step 5: Commit Task 4**

```bash
git add docs/14-maintainability-triage.md docs/09-test-plan.md
git commit -m "docs: record maintainability triage from audit"
```

## Task 5: Add Classroom LAN Production-Readiness Evidence Checklist

**Files:**
- Modify: `docs/13-internal-testing-checklist.md`
- Modify: `docs/10-release-plan.md`

- [ ] **Step 1: Add classroom LAN checks to internal testing**

Append this section to `docs/13-internal-testing-checklist.md`:

```md
## Classroom LAN Evidence

- Host device creates a classroom session on Android dev-client build.
- Second physical device joins through QR invite on the same LAN or hotspot.
- Guest ready state appears on host within one second after tapping ready.
- Host starts a classroom round and guest receives the same question IDs in the same order.
- Guest submits the round and host waits until all participants have submitted.
- Host publishes final results and guest lands on results without manual refresh.
- Repeat the flow once after closing and reopening the guest app.
- Record devices, OS versions, network type, and observed failures in the test notes for the release candidate.
```

- [ ] **Step 2: Add release-plan gate for classroom production claims**

Append this bullet to `docs/10-release-plan.md` under `## Before Internal Testing`:

```md
- classroom LAN режим не описувати як production-ready, доки `docs/13-internal-testing-checklist.md` не має записаних результатів для мінімум двох фізичних пристроїв
```

- [ ] **Step 3: Verify release docs contain classroom evidence wording**

Run:

```bash
rg -n "Classroom LAN Evidence|production-ready|двох фізичних пристроїв" docs/13-internal-testing-checklist.md docs/10-release-plan.md
```

Expected: one section match in `docs/13-internal-testing-checklist.md` and one release gate match in `docs/10-release-plan.md`.

- [ ] **Step 4: Commit Task 5**

```bash
git add docs/13-internal-testing-checklist.md docs/10-release-plan.md
git commit -m "docs: add classroom lan readiness evidence gate"
```

## Task 6: Final Verification

**Files:**
- No source edits in this task.

- [ ] **Step 1: Run the focused gates first**

Run:

```bash
npm run validate:content
npm test
npm run typecheck
npm run check:edge
npm run check:web-budget
```

Expected:

```text
validate:content passes for runtime bank, master program, and duplicate lint.
tests pass with 163 or more passing tests.
typecheck exits with code 0.
Deno checked 11 Supabase Edge Function entrypoint(s).
Web entry bundle, full export, and question illustrations are within budget.
```

- [ ] **Step 2: Run release validation**

Run:

```bash
npm run validate:release
```

Expected: pass. This command exports web assets and runs the production-style route smoke.

- [ ] **Step 3: Run React Doctor diff**

Run:

```bash
npm run doctor:react:diff
```

Expected: no new diff-specific issues. A full-scan score around `82 / 100` is acceptable for this plan because Task 4 records the current reviewed baseline.

- [ ] **Step 4: Check the working tree**

Run:

```bash
git status --short
```

Expected: no unstaged files after all task commits.

## Self-Review

Spec coverage:

- Confirmed content validator failure: covered by Tasks 1 and 2.
- Release gate consistency: covered by Task 2 and Task 6.
- Documentation drift around content count and validation commands: covered by Task 3.
- React Doctor findings: covered by Task 4 without deleting dynamically invoked files.
- Classroom LAN production-readiness limit: covered by Task 5.

Placeholder scan:

- This plan contains no deferred implementation markers.
- Every code-changing task includes exact code snippets and exact commands.

Type consistency:

- `MasterLocalizedPayload` is defined before `MasterQuestionRecord` uses it.
- The Zod schema uses the same `en`, `uk`, optional `ru`, `prompt`, `explanation`, and four-option tuple shape as `scripts/export-master-question-packs.ts`.
