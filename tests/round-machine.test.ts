import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { initialRoundState, roundReducer, type RoundAction, type RoundState } from '../src/features/quiz/round/round-machine';

const questions = ['q1', 'q2', 'q3'].map((id) => ({ id, options: ['a', 'b', 'c', 'd'], prompt: id }));

function run(actions: RoundAction[], state: RoundState = initialRoundState) {
  return actions.reduce(roundReducer, state);
}

const load = (awaitsVerdict = false, answers?: RoundState['answerMap']): RoundAction => ({
  answers,
  awaitsVerdict,
  questions,
  timeLimit: 3,
  type: 'load',
});

test('the countdown ends in an unanswered question, decided inside the machine', () => {
  const state = run([load(), { type: 'tick' }, { type: 'tick' }]);
  assert.equal(state.timeLeft, 1);
  assert.equal(state.isRevealed, false);

  const timedOut = roundReducer(state, { type: 'tick' });
  assert.equal(timedOut.timeLeft, 0);
  assert.equal(timedOut.isRevealed, true);
  assert.deepEqual(timedOut.answerMap.q1, { selectedIndex: -1, timeLeft: 0 });
  // Ticks after the reveal change nothing.
  assert.equal(roundReducer(timedOut, { type: 'tick' }), timedOut);
});

test('remote modes queue the answer for their adapter and merge the verdict', () => {
  const answered = run([load(true), { optionIndex: 2, timeLeft: 2, type: 'answer' }]);
  assert.deepEqual(answered.pendingAnswer, { optionIndex: 2, questionId: 'q1', timeLeft: 2 });
  assert.equal(answered.isSubmittingAnswer, true);

  const judged = run(
    [{ type: 'answer-sent' }, { questionId: 'q1', type: 'verdict', verdict: { correctIndex: 1, isCorrect: false } }],
    answered
  );
  assert.equal(judged.pendingAnswer, null);
  assert.equal(judged.isSubmittingAnswer, false);
  assert.deepEqual(judged.answerMap.q1, { correctIndex: 1, isCorrect: false, selectedIndex: 2, timeLeft: 2 });

  // A second tap on a revealed question is ignored.
  assert.equal(roundReducer(judged, { optionIndex: 0, timeLeft: 1, type: 'answer' }), judged);
});

test('local modes never queue answers', () => {
  assert.equal(run([load(false), { optionIndex: 0, timeLeft: 3, type: 'answer' }]).pendingAnswer, null);
});

test('next question resets the timer and the selection; the last question stays put', () => {
  const second = run([load(), { optionIndex: 0, timeLeft: 2, type: 'answer' }, { type: 'next' }]);
  assert.equal(second.currentIndex, 1);
  assert.equal(second.timeLeft, 3);
  assert.equal(second.isRevealed, false);
  assert.equal(second.selectedIndex, null);

  const last = run([{ type: 'next' }, { type: 'next' }], second);
  assert.equal(last.currentIndex, 2);
});

test('reconnecting restores answers and continues at the first open question', () => {
  const state = run([load(true, { q1: { correctIndex: 0, isCorrect: true, selectedIndex: 0, timeLeft: 2 } })]);
  assert.equal(state.currentIndex, 1);
  assert.equal(state.isRevealed, false);
  assert.equal(state.answerMap.q1.isCorrect, true);
});

test('round hook keeps side effects out of state updates', () => {
  const source = readFileSync(new URL('../src/features/quiz/use-solo-round.ts', import.meta.url), 'utf8');

  assert.match(source, /setInterval\(\(\) => dispatch\(\{ type: 'tick' \}\), 1000\)/);
  assert.doesNotMatch(source, /setTimeLeft\(\(value\)/);
});

test('timeline phases: countdown, question, answer and standings, then over', async () => {
  const { describeTimeline } = await import('../src/features/quiz/round/timeline');
  const startedAt = new Date('2026-10-16T10:00:00.000Z');
  const at = (time: string) =>
    describeTimeline({ difficulty: 'hard', now: new Date(`2026-10-16T${time}Z`), questionCount: 2, startedAt });

  assert.deepEqual(at('10:00:01.500'), { kind: 'lead-in', secondsLeft: 4 });
  assert.deepEqual(at('10:00:05.000'), { index: 0, kind: 'question', secondsLeft: 15 });
  assert.deepEqual(at('10:00:21.000'), { index: 0, kind: 'between', secondsLeft: 9 });
  assert.deepEqual(at('10:00:30.000'), { index: 1, kind: 'question', secondsLeft: 15 });
  assert.deepEqual(at('10:00:46.000'), { index: 1, kind: 'between', secondsLeft: 2 });
  assert.deepEqual(at('10:00:48.000'), { kind: 'over' });
});

test('the server timeline moves the round and closes unanswered questions', () => {
  const loaded = run([{ answers: undefined, awaitsVerdict: true, questions: [], timeLimit: 15, type: 'load' }]);
  const firstOpen = roundReducer(loaded, { index: 0, isClosed: false, questions: questions.slice(0, 1), timeLeft: 12, type: 'timeline' });
  assert.equal(firstOpen.timeLeft, 12);
  assert.equal(firstOpen.isRevealed, false);

  const closed = roundReducer(firstOpen, { index: 0, isClosed: true, questions: questions.slice(0, 1), timeLeft: 0, type: 'timeline' });
  assert.deepEqual(closed.answerMap.q1, { selectedIndex: -1, timeLeft: 0 });
  assert.deepEqual(closed.pendingAnswer, { optionIndex: -1, questionId: 'q1', timeLeft: 0 });

  const second = roundReducer(
    { ...closed, pendingAnswer: null },
    { index: 1, isClosed: false, questions: questions.slice(0, 2), timeLeft: 15, type: 'timeline' }
  );
  assert.equal(second.currentIndex, 1);
  assert.equal(second.isRevealed, false);
  assert.equal(second.selectedIndex, null);
});
