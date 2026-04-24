# Minecraft Question Authoring Guide

## Scope

- Author only `in-game` Minecraft questions for the `common-canon` bank.
- Keep the audience centered on players aged `8-12`.
- Write for learning and replay, not for tricking the player.
- Prefer facts that are stable across modern Minecraft understanding.

## Approved Sources

- `minecraft.wiki` for blocks, mobs, biomes, structures, enchanting, and redstone behavior.
- `minecraft.net` for official survival, crafting, and beginner-flow guidance.
- Approved technical references only when they clarify terminology, not when they replace player-facing sources.

## Hard Rules

- Every record must include at least one source URL and one evidence note.
- Every record must stay inside one controlled `topicId` and one `clusterId`.
- Every record must have exactly one correct answer and exactly three plausible distractors.
- No meme lore, brand history, YouTuber trivia, or off-game material.
- No “which is NOT”, no double negatives, and no hidden-exception wording.
- No edition-specific traps in `common-canon` records unless the record is explicitly version-gated.

## Difficulty Rules

- `easy`: early survival, crafting, mob, biome, or structure knowledge that many players learn quickly.
- `medium`: requires combining two familiar ideas or understanding a mechanic a little deeper.
- `hard`: still common-canon, but more progression-aware, comparison-based, or mechanically specific.

## Review Status Rules

- `draft`: newly written and not yet validated.
- `auto-validated`: schema and lint checks passed.
- `editor-reviewed`: human review finished, but the record is not yet approved for the bank.
- `approved`: safe for the master bank and eligible for translation.
- `rejected`: factually unclear, redundant, or not good enough to keep active.

## Translation Rules

- English is the authoring source of truth.
- Only `approved` English records should move into translation.
- Use the exact meaning of the English correct answer, not a looser paraphrase.
- Preserve option order across `en`, `uk`, and `ru` so export can derive a stable `correctIndex`.

## Wave-One Quotas

- Wave one target: `120` approved master records.
- Coverage target: `5` approved records for every topic-difficulty pair.
- No topic-difficulty pair should exceed `5` records in wave one.
- Reuse existing localized runtime records when they are still factual and well-shaped, but bootstrap them with explicit provenance and cluster assignments.

## Full-Bank Phase Rules

- No topic-difficulty pair may exceed `45` active records.
- No cluster may exceed `15` records inside one topic-difficulty pair.
- Any record with unresolved factual ambiguity must be rejected, not left active.
- Translation completeness must not be faked: untranslated records stay `not-started` or `in-progress`.
