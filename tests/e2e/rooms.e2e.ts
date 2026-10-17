// Room flow against a LOCAL Supabase: `supabase start`, `supabase functions serve`, then `npm run test:e2e`.
import assert from 'node:assert/strict';
import test from 'node:test';

import { adminClient, createPlayer, localStack, openQuestion } from './helpers';

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

test('a room round runs on one server timeline and stays fair', async (t) => {
  const host = await createPlayer(stack, 'HostFox', 'en');
  const guest = await createPlayer(stack, 'GuestBee', 'ru');
  const created = await host.call('create-room', { difficulty: 'hard', locale: 'en' });
  assert.equal(created.status, 200, JSON.stringify(created.body));
  const roomCode = created.body.room.room_code as string;

  const joined = await guest.call('join-room', { roomCode });
  assert.equal(joined.status, 200, JSON.stringify(joined.body));
  await guest.call('set-room-ready', { ready: true, roomCode });

  const started = await host.call('start-room-round', { locale: 'en', roomCode });
  assert.equal(started.status, 200, JSON.stringify(started.body));
  const round = started.body.round;
  type Question = { correctIndex?: number; id: string; options: string[]; prompt: string };

  await t.test('the round starts with a countdown: no question is handed out yet', () => {
    assert.equal(started.body.questions.length, 0);
    assert.equal(started.body.questionCount, 8);
    assert.equal(round.difficulty, 'hard');
    assert.ok(round.ends_at && started.body.serverNow);
  });

  await t.test('an answer before the question opens is refused', async () => {
    const early = await host.call('submit-answer', { questionId: round.question_ids[0], roundId: round.id, selectedOption: 0 });
    assert.equal(early.status, 409);
    assert.equal(early.body.code, 'question_not_open');
  });

  const { data: truth } = await admin
    .from('questions')
    .select('id, option_a, option_b, option_c, option_d, correct_option')
    .in('id', round.question_ids);
  const correctText = new Map(
    (truth ?? []).map((row) => [row.id, [row.option_a, row.option_b, row.option_c, row.option_d][row.correct_option]])
  );
  const correctDisplayIndex = (question: Question) => question.options.indexOf(correctText.get(question.id));
  const load = async (player: typeof host, locale: 'en' | 'ru') => {
    const view = await player.call('get-room-round', { locale, roomCode });
    assert.equal(view.status, 200, JSON.stringify(view.body));
    return view.body as { myAnswers: unknown[]; questions: Question[]; standings: Array<Record<string, any>> };
  };

  await openQuestion(admin, round, 0);
  const hostView = await load(host, 'en');
  const guestView = await load(guest, 'ru');

  await t.test('only the open question is handed out, without answers, in each player language', () => {
    assert.equal(hostView.questions.length, 1);
    assert.equal(hostView.questions[0].correctIndex, undefined);
    assert.equal(guestView.questions[0].id, hostView.questions[0].id);
    assert.match(guestView.questions[0].prompt, /[а-яё]/i);
    assert.doesNotMatch(hostView.questions[0].prompt, /[а-яё]/i);
  });

  await t.test('the server times answers on the timeline and allows one per question', async () => {
    const first = hostView.questions[0];
    const answer = await host.call('submit-answer', {
      questionId: first.id,
      roundId: round.id,
      selectedOption: correctDisplayIndex(first),
      timeLeftMs: 999_999,
    });

    assert.equal(answer.body.isCorrect, true, JSON.stringify(answer.body));
    // About 14 s left on a 15 s hard question: (100 + 14 * 6) * 1.5.
    assert.ok(answer.body.scoreDelta >= Math.round((100 + 13 * 6) * 1.5) && answer.body.scoreDelta <= 276);

    const again = await host.call('submit-answer', { questionId: first.id, roundId: round.id, selectedOption: 0 });
    assert.equal(again.status, 409);
    assert.equal(again.body.code, 'answer_already_submitted');
  });

  await t.test('a wrong answer scores 0, reveals the correct option and explains in the player language', async () => {
    const first = guestView.questions[0];
    const answer = await guest.call('submit-answer', {
      locale: 'ru',
      questionId: first.id,
      roundId: round.id,
      selectedOption: (correctDisplayIndex(hostView.questions[0]) + 1) % 4,
    });

    assert.equal(answer.status, 200, JSON.stringify(answer.body));
    assert.equal(answer.body.isCorrect, false);
    assert.equal(answer.body.scoreDelta, 0);
    assert.equal(answer.body.correctOption, correctDisplayIndex(hostView.questions[0]));
    assert.match(answer.body.explanation, /[а-яё]/i);
  });

  await openQuestion(admin, round, 1);

  await t.test('between questions everyone gets the standings of the closed ones', async () => {
    const view = await load(guest, 'ru');
    const hostRow = view.standings.find((entry) => entry.player_id === host.id);
    const guestRow = view.standings.find((entry) => entry.player_id === guest.id);

    assert.equal(view.questions.length, 2);
    assert.equal(hostRow?.rank, 1);
    assert.equal(hostRow?.nickname, 'HostFox');
    assert.ok((hostRow?.score ?? 0) > 0);
    assert.equal(guestRow?.score, 0);
  });

  await t.test('answers are matched by option position, the same in every language', async () => {
    const hostSecond = (await load(host, 'en')).questions[1];
    const answer = await guest.call('submit-answer', {
      locale: 'ru',
      questionId: hostSecond.id,
      roundId: round.id,
      selectedOption: correctDisplayIndex(hostSecond),
    });

    assert.equal(answer.body.isCorrect, true, JSON.stringify(answer.body));
  });

  await t.test('a question that has not opened yet cannot be answered by id', async () => {
    const ahead = await guest.call('submit-answer', { questionId: round.question_ids[3], roundId: round.id, selectedOption: 0 });
    assert.equal(ahead.body.code, 'question_not_open');
  });

  await t.test('a reconnecting player gets their answers back', async () => {
    const view = await load(guest, 'ru');
    assert.equal(view.myAnswers.length, 2);
  });

  await t.test('direct inserts into answer_submissions are refused', async () => {
    const direct = await guest.client.from('answer_submissions').insert({
      player_id: guest.id,
      question_id: round.question_ids[2],
      round_id: round.id,
      selected_option: 0,
      time_left_ms: 18_000,
    });
    assert.ok(direct.error);
  });

  // The host answers the rest as each question opens.
  for (let index = 1; index < 8; index += 1) {
    await openQuestion(admin, round, index);
    const question = (await load(host, 'en')).questions[index];
    const answer = await host.call('submit-answer', {
      questionId: question.id,
      roundId: round.id,
      selectedOption: correctDisplayIndex(question),
    });
    assert.equal(answer.body.isCorrect, true, JSON.stringify(answer.body));
  }

  await t.test('finalize waits for players until the deadline', async () => {
    const pending = await host.call('finalize-round', { roundId: round.id });
    assert.equal(pending.body.status, 'pending');
  });

  await admin.from('round_sessions').update({ ends_at: new Date(Date.now() - 1000).toISOString() }).eq('id', round.id);

  await t.test('after the deadline answers are refused and the round completes', async () => {
    const late = await guest.call('submit-answer', { questionId: round.question_ids[7], roundId: round.id, selectedOption: 0 });
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

test('a big screen room: the host shows the round, one phone player is enough and only players rank', async () => {
  const host = await createPlayer(stack, 'TvHost', 'en');
  const guest = await createPlayer(stack, 'PhonePup', 'en');
  const created = await host.call('create-room', { difficulty: 'easy', locale: 'en' });
  const roomCode = created.body.room.room_code as string;
  const updated = await host.call('update-room-settings', { difficulty: 'easy', roomCode, screenMode: true });
  assert.equal(updated.status, 200, JSON.stringify(updated.body));
  assert.equal(updated.body.room.screen_mode, true);

  await guest.call('join-room', { roomCode });
  await guest.call('set-room-ready', { ready: true, roomCode });
  const started = await host.call('start-room-round', { locale: 'en', roomCode });
  assert.equal(started.status, 200, JSON.stringify(started.body));
  const round = started.body.round;

  await openQuestion(admin, round, 0);
  const view = await guest.call('get-room-round', { locale: 'en', roomCode });
  const answer = await guest.call('submit-answer', { questionId: view.body.questions[0].id, roundId: round.id, selectedOption: 0 });
  assert.equal(answer.status, 200, JSON.stringify(answer.body));

  await openQuestion(admin, round, 1);
  const screen = await host.call('get-room-round', { locale: 'en', roomCode });
  assert.deepEqual(screen.body.standings.map((entry: { player_id: string }) => entry.player_id), [guest.id]);
  assert.equal(screen.body.revealed.length, 1);
  assert.equal(screen.body.revealed[0].questionId, round.question_ids[0]);

  await admin.from('round_sessions').update({ ends_at: new Date(Date.now() - 1000).toISOString() }).eq('id', round.id);
  const done = await guest.call('finalize-round', { roundId: round.id });
  assert.equal(done.body.status, 'completed', JSON.stringify(done.body));
  assert.deepEqual(done.body.rankings.map((entry: { player_id: string }) => entry.player_id), [guest.id]);
});
