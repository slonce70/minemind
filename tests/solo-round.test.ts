import assert from 'node:assert/strict';
import test from 'node:test';

import { createQuizFeedbackState } from '../src/features/quiz/quiz-feedback';

test('quiz feedback shows a revealed wrong answer state', () => {
  const state = createQuizFeedbackState({
    correctIndex: 2,
    isRevealed: true,
    selectedIndex: 1,
  });

  assert.equal(state.correctIndex, 2);
  assert.equal(state.selectedState, 'wrong');
});
