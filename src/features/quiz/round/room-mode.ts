import { router } from 'expo-router';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

import { isSupabaseConfigured } from '../../../lib/supabase';
import { useAppStore } from '../../../state/app-store';
import { normalizeMatchRecord } from '../../results/normalize-match-record';
import { createRoomStandings } from '../../rooms/demo-room-service';
import {
  finalizeLiveRoomRound,
  resumeLiveRoomRound,
  submitLiveRoomAnswer,
} from '../../rooms/live-room-service';
import {
  countClosedQuestions,
  countReleasedQuestions,
} from '../../../../supabase/functions/_shared/game-rules';
import { useRoomChannel } from '../../rooms/use-room-channel';
import { buildQuizResult } from '../quiz-service';
import type { ModeContext, ModeController } from './mode-types';
import { initialRoundFlowState, roundFlowReducer } from './round-flow';
import { describeTimeline, type TimelinePhase } from './timeline';

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

  // Send the answer and wait for the server's verdict (the server times it on the timeline).
  const pendingAnswer = enabled && isLiveRound ? round.pendingAnswer : null;

  useEffect(() => {
    if (!pendingAnswer || !currentRoomRound) {
      return;
    }

    dispatch({ type: 'answer-sent' });
    void submitLiveRoomAnswer(currentRoomRound, pendingAnswer.questionId, pendingAnswer.optionIndex, locale)
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

  // Live rooms follow the server timeline: questions open and close, and the standings show,
  // for everyone at the same moment. The clock only dispatches; the machine applies it.
  const timeline = isLiveRound ? currentRoomRound?.timeline : undefined;
  const [phase, setPhase] = useState<TimelinePhase | null>(null);
  const fetchStateRef = useRef({ closed: -1, inFlight: false, lastAttemptAt: 0, roundId: '' });
  const finishedRoundRef = useRef<string | null>(null);
  const liveRoomCode = currentRoom?.roomCode;

  const refreshRound = useCallback(
    async (closedTarget: number) => {
      const fetchState = fetchStateRef.current;

      if (!liveRoomCode || fetchState.inFlight || Date.now() - fetchState.lastAttemptAt < 1500) {
        return;
      }

      fetchState.inFlight = true;
      fetchState.lastAttemptAt = Date.now();

      try {
        const refreshed = await resumeLiveRoomRound(liveRoomCode, locale);

        if (useAppStore.getState().activeRoomRound?.roundId === refreshed.round.roundId) {
          fetchState.closed = closedTarget;
          setActiveRoomRound(refreshed.round);
        }
      } catch {
        // The next clock tick retries.
      } finally {
        fetchState.inFlight = false;
      }
    },
    [liveRoomCode, locale, setActiveRoomRound]
  );

  useEffect(() => {
    if (!enabled || !timeline || !currentRoomRound?.roundId) {
      setPhase(null);
      return undefined;
    }

    if (fetchStateRef.current.roundId !== currentRoomRound.roundId) {
      // New round (or first mount after a reconnect): fetch right away to align the clock.
      fetchStateRef.current = { closed: -1, inFlight: false, lastAttemptAt: 0, roundId: currentRoomRound.roundId };
    }

    const timing = {
      difficulty: currentRoomRound.difficulty ?? 'medium',
      questionCount: timeline.questionCount,
      startedAt: new Date(timeline.startedAt),
    };
    let lastPhaseKey = '';

    const update = () => {
      const now = new Date(Date.now() + timeline.serverOffsetMs);
      const next = describeTimeline({ ...timing, now });
      const phaseKey = JSON.stringify(next);

      if (phaseKey !== lastPhaseKey) {
        lastPhaseKey = phaseKey;
        setPhase(next);

        if (next.kind === 'question' || next.kind === 'between') {
          dispatch({
            index: next.index,
            isClosed: next.kind === 'between',
            questions: currentRoomRound.questions,
            timeLeft: next.kind === 'question' ? next.secondsLeft : 0,
            type: 'timeline',
          });
        }
      }

      const closed = countClosedQuestions({ ...timing, now });

      if (
        currentRoomRound.questions.length < countReleasedQuestions({ ...timing, now }) ||
        closed > fetchStateRef.current.closed
      ) {
        void refreshRound(closed);
      }
    };

    update();
    const clock = setInterval(update, 250);

    return () => clearInterval(clock);
  }, [currentRoomRound, dispatch, enabled, refreshRound, timeline]);

  // The last question closed: hand in the round once.
  const liveRoundId = currentRoomRound?.roundId;

  useEffect(() => {
    if (phase?.kind !== 'over' || !liveRoundId || finishedRoundRef.current === liveRoundId) {
      return;
    }

    finishedRoundRef.current = liveRoundId;
    void finish();
  }, [finish, liveRoundId, phase]);

  // Who answered the current question (realtime), and results as soon as the server has them.
  const roomChannel = useRoomChannel(isLiveRound ? currentRoom : undefined, (event) => {
    if (event.type === 'room-finished' && flow.resultsPending) {
      retryFinalize();
    }
  });
  const currentQuestion = round.questions[round.currentIndex];
  const isScreenHost = Boolean(
    currentRoom?.settings.screenMode && currentRoom.participants.some((participant) => participant.isLocalPlayer && participant.isHost)
  );

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
    timeline: timeline
      ? {
          answeredCount: currentQuestion ? (roomChannel.answeredByQuestionId[currentQuestion.id]?.length ?? 0) : 0,
          isScreen: isScreenHost,
          phase,
          // The big screen's host does not answer.
          playerCount: (currentRoom?.participants.length ?? 0) - (currentRoom?.settings.screenMode ? 1 : 0),
          revealed: timeline.revealed ?? {},
          standings: timeline.standings,
          standingsQuestionCount: timeline.standingsQuestionCount,
        }
      : undefined,
  };
}
