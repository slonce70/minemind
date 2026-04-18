import type { AppLocale } from '../../lib/locale';
import { toPlayerSafeErrorMessage } from '../shared/app-copy';
import { parseStartSoloRoundResponse } from '../../lib/api-contracts';
import { invokeSupabaseFunction } from '../../lib/supabase';
import type { QuizQuestion } from './types';

type StartSoloRoundResponse = {
  pack: {
    id: string;
    title: string;
  };
  questions: QuizQuestion[];
};

export async function startLiveSoloRound(locale: AppLocale) {
  try {
    const data = await invokeSupabaseFunction<StartSoloRoundResponse, { locale: AppLocale }>(
      'start-solo-round',
      {
        locale,
      }
    );

    return parseStartSoloRoundResponse(data).questions;
  } catch (error) {
    throw new Error(toPlayerSafeErrorMessage(error));
  }
}
