import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { useAppStore } from '../../../state/app-store';
import { difficultyConfig } from '../../content/difficulty-config';
import { normalizeMatchRecord } from '../../results/normalize-match-record';
import { loadMinecraftQuestionBank } from '../../content/content-loader';
import { buildQuizResult } from '../quiz-service';
import { buildSoloRound, type SoloRoundSpec } from '../solo-round-builder';
import type { RoundVariant } from '../types';
import type { ModeContext, ModeController } from './mode-types';

/** Hints per solo round. */
export const soloLifelines = { fifty: 1, time: 1 };

function newSeed() {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/** Single player, scored on the device from the local question bank. */
export function useSoloMode({
  dispatch,
  enabled,
  locale,
  messages,
  round,
  spec,
}: ModeContext & { spec?: SoloRoundSpec }): ModeController & { roundDifficulty?: ModeContext['difficulty']; variant?: RoundVariant } {
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const saveMatchRecord = useAppStore((state) => state.saveMatchRecord);
  const selectedDifficulty = useAppStore((state) => state.selectedDifficulty);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [built, setBuilt] = useState<{ difficulty: ModeContext['difficulty']; round: RoundVariant } | null>(null);
  const specKey = JSON.stringify(spec ?? { difficulty: selectedDifficulty, variant: 'classic' });

  useEffect(() => {
    if (!enabled || !hasHydrated) {
      return;
    }

    setLoadError(null);

    try {
      // The local bank carries correct answers; the spec picks the questions (classic, topic,
      // adaptive, mistakes or a friend's challenge) and shuffles answer positions per round.
      const { progress } = useAppStore.getState();
      const next = buildSoloRound({
        bank: loadMinecraftQuestionBank(),
        locale,
        recentAnswers: progress.recentAnswers,
        seed: newSeed(),
        spec: JSON.parse(specKey) as SoloRoundSpec,
      });

      if (next.questions.length === 0) {
        throw new Error(messages.loadError);
      }

      setBuilt({ difficulty: next.difficulty, round: next.round });
      dispatch({
        awaitsVerdict: false,
        lifelines: soloLifelines,
        questions: next.questions,
        timeLimit: difficultyConfig[next.difficulty].timerSeconds,
        type: 'load',
      });
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : messages.loadError);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, enabled, hasHydrated, locale, messages.loadError, specKey]);

  const finish = useCallback(async () => {
    const result = buildQuizResult(round.questions, round.answerMap, {
      difficulty: built?.difficulty,
      mode: 'solo',
      round: built?.round,
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
  }, [built, round.answerMap, round.questions, saveMatchRecord]);

  return {
    finish,
    isAwaitingResults: false,
    isLoading,
    loadError,
    resultsPending: false,
    retryFinalize: () => undefined,
    roundDifficulty: built?.difficulty,
    variant: built?.round,
  };
}
