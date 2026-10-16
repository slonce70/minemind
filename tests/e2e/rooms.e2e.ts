// Room flow against a LOCAL Supabase: `supabase start`, `supabase functions serve`, then `npm run test:e2e`.
import assert from 'node:assert/strict';
import test from 'node:test';

import { adminClient, createPlayer, localStack } from './helpers';

const stack = localStack();
const admin = adminClient(stack);

test('solo round honours the difficulty and carries answers for the local reveal', async () => {
  const player = await createPlayer(stack, 'SoloOwl');
  const solo = await player.call('start-solo-round', { difficulty: 'hard', locale: 'ru' });

  assert.equal(solo.status, 200, JSON.stringify(solo.body));
  assert.equal(solo.body.difficulty, 'hard');
  assert.equal(solo.body.questions.length, 8);
  assert.ok(solo.body.questions.every((question: { correctIndex?: number; explanation?: string }) =>
    typeof question.correctIndex === 'number' && question.explanation));
});

test('players cannot read questions or write answers through PostgREST', async () => {
  const player = await createPlayer(stack, 'NosyCat');
  const read = await player.client.from('questions').select('id, correct_option').limit(5);

  assert.equal((read.data ?? []).length, 0);
  const translations = await player.client.from('question_translations').select('prompt').limit(5);
  assert.equal((translations.data ?? []).length, 0);
});

test('errors come back as codes', async () => {
  const player = await createPlayer(stack, 'LostFox');
  const missing = await player.call('join-room', { roomCode: 'ZZZZZZ' });

  assert.equal(missing.status, 404);
  assert.equal(missing.body.code, 'room_not_found');
});

test('a room round is fair: hidden answers, one answer per question, deadline, multiplier', async (t) => {
  const host = await createPlayer(stack, 'HostFox', 'en');
  const guest = await createPlayer(stack, 'GuestBee', 'ru');
  const created = await host.call('create-room', { difficulty: 'hard', locale: 'uk' });
  assert.equal(created.status, 200, JSON.stringify(created.body));
  const roomCode = created.body.room.room_code as string;

  const joined = await guest.call('join-room', { roomCode });
  assert.equal(joined.status, 200, JSON.stringify(joined.body));
  await guest.call('set-room-ready', { ready: true, roomCode });

  const started = await host.call('start-room-round', { locale: 'en', roomCode });
  assert.equal(started.status, 200, JSON.stringify(started.body));
  const round = started.body.round;
  const questions = started.body.questions as Array<{ correctIndex?: number; id: string; options: string[]; prompt: string }>;

  await t.test('questions arrive without answers, with a stored deadline', () => {
    assert.equal(questions.length, 8);
    assert.ok(questions.every((question) => question.correctIndex === undefined));
    assert.equal(round.difficulty, 'hard');
    assert.ok(round.ends_at);
  });

  await t.test('a reconnecting player gets the same round', async () => {
    const resumed = await host.call('get-room-round', { locale: 'en', roomCode });
    assert.deepEqual(resumed.body.questions, questions);
  });

  const guestRound = await guest.call('get-room-round', { locale: 'ru', roomCode });
  const guestQuestions = guestRound.body.questions as typeof questions;

  await t.test('each player reads the same questions in their own language', () => {
    assert.deepEqual(
      guestQuestions.map((question) => question.id),
      questions.map((question) => question.id)
    );
    assert.ok(guestQuestions.every((question) => /[а-яё]/i.test(question.prompt)));
    assert.ok(questions.every((question) => !/[а-яё]/i.test(question.prompt)));
  });

  const { data: truth } = await admin
    .from('questions')
    .select('id, option_a, option_b, option_c, option_d, correct_option')
    .in('id', round.question_ids);
  const correctText = new Map(
    (truth ?? []).map((row) => [row.id, [row.option_a, row.option_b, row.option_c, row.option_d][row.correct_option]])
  );
  const correctDisplayIndex = (question: { id: string; options: string[] }) =>
    question.options.indexOf(correctText.get(question.id));

  await t.test('the host answers everything correctly; the server times the answers', async () => {
    for (const question of questions) {
      await host.call('submit-answer', { phase: 'open', questionId: question.id, roundId: round.id });
      const answer = await host.call('submit-answer', {
        questionId: question.id,
        roundId: round.id,
        selectedOption: correctDisplayIndex(question),
        timeLeftMs: 999_999,
      });

      assert.equal(answer.body.isCorrect, true, JSON.stringify(answer.body));
      assert.ok(answer.body.scoreDelta > 150 && answer.body.scoreDelta <= Math.round((100 + 15 * 6) * 1.5));
    }
  });

  await t.test('a second answer to the same question is refused', async () => {
    const again = await host.call('submit-answer', { questionId: questions[0].id, roundId: round.id, selectedOption: 0 });
    assert.equal(again.status, 409);
    assert.equal(again.body.code, 'answer_already_submitted');
  });

  await t.test('a wrong answer scores 0 and reveals the correct option', async () => {
    const first = questions[0];
    const wrong = (correctDisplayIndex(first) + 1) % 4;
    const answer = await guest.call('submit-answer', {
      locale: 'ru',
      questionId: first.id,
      roundId: round.id,
      selectedOption: wrong,
    });

    assert.equal(answer.status, 200, JSON.stringify(answer.body));
    assert.equal(answer.body.isCorrect, false);
    assert.equal(answer.body.scoreDelta, 0);
    assert.equal(first.options[answer.body.correctOption], correctText.get(first.id));
    assert.match(answer.body.explanation, /[а-яё]/i, 'explanation in the player language');
  });

  await t.test('answers are matched by option position, the same in every language', async () => {
    const second = guestQuestions[1];
    await guest.call('submit-answer', { phase: 'open', questionId: second.id, roundId: round.id });
    const answer = await guest.call('submit-answer', {
      locale: 'ru',
      questionId: second.id,
      roundId: round.id,
      selectedOption: correctDisplayIndex(questions[1]),
    });

    assert.equal(answer.body.isCorrect, true, JSON.stringify(answer.body));
  });

  await t.test('direct inserts into answer_submissions are refused', async () => {
    const direct = await guest.client.from('answer_submissions').insert({
      player_id: guest.id,
      question_id: questions[3].id,
      round_id: round.id,
      selected_option: 0,
      time_left_ms: 18_000,
    });
    assert.ok(direct.error);
  });

  await t.test('finalize waits for players until the deadline', async () => {
    const pending = await host.call('finalize-round', { roundId: round.id });
    assert.equal(pending.body.status, 'pending');
  });

  await admin.from('round_sessions').update({ ends_at: new Date(Date.now() - 1000).toISOString() }).eq('id', round.id);

  await t.test('after the deadline answers are refused and the round completes', async () => {
    const late = await guest.call('submit-answer', { questionId: questions[2].id, roundId: round.id, selectedOption: 0 });
    assert.equal(late.status, 409);
    assert.equal(late.body.code, 'round_over');

    const done = await guest.call('finalize-round', { roundId: round.id });
    assert.equal(done.body.status, 'completed');
    const hostRank = done.body.rankings.find((entry: { player_id: string }) => entry.player_id === host.id);
    const guestRank = done.body.rankings.find((entry: { player_id: string }) => entry.player_id === guest.id);

    assert.equal(hostRank.correct_count, 8);
    assert.ok(hostRank.score >= 8 * 150, `hard multiplier applied (${hostRank.score})`);
    assert.equal(guestRank.correct_count, 1);
  });
});
