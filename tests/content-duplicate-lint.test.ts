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
