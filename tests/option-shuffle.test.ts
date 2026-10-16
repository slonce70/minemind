import assert from 'node:assert/strict';
import test from 'node:test';

import { seededPermutation, shuffleOptions } from '../supabase/functions/_shared/game-rules';
import { buildClassroomRoundManifest } from '../src/features/classroom/classroom-session-sync';
import { loadMinecraftQuestionBank } from '../src/features/content/content-loader';
import { getSoloQuestionSet } from '../src/features/quiz/quiz-service';

test('seededPermutation is a deterministic permutation', () => {
  const first = seededPermutation(4, 'round-1:q1');

  assert.deepEqual(first, seededPermutation(4, 'round-1:q1'));
  assert.deepEqual([...first].sort(), [0, 1, 2, 3]);
});

test('shuffleOptions keeps correctIndex pointing at the same option', () => {
  for (let index = 0; index < 50; index += 1) {
    const shuffled = shuffleOptions(['a', 'b', 'c', 'd'], 2, `seed-${index}`);

    assert.equal(shuffled.options[shuffled.correctIndex], 'c');
    assert.deepEqual([...shuffled.options].sort(), ['a', 'b', 'c', 'd']);
  }
});

test('solo rounds shuffle options per round seed and keep the right answer', () => {
  const bank = new Map(loadMinecraftQuestionBank().map((record) => [record.id, record]));
  const positions = new Set<number>();

  for (let index = 0; index < 20; index += 1) {
    for (const question of getSoloQuestionSet('uk', 8, 'medium', `seed-${index}`)) {
      const record = bank.get(question.id)!;

      assert.equal(question.options[question.correctIndex!], record.options[record.correctIndex].uk);
      positions.add(question.correctIndex!);
    }
  }

  assert.deepEqual([...positions].sort(), [0, 1, 2, 3]);
  assert.deepEqual(
    getSoloQuestionSet('en', 8, 'easy', 'same-seed'),
    getSoloQuestionSet('en', 8, 'easy', 'same-seed')
  );
});

test('classroom manifest is identical for every device that builds it from the same room', () => {
  const host = buildClassroomRoundManifest({ difficulty: 'hard', locale: 'ru', roomCode: 'C12345' });
  const again = buildClassroomRoundManifest({ difficulty: 'hard', locale: 'ru', roomCode: 'C12345' });

  assert.deepEqual(host.questions.map((question) => question.options), again.questions.map((question) => question.options));
});

test('content validator flags a bank where the correct answer is almost always first', async () => {
  const { findCorrectIndexSkew } = await import('../src/features/content/content-validator');
  const skewed = Array.from({ length: 60 }, (_, index) => ({ correctIndex: index < 50 ? 0 : 1 }));
  const balanced = Array.from({ length: 60 }, (_, index) => ({ correctIndex: index % 4 }));

  assert.match(findCorrectIndexSkew(skewed) ?? '', /skewed/);
  assert.equal(findCorrectIndexSkew(balanced), null);
  assert.equal(findCorrectIndexSkew(loadMinecraftQuestionBank()), null);
});
