// Showcase data for store screenshots and the preview video: a player a week in (level 7, some cards
// and achievements) and four questions (picture, recipe, true/false, choice) with their answers.
//   npx tsx scripts/store/prepare.ts   → scripts/store/.out/{state,answers}.json
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { cardCatalog } from '../../src/features/progress/cards';
import type { MasterQuestionRecord } from '../../src/features/content/master-types';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, '.out');
const now = new Date();
const day = (offset: number) => new Date(now.getTime() - offset * 86_400_000).toISOString().slice(0, 10);
const at = now.toISOString();
const ids = ['pic-bone-dropped-by-skeleton', 'recipe-torch-missing-stick', 'tf-cooked-meat-fills-less', 'piston-pushes-blocks'];
const bank = new Map(
  (JSON.parse(readFileSync(path.join(here, '../../content/minecraft/minecraft-master-bank.v2.json'), 'utf8')) as MasterQuestionRecord[]).map(
    (record) => [record.id, record]
  )
);
const answers = Object.fromEntries(
  (['uk', 'en', 'ru'] as const).map((locale) => [locale, ids.map((id) => bank.get(id)!.localized[locale]!.options[0])])
);
const progress = {
  achievements: Object.fromEntries(
    ['first-round', 'rounds-10', 'correct-100', 'perfect-round', 'days-3', 'level-5', 'cards-10', 'challenger', 'team-player'].map((id) => [id, at])
  ),
  awardedMatchIds: [],
  cards: Object.fromEntries(
    cardCatalog
      .filter((_, index) => index % 3 !== 2)
      .slice(0, 11)
      .map((card, index) => [card.id, index % 3 === 0 ? 2 : 1])
  ),
  daily: { day: day(0), done: false, progress: 2, questId: 'rounds-3' },
  mistakes: ids,
  recentAnswers: [],
  stats: { bestStreak: 7, challenges: 1, correct: 164, matches: 27, multiplayer: 2, perfect: 2 },
  streak: { best: 5, count: 5, lastDay: day(0), lastPlayedAt: at },
  topicCorrect: { 'biomes-and-structures': 18, 'crafting-and-smelting': 26, 'mobs-and-combat': 31, 'nether-end-and-redstone': 14 },
  updatedAt: at,
  xp: 2380,
};
const state = {
  state: {
    locale: 'uk',
    profile: { avatarId: 'fox', locale: 'uk', nickname: 'СміливийЛис' },
    progress,
    recentMatches: [],
    selectedDifficulty: 'medium',
    settings: { haptics: true, music: false, sound: false },
  },
  version: 6,
};

mkdirSync(out, { recursive: true });
writeFileSync(path.join(out, 'state.json'), JSON.stringify(state));
writeFileSync(path.join(out, 'answers.json'), JSON.stringify({ answers, ids }));
console.log(`Wrote ${out}/state.json and answers.json`);
