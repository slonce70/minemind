import { serviceClient } from './client.ts';
import { questionWindow, type GameDifficulty } from './game-rules.ts';
import { listRoomParticipants, playingParticipants } from './rooms.ts';

// Not worth moving everyone's clock for the last second or so.
const minimumSkipMs = 1_500;

/** How far to pull the timeline back so question `index` closes at `now`; 0 when not worth it. */
export function earlyCloseShiftMs(input: { difficulty: GameDifficulty; index: number; now: Date; startedAt: Date }) {
  const { closesAt, opensAt } = questionWindow(input);
  const remaining = closesAt.getTime() - input.now.getTime();

  return input.now >= opensAt && remaining > minimumSkipMs ? remaining : 0;
}

/**
 * Once every player answered the open question, the round moves on: started_at and ends_at shift
 * back so the question closes now and the reveal starts. Clients re-read the timeline when told.
 * Compare-and-swap on started_at, so two last answers at once shift it only once.
 */
export async function closeQuestionIfAllAnswered(input: {
  difficulty: GameDifficulty;
  now: Date;
  questionId: string;
  round: { ends_at: string | null; id: string; question_ids: string[]; room_id: string; started_at: string };
}) {
  const index = input.round.question_ids.indexOf(input.questionId);
  const startedAt = new Date(input.round.started_at);
  const shiftMs = earlyCloseShiftMs({ difficulty: input.difficulty, index, now: input.now, startedAt });

  if (index < 0 || shiftMs === 0) {
    return false;
  }

  const { data: room, error: roomError } = await serviceClient
    .from('rooms')
    .select('host_id, screen_mode')
    .eq('id', input.round.room_id)
    .single();

  if (roomError || !room) {
    return false;
  }

  const players = playingParticipants(room, await listRoomParticipants(input.round.room_id));
  const { count, error } = await serviceClient
    .from('answer_submissions')
    .select('player_id', { count: 'exact', head: true })
    .eq('round_id', input.round.id)
    .eq('question_id', input.questionId)
    .in(
      'player_id',
      players.map((player) => player.player_id)
    );

  if (error || players.length === 0 || (count ?? 0) < players.length) {
    return false;
  }

  const shift = (value: string) => new Date(new Date(value).getTime() - shiftMs).toISOString();
  const { data: moved } = await serviceClient
    .from('round_sessions')
    .update({
      ends_at: input.round.ends_at ? shift(input.round.ends_at) : null,
      started_at: shift(input.round.started_at),
    })
    .eq('id', input.round.id)
    .eq('started_at', input.round.started_at)
    .is('finalized_at', null)
    .select('id');

  return (moved ?? []).length > 0;
}
