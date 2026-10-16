import { serviceClient } from './client.ts';
import { buildPlayerAnswers, loadQuestionsInOrder, type QuestionLocale, sanitizeQuestionsForClient } from './questions.ts';
import {
  buildRoundRanking,
  countClosedQuestions,
  countReleasedQuestions,
  resolveDifficulty,
} from './round-integrity.ts';
import { filterSubmissionsForRoundQuestions } from './round-questions.ts';

type RoundRow = { difficulty: string; id: string; question_ids: string[]; started_at: string };
type Participant = { nickname: string; player_id: string };

/**
 * What one player may see of a live round right now: the questions released so far (in their
 * language, without answers), their own answers, and the standings over the questions that are
 * already closed. Later questions stay on the server until they are about to open.
 */
export async function buildRoundView(input: {
  locale: QuestionLocale;
  now: Date;
  participants: Participant[];
  playerId: string;
  round: RoundRow;
}) {
  const timeline = {
    difficulty: resolveDifficulty(input.round.difficulty),
    now: input.now,
    questionCount: input.round.question_ids.length,
    startedAt: new Date(input.round.started_at),
  };
  const releasedIds = input.round.question_ids.slice(0, countReleasedQuestions(timeline));
  const closedIds = input.round.question_ids.slice(0, countClosedQuestions(timeline));
  const questions = await loadQuestionsInOrder(releasedIds, input.locale);
  const { data: submissions, error } = await serviceClient
    .from('answer_submissions')
    .select('player_id, question_id, selected_option, time_left_ms')
    .eq('round_id', input.round.id)
    .not('selected_option', 'is', null);

  if (error) {
    throw error;
  }

  const roundSubmissions = filterSubmissionsForRoundQuestions(submissions ?? [], releasedIds);
  const nicknames = new Map(input.participants.map((participant) => [participant.player_id, participant.nickname]));
  const standings =
    closedIds.length === 0
      ? []
      : buildRoundRanking({
          correctOptionByQuestionId: new Map(questions.map((question) => [question.id, question.correct_option])),
          difficulty: timeline.difficulty,
          participantIds: input.participants.map((participant) => participant.player_id),
          questionIds: closedIds,
          roundId: input.round.id,
          submissions: roundSubmissions,
        }).map((entry) => ({ ...entry, nickname: nicknames.get(entry.player_id) ?? 'Player' }));

  return {
    myAnswers: buildPlayerAnswers({
      questions,
      roundId: input.round.id,
      submissions: roundSubmissions.filter((submission) => submission.player_id === input.playerId),
    }),
    questionCount: input.round.question_ids.length,
    questions: sanitizeQuestionsForClient(questions, input.round.id),
    serverNow: input.now.toISOString(),
    standings,
    /** How many closed questions the standings cover. */
    standingsQuestionCount: closedIds.length,
  };
}
