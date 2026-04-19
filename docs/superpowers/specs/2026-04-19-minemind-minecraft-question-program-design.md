# MineMind Minecraft Question Program Design

## Status

Self-approved design based on explicit user instruction to choose the recommended approach and proceed without waiting for additional review gates.

## Problem

`MineMind` currently ships with only `60` active Minecraft question records in [content/minecraft/minecraft-question-bank.v1.json](~/Documents/Work/minecraft_victorine/content/minecraft/minecraft-question-bank.v1.json). That is enough for prototype validation, but not enough for repeat play, trustworthy difficulty progression, classroom replay, or future online rooms.

The current bank is also optimized for shipping a small localized set, not for building and maintaining a `1000+` factual question library. The schema does not capture source provenance, canon scope, editorial status, duplicate clustering, or translation workflow state. That makes it too easy to produce content that is individually valid but operationally hard to trust at scale.

The user asked for a production-grade path to `1000+` Minecraft questions, with research, real in-game facts, and a full rollout plan. The correct answer is not “generate a thousand questions quickly.” The correct answer is to build a content program that can safely produce, review, ship, and maintain a thousand questions.

## Decisions

These decisions are fixed for this program:

- Canon model: `Minecraft common canon`
- Scope: `in-game only`
- Authoring format: `4-option multiple choice`
- Authoring language: `English master-bank`
- Delivery strategy: `source-grounded hybrid pipeline`
- Target: `1080` approved English master records as the first true `1000+` bank milestone

This excludes:

- meme lore, Herobrine, and fandom myths
- creator history and brand-history trivia
- edition-specific edge cases in the main bank unless explicitly version-gated
- true/false, image questions, and multi-answer questions in this wave

## Why 1080 Instead Of “1000”

`1080` is not an arbitrary vanity number. It creates a clean, maintainable matrix:

- `8` topic groups
- `3` difficulty levels
- `45` approved questions per topic per difficulty

That gives:

- `8 x 3 x 45 = 1080`

This matrix is large enough to support replay and room variety, while still being structured enough for editorial review, quota tracking, and content health metrics.

## Current State In The Repo

The repo already contains a useful starting point:

- localized question bank shape in [src/features/content/types.ts](~/Documents/Work/minecraft_victorine/src/features/content/types.ts)
- schema validation in [src/features/content/content-validator.ts](~/Documents/Work/minecraft_victorine/src/features/content/content-validator.ts)
- bank validation and export scripts in [scripts/validate-question-bank.ts](~/Documents/Work/minecraft_victorine/scripts/validate-question-bank.ts) and [scripts/export-question-packs.ts](~/Documents/Work/minecraft_victorine/scripts/export-question-packs.ts)
- editorial guidance in [docs/content/minecraft-content-guide.md](~/Documents/Work/minecraft_victorine/docs/content/minecraft-content-guide.md)
- a prior expansion spec that targeted `360` approved questions in [docs/superpowers/specs/2026-04-18-minemind-expansion-design.md](~/Documents/Work/minecraft_victorine/docs/superpowers/specs/2026-04-18-minemind-expansion-design.md)

The new program should extend this system, not replace it blindly.

## Research Summary

### Best Factual Sources

The most trustworthy source stack for this project is:

1. `Minecraft Wiki`
   Use for stable in-game facts, entity lists, block lists, biome lists, structure basics, and commonly accepted gameplay behavior.
   Key source entry points:
   - [Minecraft Wiki](https://minecraft.wiki/)
   - [Block](https://minecraft.wiki/w/Block)
   - [Mob](https://minecraft.wiki/w/Mob)
   - [Biome](https://minecraft.wiki/w/Biome)

2. `minecraft.net`
   Use for official phrasing around crafting basics, survival basics, and major update additions that may matter for version-gated content.
   Useful source entry points:
   - [How to craft](https://www.minecraft.net/article/how-craft)
   - [How to survive your first day](https://www.minecraft.net/it-it/article/how-survive-your-first-day)
   - [Minecraft Java Edition 1.21](https://www.minecraft.net/nb-no/article/minecraft-java-edition-1-21)
   - [Minecraft Java Edition 1.21.4](https://www.minecraft.net/de-de/article/minecraft-java-edition-1-21-4)

3. `Microsoft Learn / Minecraft Creator Docs`
   Use only for technical terminology, biome tag references, and creator-facing definitions when they help disambiguate naming or categorization.
   Example:
   - [Biome filter documentation](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/entityreference/examples/definitions/nestedtables/biome_filter?view=minecraft-bedrock-stable)

### What Not To Use As Source-Of-Truth

Public quiz sites and fandom quiz pages exist in volume, but they are not reliable enough to author from directly. They are useful only for:

- benchmarking how broad the public idea of “Minecraft trivia” is
- spotting overused question shapes
- understanding where low-quality trivia drifts into meme or history territory

They must not be treated as primary factual sources.

## Production Goal

Build a content system that can produce and maintain:

- `1080` approved English master-bank records
- with source provenance on every record
- with automated validation and duplicate checks
- with clear editorial review states
- with controlled translation as a separate downstream wave

The program should support two output tracks:

1. `Master authoring track`
   English canonical records with provenance and editorial metadata.

2. `Runtime/export track`
   Localized, slimmed-down question packs for the app and backend.

## Topic Architecture

The topic layer stays aligned with the current controlled topic ids:

1. `survival-basics`
2. `crafting-and-smelting`
3. `blocks-and-building`
4. `mobs-and-combat`
5. `farming-and-animals`
6. `villagers-and-enchanting`
7. `biomes-and-structures`
8. `nether-end-and-redstone`

Each topic gets `45` questions per difficulty. To keep that from collapsing into repetition, each topic should be split into three internal concept clusters with `15` questions per cluster per difficulty.

### Recommended Internal Cluster Model

`survival-basics`
- health, hunger, and safety
- spawn, beds, and day-night survival
- movement, hazards, and utility items

`crafting-and-smelting`
- crafting stations and recipe fundamentals
- tools, fuel, and furnace behavior
- resource conversion and progression basics

`blocks-and-building`
- natural materials and block families
- block behavior and placement logic
- building utility blocks and structure-friendly materials

`mobs-and-combat`
- passive and neutral mob knowledge
- hostile mob behavior and danger patterns
- combat tools, defensive play, and safe encounters

`farming-and-animals`
- crops and growth requirements
- breeding, food, and animal use
- renewable food and farm loops

`villagers-and-enchanting`
- villager professions and workstations
- trading basics and emerald economy
- enchanting table, books, lapis, and upgrade flow

`biomes-and-structures`
- overworld biome recognition
- common natural and generated structures
- loot expectations and structure purpose

`nether-end-and-redstone`
- nether travel, hazards, and materials
- end progression and dragon-path basics
- simple redstone logic and common components

## Difficulty Model

The common-canon bank should not treat difficulty as “more obscure facts.” It should treat difficulty as “more game understanding.”

- `easy`
  Familiar survival, crafting, mob, and biome knowledge that many players learn early.

- `medium`
  Requires combining two common ideas, recognizing context, or understanding a mechanic beyond the tutorial stage.

- `hard`
  Still common-canon, but more specific, comparison-based, or progression-aware. Hard mode should still avoid edition-trap or hyper-technical trivia.

## Data Model

The current runtime shape is too thin for authoring at this scale. The program should introduce a master-bank record distinct from the localized export record.

### Master Record

Recommended authoring shape:

```ts
type QuestionSourceRecord = {
  accessedAt: string;
  evidenceNote: string;
  title: string;
  type: 'wiki' | 'official-article' | 'official-release-note' | 'technical-reference';
  url: string;
};

type MasterQuestionReviewStatus =
  | 'draft'
  | 'auto-validated'
  | 'editor-reviewed'
  | 'approved'
  | 'rejected';

type CanonScope = 'common-canon' | 'java-only' | 'bedrock-only';

type MasterQuestionRecord = {
  ageBand: '8-12';
  canonScope: CanonScope;
  categoryId: 'minecraft';
  clusterId: string;
  correctAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  distractors: [string, string, string];
  explanationEn: string;
  id: string;
  isActive: boolean;
  notes?: string;
  promptEn: string;
  reviewNotes?: string;
  reviewStatus: MasterQuestionReviewStatus;
  sourceVersion: string;
  sources: [QuestionSourceRecord, ...QuestionSourceRecord[]];
  tags: string[];
  topicId:
    | 'survival-basics'
    | 'crafting-and-smelting'
    | 'blocks-and-building'
    | 'mobs-and-combat'
    | 'farming-and-animals'
    | 'villagers-and-enchanting'
    | 'biomes-and-structures'
    | 'nether-end-and-redstone';
  translationStatus: 'not-started' | 'in-progress' | 'complete';
  versionGated: boolean;
};
```

### Export Record

The runtime export can continue to look close to the current localized record shape:

- localized `prompt`
- localized `options`
- `correctIndex`
- localized `explanation`
- topic, difficulty, tags, and active state

The important change is that runtime records become derived artifacts, not the authoring source of truth.

## Authoring Pipeline

The recommended pipeline has six stages.

### Stage 1: Source Register

Build a canonical source register grouped by topic and concept cluster.

This is where factual grounding starts. Every source entry should answer:

- what topic it supports
- what facts it covers
- whether it is common-canon safe
- whether it is version-sensitive

### Stage 2: Slot Blueprint

Before writing questions, define the `1080` content slots:

- topic
- cluster
- difficulty
- target count
- banned overlaps

This prevents overproduction in easy topics and underproduction in harder ones.

### Stage 3: Draft Authoring

Write English master questions in batches against slot assignments, not freeform.

Each draft must include:

- prompt
- one correct answer
- three plausible distractors
- short explanation
- at least one citation

### Stage 4: Automated Validation

Automated checks should reject:

- schema violations
- duplicate ids
- duplicate prompts
- duplicate answer sets
- repeated stem templates above a threshold
- banned wording patterns
- missing sources
- records marked `common-canon` but carrying edition-only language

### Stage 5: Editorial Review

Human review should verify:

- factual correctness
- readability for `8-12`
- distractor quality
- no trick wording
- topic fit
- difficulty fit
- no obvious repetition with nearby records

### Stage 6: Translation And Export

Only approved English master questions move to translation.

The translation wave should be controlled and separate. Translators must receive:

- canonical answer
- explanation meaning
- term glossary
- source links

## Quality Gates

Every record should pass these gates before approval:

1. `Factual grounding`
   The correct answer is supported by at least one primary source.

2. `Common-canon safety`
   The question is true for general Minecraft understanding and does not depend on narrow edition behavior unless clearly version-gated.

3. `Kid readability`
   The wording is simple, direct, and not loaded with technical phrasing.

4. `No trick wording`
   No double negatives, hidden exceptions, or “which is not” traps.

5. `Plausible distractors`
   Wrong answers should be believable but clearly wrong to a knowledgeable player.

6. `Learning value`
   The explanation should teach a real Minecraft fact in one or two short sentences.

7. `Repetition control`
   The question must not duplicate an existing concept unless it tests a meaningfully different angle.

8. `Export readiness`
   If a record is marked active, it must already be approved and safe for downstream translation/export.

## Tooling Requirements

The current validator and export scripts are a base, but the `1000+` program needs more tooling:

- `master bank validator`
- `source register validator`
- `slot blueprint validator`
- `duplicate and near-duplicate detector`
- `template overuse linter`
- `common-canon wording linter`
- `translation completeness checker`
- `runtime export builder`

## Rollout Strategy

The bank should not be treated as complete only when `1080` exists. It should ship in controlled waves.

### Wave 0: Program Foundation

- new master schema
- source register
- slot blueprint
- validation and lint scripts

### Wave 1: `120` Approved English Master Records

Goal:
- prove the end-to-end pipeline
- validate duplicate detection
- validate editorial workflow

### Wave 2: `360` Approved English Master Records

Goal:
- replace the old “large enough” target with a more reliable structured bank
- prove topic and difficulty balance

### Wave 3: `720` Approved English Master Records

Goal:
- reach strong replay depth
- start broader translation/export waves

### Wave 4: `1080` Approved English Master Records

Goal:
- complete the first true `1000+` bank
- support long replay arcs, room variety, and future ranking modes

## Risks And Mitigations

`Risk: fast generation produces factual drift`
- Mitigation: source register first, citation required per record, editorial approval gate

`Risk: too many nearly identical questions`
- Mitigation: slot blueprint plus duplicate and template linting

`Risk: Java/Bedrock confusion leaks into common-canon content`
- Mitigation: explicit `canonScope` and `versionGated` fields

`Risk: translation changes meaning of correct answers`
- Mitigation: translation comes after approval and includes source notes plus glossary

`Risk: hard mode becomes obscure trivia instead of deeper understanding`
- Mitigation: hard questions still stay within common-canon and get separate editorial difficulty review

## Success Criteria

This program is successful when:

- the repo contains a validated authoring system for a `1080`-slot Minecraft question program
- every approved question has source provenance
- duplicate and wording linting are part of the pipeline
- the team can grow from `60` to `120`, `360`, `720`, and `1080` without changing the model again
- translation becomes a downstream workflow instead of a blocker for authoring
- runtime packs remain deterministic and exportable into the current app/backend model

## Recommended Next Step

The next implementation step is not “write 1000 questions now.” It is:

1. create the master-bank schema and source register model
2. create the `1080` slot blueprint
3. build the validation/lint pipeline
4. ship the first `120` approved English master records through the full workflow

That is the production-safe path to a real `1000+` Minecraft bank instead of a large but fragile content dump.
