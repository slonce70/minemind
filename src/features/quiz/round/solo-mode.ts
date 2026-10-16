import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { useAppStore } from '../../../state/app-store';
import { normalizeMatchRecord } from '../../results/normalize-match-record';
import { buildQuizResult, getSoloQuestionSet } from '../quiz-service';
import type { ModeContext, ModeController } from './mode-types';

/** Single player, scored on the device from the local question bank. */
export function useSoloMode({ difficulty, dispatch, enabled, locale, messages, round, timeLimit }: ModeContext): ModeController {
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const saveMatchRecord = useAppStore((state) => state.saveMatchRecord);
  const selectedDifficulty = useAppStore((state) => state.selectedDifficulty);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !hasHydrated) {
      return;
    }

    setLoadError(null);

    try {
      // The local bank carries correct answers, honours the chosen difficulty and shuffles
      // answer positions per round.
      dispatch({
        awaitsVerdict: false,
        questions: getSoloQuestionSet(locale, 8, selectedDifficulty),
        timeLimit,
        type: 'load',
      });
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : messages.loadError);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, enabled, hasHydrated, locale, messages.loadError, selectedDifficulty, timeLimit]);

  const finish = useCallback(async () => {
    const result = buildQuizResult(round.questions, round.answerMap, {
      difficulty,
      mode: 'solo',
      standingsBuilder: (finalScore) => [{ isPlayer: true, name: 'You', score: finalScore }],
    });

    saveMatchRecord(
      normalizeMatchRecord({
        authority: 'client',
        input: result,
        isDemo: false,
        syncStatus: 'local-only',
        transport: 'local',
      })
    );
    router.replace('/results');
  }, [difficulty, round.answerMap, round.questions, saveMatchRecord]);

  return {
    finish,
    isAwaitingResults: false,
    isLoading,
    loadError,
    resultsPending: false,
    retryFinalize: () => undefined,
  };
}
