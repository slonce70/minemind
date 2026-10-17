import assert from 'node:assert/strict';
import test from 'node:test';

import { adminClient, createPlayer, localStack } from './helpers';

const stack = localStack();
const admin = adminClient(stack);

async function statsFor(contentId: string) {
  const { data } = await admin.from('question_stats').select('*').eq('content_id', contentId).maybeSingle();
  return data ?? { attempts: 0, correct: 0, timed_answers: 0, answer_ms_total: 0 };
}

test('solo answer reports add up per question and ignore unknown ids', async () => {
  const player = await createPlayer(stack, 'StatsKid');
  const { data: questions } = await admin.from('questions').select('content_id').not('content_id', 'is', null).limit(2);
  const [first, second] = (questions ?? []).map((row) => row.content_id as string);
  const before = [await statsFor(first), await statsFor(second)];

  const response = await player.call('report-answers', {
    answers: [
      { answerMs: 4000, correct: true, questionId: first },
      { answerMs: 999_999, correct: false, questionId: second },
      { answerMs: null, correct: false, questionId: first },
      { answerMs: 1000, correct: true, questionId: 'not-a-question' },
    ],
  });
  assert.equal(response.status, 200, JSON.stringify(response.body));

  const after = [await statsFor(first), await statsFor(second)];
  assert.equal(after[0].attempts - before[0].attempts, 2);
  assert.equal(after[0].correct - before[0].correct, 1);
  assert.equal(after[0].timed_answers - before[0].timed_answers, 1);
  assert.equal(Number(after[0].answer_ms_total) - Number(before[0].answer_ms_total), 4000);
  assert.equal(Number(after[1].answer_ms_total) - Number(before[1].answer_ms_total), 30000, 'times are clamped');
  assert.equal(await statsFor('not-a-question').then((row) => row.attempts), 0);

  const { data: leaked } = await player.client.from('question_stats').select('*').limit(1);
  assert.deepEqual(leaked ?? [], [], 'players cannot read the statistics');

  const tooMany = await player.call('report-answers', { answers: Array.from({ length: 21 }, () => ({ correct: true, questionId: first })) });
  assert.equal(tooMany.status, 400);
});
