import assert from 'node:assert/strict';
import test from 'node:test';

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

test('duplicate lint flags the same answer among the same options, except numbers', () => {
  const issues = findDuplicateQuestionRisks([
    { id: 'q1', promptEn: 'How many skulls summon the Wither?', correctAnswer: '3', distractors: ['1', '2', '4'] },
    { id: 'q2', promptEn: 'How many enchantment offers does the table show?', correctAnswer: '3', distractors: ['4', '2', '1'] },
    { id: 'q3', promptEn: 'Which tool mines stone?', correctAnswer: 'Pickaxe', distractors: ['Axe', 'Hoe', 'Shovel'] },
    { id: 'q4', promptEn: 'Which tool mines ores?', correctAnswer: 'Pickaxe', distractors: ['Shovel', 'Axe', 'Hoe'] },
    { id: 'q5', promptEn: 'Which tool strips logs?', correctAnswer: 'Axe', distractors: ['Pickaxe', 'Hoe', 'Shovel'] },
  ]);

  assert.deepEqual(issues, [{ ids: ['q3', 'q4'], kind: 'same-answer-set' }]);
});
