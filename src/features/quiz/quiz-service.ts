import type { AppLocale } from '../../lib/locale';
import { loadMinecraftQuestionBank } from '../content/content-loader';
import { selectQuestionRound } from '../content/content-selection';
import type { ContentDifficulty, ContentQuestionRecord } from '../content/types';
import type {
  QuizAnswerMap,
  QuizQuestion,
  QuizResultSummary,
} from './types';

function buildRoundSeed(locale: AppLocale, difficulty: ContentDifficulty) {
  return `${locale}-${difficulty}-${Date.now().toString().slice(-6)}`;
}

function localizeQuestion(definition: ContentQuestionRecord, locale: AppLocale): QuizQuestion {
  return {
    id: definition.id,
    correctIndex: definition.correctIndex,
    explanation: definition.explanation[locale],
    options: definition.options.map((option) => option[locale]),
    prompt: definition.prompt[locale],
  };
}

export function getSoloQuestionSet(
  locale: AppLocale,
  count = 8,
  difficulty: ContentDifficulty = 'medium',
  seed = buildRoundSeed(locale, difficulty)
) {
  const questionBank = loadMinecraftQuestionBank();
  const round = selectQuestionRound({
    bank: questionBank,
    count,
    difficulty,
    seed,
  });

  return round.map((item) => localizeQuestion(item, locale));
}

export function buildQuizResult(
  questions: QuizQuestion[],
  answers: QuizAnswerMap,
  options?: {
    difficulty?: ContentDifficulty;
    mode?: 'room' | 'solo';
    roomCode?: string;
    standings?: QuizResultSummary['standings'];
  }
): QuizResultSummary {
  let correctAnswers = 0;
  let score = 0;
  let currentStreak = 0;
  let bestStreak = 0;
  let speedBonus = 0;

  const breakdown = questions.map((question) => {
    const answer = answers[question.id];
    const isCorrect =
      answer?.isCorrect ?? (typeof question.correctIndex === 'number'
        ? answer?.selectedIndex === question.correctIndex
        : false);
    const questionSpeedBonus = Math.max(0, (answer?.timeLeft ?? 0) * 6);

    if (isCorrect) {
      correctAnswers += 1;
      currentStreak += 1;
      bestStreak = Math.max(bestStreak, currentStreak);
      speedBonus += questionSpeedBonus;
      score += 100 + questionSpeedBonus;
    } else {
      currentStreak = 0;
    }

    return {
      explanation: answer?.explanation ?? question.explanation ?? '',
      isCorrect,
      prompt: question.prompt,
      questionId: question.id,
      selectedIndex: answer?.selectedIndex ?? -1,
    };
  });

  return {
    bestStreak,
    breakdown,
    completedAt: new Date().toISOString(),
    correctAnswers,
    difficulty: options?.difficulty,
    mode: options?.mode ?? 'solo',
    questionCount: questions.length,
    roomCode: options?.roomCode,
    score,
    speedBonus,
    standings:
      options?.standings ??
      [
        {
          isPlayer: true,
          name: 'You',
          score,
        },
      ],
  };
}
