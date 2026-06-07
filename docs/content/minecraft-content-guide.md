# Minecraft Content Guide

## Audience
- Primary audience: kids and early teens, roughly `8-12`
- Tone: friendly, energetic, encouraging
- Trivia style: familiar Minecraft knowledge first, deep technical lore later

## Canonical Record Shape
- `categoryId`: always `minecraft`
- `topicId`: one of the controlled topic ids below
- `difficulty`: `easy`, `medium`, or `hard`
- `ageBand`: `8-12`, `13-15`, or `16+`
- `prompt`, `options`, and `explanation`: localized objects with `uk`, `en`, and `ru`
- `options`: exactly four localized answer objects
- `correctIndex`: zero-based index into `options`
- `tags`: short editorial tags, kept lowercase and non-duplicated
- `sourceVersion`: stable pack identifier such as `v1` or `minecraft-v1`
- `isActive`: `true` only when the record is ready to ship

## Banned Patterns
- No trick questions with hidden wording.
- No double negatives or "which one is not" phrasing.
- No questions that depend on version-specific edge cases unless the record is explicitly version-gated.
- No subjective prompts like "best", "coolest", or "most fun".
- No multi-answer prompts unless the schema changes to support them.
- No toxic, scary, or griefing-forward framing.

## Difficulty Rules
- `easy`: obvious survival or crafting knowledge.
- `medium`: requires a little game understanding but still common knowledge.
- `hard`: reserved for future packs and should avoid obscure technical detail in v1.
- Match difficulty to the expected audience, not to personal expertise.

## Topic Matrix
| topicId | What It Covers | Example Questions |
| --- | --- | --- |
| `survival-basics` | health, hunger, movement, early survival | beds, torches, water buckets |
| `crafting-and-smelting` | recipes, crafting table, furnaces | tools, blocks, core recipes |
| `blocks-and-building` | block behavior and building basics | block placement, materials, structures |
| `mobs-and-combat` | hostile mobs and combat basics | creepers, skeletons, safe fighting |
| `farming-and-animals` | crops, breeding, food loops | wheat, cows, farms |
| `villagers-and-enchanting` | trading and enchantment flow | books, villagers, gear upgrades |
| `biomes-and-structures` | overworld regions and generated structures | biomes, villages, temples |
| `nether-end-and-redstone` | dimensions and simple automation | portals, end dragon, redstone circuits |

## Batch Matrix
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

## Current Bank Status
- Runtime bank: `360` active localized records in `content/minecraft/minecraft-question-bank.v1.json`.
- Master bank: `360` approved source records in `content/minecraft/minecraft-master-bank.v2.json`.
- Coverage: eight topics, three difficulties, `45` records per topic, and `120` records per difficulty.
- Next master-program target: expand toward `1080` approved source records without reducing the current localized runtime coverage.

## Review Checklist
- `id` is present, slug-like, and unique across the full question bank.
- `categoryId`, `topicId`, `difficulty`, `ageBand`, `prompt`, `options`, `correctIndex`, `explanation`, `tags`, `sourceVersion`, and `isActive` are present.
- `prompt`, `options`, and `explanation` all include `uk`, `en`, and `ru`.
- `options` has exactly four entries and `correctIndex` points at the right one.
- `tags` are specific, lowercase, and not duplicated.
- The prompt reads naturally to a player in the target age band.
- The explanation teaches something useful and stays short.
- The record is active only if it is ready to ship.
- Run `npm run validate:content` before merging content changes.
