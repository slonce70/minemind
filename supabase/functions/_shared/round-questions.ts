export type RoundQuestionSubmission = {
  question_id: string;
};

export function assertQuestionBelongsToRound(input: {
  questionId: string;
  roundQuestionIds: string[];
}) {
  if (!input.roundQuestionIds.includes(input.questionId)) {
    throw new Error('Question does not belong to this round.');
  }
}

export function filterSubmissionsForRoundQuestions<TSubmission extends RoundQuestionSubmission>(
  submissions: TSubmission[],
  roundQuestionIds: string[]
) {
  const allowedQuestionIds = new Set(roundQuestionIds);

  return submissions.filter((submission) => allowedQuestionIds.has(submission.question_id));
}
