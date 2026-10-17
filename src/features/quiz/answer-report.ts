import type { QuizAnswerMap, QuizQuestion } from './types';

/** Per question: right or not and, when answered, how long it took (for difficulty calibration). */
export function buildAnswerReport(questions: QuizQuestion[], answers: QuizAnswerMap, timeLimit: number) {
  return questions.flatMap((question) => {
    const answer = answers[question.id];

    if (!answer || typeof question.correctIndex !== 'number') {
      return [];
    }

    const answered = answer.selectedIndex >= 0;

    return [
      {
        answerMs: answered ? Math.max(0, timeLimit - answer.timeLeft) * 1000 : null,
        correct: answered && answer.selectedIndex === question.correctIndex,
        questionId: question.id,
      },
    ];
  });
}
