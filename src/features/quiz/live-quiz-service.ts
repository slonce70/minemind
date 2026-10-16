import type { AppLocale } from '../../lib/locale';
import type { ContentDifficulty } from '../content/types';
import { toPlayerSafeErrorMessage } from '../shared/app-copy';
import { parseStartSoloRoundResponse } from '../../lib/api-contracts';
import { invokeSupabaseFunction } from '../../lib/supabase';
import type { QuizQuestion } from './types';

type StartSoloRoundResponse = {
  contentPackVersion: string;
  difficulty: ContentDifficulty;
  questions: QuizQuestion[];
};

export async function startLiveSoloRound(locale: AppLocale, difficulty: ContentDifficulty) {
  try {
    const data = await invokeSupabaseFunction<
      StartSoloRoundResponse,
      { difficulty: ContentDifficulty; locale: AppLocale }
    >('start-solo-round', {
      difficulty,
      locale,
    });

    return parseStartSoloRoundResponse(data).questions;
  } catch (error) {
    throw new Error(toPlayerSafeErrorMessage(error));
  }
}
