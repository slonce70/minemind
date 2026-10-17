import assert from 'node:assert/strict';
import test from 'node:test';

import { loadMinecraftQuestionBank } from '../src/features/content/content-loader';
import { buildQuizResult } from '../src/features/quiz/quiz-service';
import { initialRoundState, roundReducer } from '../src/features/quiz/round/round-machine';
import {
  adaptiveMix,
  buildChallengeUrl,
  buildSoloRound,
  parseChallenge,
} from '../src/features/quiz/solo-round-builder';

const bank = loadMinecraftQuestionBank();

test('topic rounds stay in their topic', () => {
  const round = buildSoloRound({ bank, locale: 'uk', seed: 's1', spec: { difficulty: 'easy', topicId: 'mobs-and-combat', variant: 'topic' } });

  assert.equal(round.questions.length, 8);
  assert.ok(round.questions.every((question) => question.topicId === 'mobs-and-combat'));
  assert.deepEqual(round.round, { seed: 's1', soloMode: 'topic', topicId: 'mobs-and-combat' });
});

test('adaptive difficulty follows recent answers', () => {
  assert.deepEqual(adaptiveMix([]), { easy: 0, hard: 0, level: 1, medium: 8 });

  const strong = adaptiveMix(Array.from({ length: 12 }, () => ({ correct: true, difficulty: 'hard' as const })));
  const weak = adaptiveMix(Array.from({ length: 12 }, () => ({ correct: false, difficulty: 'medium' as const })));

  assert.ok(strong.hard >= 5, JSON.stringify(strong));
  assert.ok(weak.easy >= 5, JSON.stringify(weak));
  assert.equal(strong.easy + strong.medium + strong.hard, 8);

  const round = buildSoloRound({
    bank,
    locale: 'en',
    recentAnswers: Array.from({ length: 12 }, () => ({ correct: true, difficulty: 'hard' as const })),
    seed: 's2',
    spec: { variant: 'adaptive' },
  });
  assert.equal(round.questions.length, 8);
  assert.equal(round.difficulty, 'hard');
});

test('mistakes rounds replay the most recent mistakes', () => {
  const ids = bank.slice(0, 10).map((record) => record.id);
  const round = buildSoloRound({ bank, locale: 'ru', seed: 's3', spec: { questionIds: ids, variant: 'mistakes' } });

  assert.deepEqual(
    round.questions.map((question) => question.id),
    [...ids].reverse().slice(0, 8)
  );
});

test('a challenge link replays the same questions in the same order for any language', () => {
  const original = buildSoloRound({ bank, locale: 'uk', seed: 'abc', spec: { difficulty: 'hard', variant: 'classic' } });
  const url = buildChallengeUrl('https://minemind.example/', {
    correct: 6,
    difficulty: 'hard',
    from: 'Сміливий Лис',
    score: 777,
    seed: 'abc',
  });
  const challenge = parseChallenge(Object.fromEntries(new URL(url).searchParams));

  assert.ok(url.startsWith('https://minemind.example/challenge?'));
  assert.ok(challenge);

  const replay = buildSoloRound({ bank, locale: 'en', seed: 'other', spec: { challenge, variant: 'challenge' } });

  assert.deepEqual(replay.questions.map((question) => [question.id, question.correctIndex]), original.questions.map((question) => [question.id, question.correctIndex]));
  assert.deepEqual(replay.round.challenge, { from: 'Сміливий Лис', score: 777 });
  assert.equal(parseChallenge({ c: '6', d: 'hard', from: 'x', score: '-1', seed: 'abc' }), null);
  assert.equal(parseChallenge({ c: '6', d: 'insane', from: 'x', score: '5', seed: 'abc' }), null);
});

test('50/50 hides two wrong options, +time adds seconds, and both cost points', () => {
  const round = buildSoloRound({ bank, locale: 'en', seed: 's4', spec: { difficulty: 'medium', variant: 'classic' } }).questions;
  const questions = round.filter((question) => question.options.length === 4);
  let state = roundReducer(initialRoundState, {
    awaitsVerdict: false,
    lifelines: { fifty: 1, time: 1 },
    questions,
    timeLimit: 18,
    type: 'load',
  });

  state = roundReducer(state, { lifeline: 'fifty', type: 'lifeline' });
  assert.equal(state.hiddenOptions.length, 2);
  assert.ok(!state.hiddenOptions.includes(questions[0].correctIndex!));
  assert.equal(roundReducer(state, { lifeline: 'fifty', type: 'lifeline' }), state, 'no hints left');

  state = roundReducer(state, { lifeline: 'time', type: 'lifeline' });
  assert.equal(state.timeLeft, 28);

  state = roundReducer(state, { optionIndex: questions[0].correctIndex!, timeLeft: 28, type: 'answer' });
  assert.deepEqual(state.answerMap[questions[0].id].lifelines, ['fifty', 'time']);

  const withHints = buildQuizResult(questions.slice(0, 1), state.answerMap, { difficulty: 'medium', round: { soloMode: 'classic' } });
  const plain = buildQuizResult(questions.slice(0, 1), { [questions[0].id]: { selectedIndex: questions[0].correctIndex!, timeLeft: 28 } }, { difficulty: 'medium' });

  assert.equal(withHints.score, Math.round(125 / 2));
  assert.ok(plain.score > withHints.score);
  assert.equal(withHints.round?.lifelinesUsed, 2);

  const trueFalse = bank.find((record) => record.kind === 'true-false');
  if (trueFalse) {
    const [question] = buildSoloRound({ bank: [trueFalse], locale: 'en', seed: 's5', spec: { difficulty: trueFalse.difficulty, variant: 'classic' } }).questions;
    const loaded = roundReducer(initialRoundState, { awaitsVerdict: false, lifelines: { fifty: 1, time: 1 }, questions: [question], timeLimit: 18, type: 'load' });
    assert.equal(roundReducer(loaded, { lifeline: 'fifty', type: 'lifeline' }), loaded, '50/50 would give a two-option answer away');
  }
});
