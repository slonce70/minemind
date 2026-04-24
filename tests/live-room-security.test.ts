import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  assertQuestionBelongsToRound,
  filterSubmissionsForRoundQuestions,
} from '../supabase/functions/_shared/round-questions.ts';

test('submit-answer guard rejects questions outside the active round', () => {
  assert.doesNotThrow(() =>
    assertQuestionBelongsToRound({
      questionId: 'q-2',
      roundQuestionIds: ['q-1', 'q-2', 'q-3'],
    })
  );

  assert.throws(
    () =>
      assertQuestionBelongsToRound({
        questionId: 'q-outside',
        roundQuestionIds: ['q-1', 'q-2', 'q-3'],
      }),
    /Question does not belong to this round/
  );
});

test('finalize-round ignores legacy submissions for non-round questions', () => {
  const filtered = filterSubmissionsForRoundQuestions(
    [
      { player_id: 'p1', question_id: 'q-1', selected_option: 0, time_left_ms: 1000 },
      { player_id: 'p1', question_id: 'q-outside', selected_option: 1, time_left_ms: 18000 },
      { player_id: 'p2', question_id: 'q-2', selected_option: 2, time_left_ms: 2000 },
    ],
    ['q-1', 'q-2']
  );

  assert.deepEqual(
    filtered.map((entry) => entry.question_id),
    ['q-1', 'q-2']
  );
});

test('edge functions wire the round-question guard before scoring', () => {
  const submitAnswerSource = readFileSync(
    new URL('../supabase/functions/submit-answer/index.ts', import.meta.url),
    'utf8'
  );
  const finalizeRoundSource = readFileSync(
    new URL('../supabase/functions/finalize-round/index.ts', import.meta.url),
    'utf8'
  );

  assert.match(submitAnswerSource, /select\('id, room_id, question_ids'\)/);
  assert.match(submitAnswerSource, /assertQuestionBelongsToRound\(/);
  assert.match(submitAnswerSource, /\.in\('id', round\.question_ids\)/);
  assert.match(finalizeRoundSource, /filterSubmissionsForRoundQuestions\(/);
  assert.match(finalizeRoundSource, /const validSubmissions = /);
  assert.match(finalizeRoundSource, /validSubmissions\.length < expectedSubmissions/);
});
