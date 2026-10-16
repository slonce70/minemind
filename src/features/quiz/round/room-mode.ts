import { router } from 'expo-router';
import { useCallback, useEffect, useReducer, useRef } from 'react';

import { isSupabaseConfigured } from '../../../lib/supabase';
import { useAppStore } from '../../../state/app-store';
import { normalizeMatchRecord } from '../../results/normalize-match-record';
import { createRoomStandings } from '../../rooms/demo-room-service';
import {
  finalizeLiveRoomRound,
  openLiveRoomQuestion,
  resumeLiveRoomRound,
  submitLiveRoomAnswer,
} from '../../rooms/live-room-service';
import { buildQuizResult } from '../quiz-service';
import type { ModeContext, ModeController } from './mode-types';
import { initialRoundFlowState, roundFlowReducer } from './round-flow';

/** Room battle: live (Supabase, server-scored) or the offline demo room. */
export function useRoomMode({ difficulty, dispatch, enabled, locale, messages, round, timeLimit }: ModeContext) {
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const saveMatchRecord = useAppStore((state) => state.saveMatchRecord);
  const activeRoom = useAppStore((state) => state.activeRoom);
  const activeRoomRound = useAppStore((state) => state.activeRoomRound);
  const leaveRoom = useAppStore((state) => state.leaveRoom);
  const setActiveRoom = useAppStore((state) => state.setActiveRoom);
  const setActiveRoomRound = useAppStore((state) => state.setActiveRoomRound);
  const clearActiveRound = useAppStore((state) => state.clearActiveRound);
  const [flow, dispatchFlow] = useReducer(roundFlowReducer, initialRoundFlowState);
  const currentRoom = enabled ? activeRoom : undefined;
  const currentRoomRound = enabled ? activeRoomRound : undefined;
  const isLiveRound = currentRoomRound?.source === 'supabase';
  // A live room already in a round we have not loaded yet (e.g. after an app restart).
  const canFetchRound = Boolean(
    isSupabaseConfigured &&
    currentRoom?.roundId &&
    currentRoom.status !== 'lobby' &&
    currentRoom.status !== 'finished'
  );
  const isLoading = enabled && !currentRoomRound && canFetchRound && !flow.loadError;
  // After the server finished the round (room back to waiting) the screen only fetches results.
  const isRecoveringWaitingRoom = Boolean(
    currentRoom &&
    currentRoomRound?.source === 'supabase' &&
    currentRoom.status === 'waiting' &&
    !currentRoom.roundId
  );
  const loadedRoundKeyRef = useRef<string | null>(null);

  // Show the round once per round (store updates of the same round must not restart the timer).
  useEffect(() => {
    if (!enabled || !hasHydrated || !currentRoomRound || isRecoveringWaitingRoom) {
      return;
    }

    const roundKey = `${currentRoomRound.source}:${currentRoomRound.roundId ?? currentRoomRound.roomCode}`;

    if (loadedRoundKeyRef.current === roundKey) {
      return;
    }

    loadedRoundKeyRef.current = roundKey;
    dispatch({
      answers: currentRoomRound.answers,
      awaitsVerdict: currentRoomRound.source === 'supabase',
      questions: currentRoomRound.questions,
      timeLimit,
      type: 'load',
    });
  }, [currentRoomRound, dispatch, enabled, hasHydrated, isRecoveringWaitingRoom, timeLimit]);

  // The room moved on to a round we do not have yet (another device started it): fetch it.
  useEffect(() => {
    if (!enabled || !hasHydrated || !currentRoom || (currentRoomRound && !isRecoveringWaitingRoom) || !canFetchRound) {
      return;
    }

    let isMounted = true;

    dispatchFlow({ type: 'clear-load-error' });
    void resumeLiveRoomRound(currentRoom.roomCode, locale)
      .then((resumed) => {
        if (isMounted) {
          setActiveRoom(resumed.room);
          setActiveRoomRound(resumed.round);
        }
      })
      .catch((error) => {
        if (isMounted) {
          dispatchFlow({ message: error instanceof Error ? error.message : messages.loadError, type: 'set-load-error' });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [
    canFetchRound,
    currentRoom,
    currentRoomRound,
    enabled,
    hasHydrated,
    isRecoveringWaitingRoom,
    locale,
    messages.loadError,
    setActiveRoom,
    setActiveRoomRound,
  ]);

  useEffect(() => {
    if (!hasHydrated || !currentRoom) {
      return;
    }

    if (currentRoomRound?.source === 'supabase' && (currentRoom.status === 'lobby' || currentRoom.status === 'finished')) {
      clearActiveRound();
    }
  }, [clearActiveRound, currentRoom, currentRoomRound, hasHydrated]);

  // Results of a round the server already finished.
  useEffect(() => {
    if (!hasHydrated || !isRecoveringWaitingRoom || !currentRoomRound) {
      return;
    }

    let isMounted = true;

    dispatchFlow({ type: 'begin-awaiting-results' });

    void finalizeLiveRoomRound(currentRoomRound)
      .then((finalized) => {
        if (!isMounted) {
          return;
        }

        if (finalized.status === 'pending') {
          dispatchFlow({ type: 'set-results-pending', value: true });
          return;
        }

        if (finalized.record) {
          saveMatchRecord(finalized.record);
        }
        leaveRoom();
        router.replace('/results');
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        dispatchFlow({ type: 'set-results-pending', value: true });
        dispatchFlow({ message: error instanceof Error ? error.message : messages.loadError, type: 'set-load-error' });
      });

    return () => {
      isMounted = false;
    };
  }, [currentRoomRound, hasHydrated, isRecoveringWaitingRoom, leaveRoom, messages.loadError, saveMatchRecord]);

  // Live rooms: tell the server when the question appears so it can time the answer itself.
  const question = round.questions[round.currentIndex];
  const openedQuestionRef = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    if (!isLiveRound || !currentRoomRound || !question) {
      return;
    }

    openedQuestionRef.current = openLiveRoomQuestion(currentRoomRound, question.id).catch(() => undefined);
  }, [currentRoomRound, isLiveRound, question]);

  // Send the answer and wait for the server's verdict.
  const pendingAnswer = enabled && isLiveRound ? round.pendingAnswer : null;

  useEffect(() => {
    if (!pendingAnswer || !currentRoomRound) {
      return;
    }

    dispatch({ type: 'answer-sent' });
    void openedQuestionRef.current
      .then(() => submitLiveRoomAnswer(currentRoomRound, pendingAnswer.questionId, pendingAnswer.optionIndex, locale))
      .then((submission) => {
        if (submission) {
          dispatch({
            questionId: pendingAnswer.questionId,
            type: 'verdict',
            verdict: {
              correctIndex: submission.correctOption,
              explanation: submission.explanation,
              isCorrect: submission.isCorrect,
            },
          });
        }
      })
      .catch(() => {
        dispatch({
          explanation: messages.factPending,
          markWrong: true,
          questionId: pendingAnswer.questionId,
          type: 'verdict-failed',
        });
      });
  }, [currentRoomRound, dispatch, locale, messages.factPending, pendingAnswer]);

  const finish = useCallback(async () => {
    const result = buildQuizResult(round.questions, round.answerMap, {
      difficulty,
      mode: 'room',
      roomCode: currentRoom?.roomCode,
      standingsBuilder: (finalScore) => createRoomStandings(currentRoom!, finalScore),
    });

    if (currentRoomRound?.source === 'supabase') {
      dispatchFlow({ type: 'begin-awaiting-results' });

      try {
        const finalized = await finalizeLiveRoomRound(currentRoomRound, result);

        if (finalized.status === 'pending') {
          dispatchFlow({ type: 'set-results-pending', value: true });
          return;
        }

        if (finalized.record) {
          saveMatchRecord(finalized.record);
        }
      } catch (error) {
        dispatchFlow({ type: 'set-results-pending', value: true });
        dispatchFlow({ message: error instanceof Error ? error.message : messages.loadError, type: 'set-load-error' });
        return;
      }
    } else {
      saveMatchRecord(
        normalizeMatchRecord({
          authority: 'client',
          input: result,
          isDemo: true,
          syncStatus: 'local-only',
          transport: 'local',
        })
      );
    }

    if (currentRoom) {
      leaveRoom();
    }
    router.replace('/results');
  }, [
    currentRoom,
    currentRoomRound,
    difficulty,
    leaveRoom,
    messages.loadError,
    round.answerMap,
    round.questions,
    saveMatchRecord,
  ]);

  const retryFinalize = useCallback(() => {
    void finish();
  }, [finish]);

  // Waiting for other players: once the server deadline passes, the round closes without them.
  const roundEndsAt = isLiveRound ? currentRoomRound?.endsAt : undefined;

  useEffect(() => {
    if (!flow.resultsPending || !roundEndsAt) {
      return undefined;
    }

    const retryTimer = setTimeout(retryFinalize, Math.max(0, Date.parse(roundEndsAt) - Date.now()) + 1500);

    return () => clearTimeout(retryTimer);
  }, [flow.resultsPending, retryFinalize, roundEndsAt]);

  return {
    controller: {
      finish,
      isAwaitingResults: flow.isAwaitingResults,
      isLoading,
      loadError: flow.loadError,
      resultsPending: flow.resultsPending,
      retryFinalize,
    } satisfies ModeController,
    currentRoom,
    currentRoomRound,
  };
}
