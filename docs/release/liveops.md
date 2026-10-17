# LiveOps: questions after launch

The bank lives in `content/minecraft/minecraft-master-bank.v2.json` (source of truth). The app's
bundled bank (`minecraft-question-bank.v1.json`) and the database seed (`supabase/seed.sql`) are
generated from it with `npm run export:content`; CI checks they match (`content` job).

## Adding a pack of questions
1. Write the new questions as a JSON array of master records (template below) in any file.
   - `id`: kebab-case, unique, describes the fact (`sun-rises-in-east`).
   - `localized.en.options` = `[correctAnswer, ...distractors]`; uk and ru in the same order. True/false: two options, "True" first.
   - Official in-game names for uk/ru (the game's language files), plausible distractors, explanation ≤ 2 sentences.
   - `sources`: at least one minecraft.wiki page (or official article) with `accessedAt` and a short `evidenceNote`.
   - `verifiedForVersion`: the game version you checked (Java and Bedrock); `versionGated: true` if the fact changed recently or exists only since a recent update.
   - Avoid facts that differ between Java and Bedrock, or say so in the prompt.
   - Picture and recipe questions: `kind`, `media` and `optionIcons` use item ids from `src/features/ui/item-sprites.ts`.
2. Check it: `npx tsx scripts/add-question-pack.ts my-pack.json` (schema, quotas, lint, duplicates, versions).
3. Add it: `npx tsx scripts/add-question-pack.ts my-pack.json --write` (appends, re-exports, validates).
4. `npm test`, commit, open a PR. After merge: apply `supabase/seed.sql` to the hosted project (rooms
   read questions from the database) and publish an OTA update for solo play (`ota-updates.md`).

## After a game update
1. `npx tsx scripts/audit-game-version.ts --target 1.22 > review.md` — version-gated questions verified on
   an older version (add `--all` to list every question not yet checked on 1.22).
2. Re-check each fact on minecraft.wiki (changelog of the update first). Fix or deactivate (`isActive: false`) what changed.
3. Mark the ones you checked: `npx tsx scripts/audit-game-version.ts --target 1.22 --confirm id1,id2,...`.
4. `npm run export:content`, commit, reseed, OTA.

## Player reports
- In the app: "Something wrong?" under every answer (solo, classroom and rooms). The reason comes from a
  fixed list (no free text), stored in `question_reports` (RLS: no client access; rate limit 10/hour).
- Weekly: `SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npx tsx scripts/list-question-reports.ts --days 7`.
- Outside the app: GitHub issue template "Question error" (`.github/ISSUE_TEMPLATE/question-error.yml`).

## Difficulty
- Answer statistics accumulate in `question_stats`. Once questions have ~30 answers:
  `npx tsx scripts/suggest-difficulty.ts` proposes moving questions between easy/medium/hard.

## Record template
```json
{
  "ageBand": "8-12",
  "canonScope": "common-canon",
  "categoryId": "minecraft",
  "clusterId": "spawn-night-shelter",
  "correctAnswer": "East",
  "difficulty": "easy",
  "distractors": [
    "West",
    "North",
    "South"
  ],
  "explanationEn": "The sun rises in the east and sets in the west, so it can help you find your way.",
  "id": "sun-rises-in-east",
  "isActive": true,
  "localized": {
    "en": {
      "prompt": "In which direction does the sun rise in the game?",
      "explanation": "The sun rises in the east and sets in the west, so it can help you find your way.",
      "options": [
        "East",
        "West",
        "North",
        "South"
      ]
    },
    "uk": {
      "prompt": "З якого боку сходить сонце в грі?",
      "explanation": "Сонце сходить на сході й заходить на заході, тож за ним можна орієнтуватися.",
      "options": [
        "Схід",
        "Захід",
        "Північ",
        "Південь"
      ]
    },
    "ru": {
      "prompt": "С какой стороны встаёт солнце в игре?",
      "explanation": "Солнце встаёт на востоке и садится на западе, поэтому по нему можно ориентироваться.",
      "options": [
        "Восток",
        "Запад",
        "Север",
        "Юг"
      ]
    }
  },
  "promptEn": "In which direction does the sun rise in the game?",
  "reviewStatus": "approved",
  "sourceVersion": "minecraft-v3-wave5",
  "sources": [
    {
      "accessedAt": "2026-10-17",
      "evidenceNote": "The sun rises in the east and sets in the west.",
      "title": "Daylight cycle - Minecraft Wiki",
      "type": "wiki",
      "url": "https://minecraft.wiki/w/Daylight_cycle"
    }
  ],
  "tags": [
    "day-night",
    "sun",
    "directions"
  ],
  "topicId": "survival-basics",
  "translationStatus": "complete",
  "versionGated": false,
  "verifiedForVersion": "1.21"
}
```
