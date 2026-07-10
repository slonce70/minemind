import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';

import {
  buildClassroomRoundResults,
  hasClassroomRoundSubmissionsForAllParticipants,
  mergeClassroomRoundSubmission,
  type ClassroomRoundSubmissions,
} from '../classroom/classroom-round-authority';
import { getSharedLocalHostTransport } from '../classroom/local-host-transport';
import { createRoomStandings } from '../rooms/demo-room-service';
import {
  finalizeLiveRoomRound,
  resumeLiveRoomRound,
  submitLiveRoomAnswer,
} from '../rooms/live-room-service';
import { useAppStore } from '../../state/app-store';
import { isSupabaseConfigured } from '../../lib/supabase';
import { difficultyConfig } from '../content/difficulty-config';
import { normalizeMatchRecord } from '../results/normalize-match-record';
import { buildQuizResult, getSoloQuestionSet } from './quiz-service';
import type { QuizAnswerMap, QuizResultSummary } from './types';

type RoundFlowState = {
  classroomSubmissions: ClassroomRoundSubmissions;
  hasSubmittedClassroomRound: boolean;
  isAwaitingResults: boolean;
  isPublishingClassroomResults: boolean;
  loadError: string | null;
  resultsPending: boolean;
};

type RoundFlowAction =
  | { type: 'begin-awaiting-results'; resultsPending?: boolean }
  | { type: 'begin-classroom-publish' }
  | { type: 'clear-awaiting-results' }
  | { type: 'clear-load-error' }
  | { type: 'merge-classroom-submission'; answers: QuizAnswerMap; participantId: string }
  | { type: 'reset-classroom-round' }
  | { type: 'set-load-error'; message: string | null }
  | { type: 'set-results-pending'; value: boolean }
  | {
      type: 'submit-local-classroom-round';
      nextSubmissions: ClassroomRoundSubmissions;
      resultsPending: boolean;
    };

const initialRoundFlowState: RoundFlowState = {
  classroomSubmissions: {},
  hasSubmittedClassroomRound: false,
  isAwaitingResults: false,
  isPublishingClassroomResults: false,
  loadError: null,
  resultsPending: false,
};

function roundFlowReducer(state: RoundFlowState, action: RoundFlowAction): RoundFlowState {
  switch (action.type) {
    case 'begin-awaiting-results':
      return {
        ...state,
        isAwaitingResults: true,
        loadError: null,
        resultsPending: action.resultsPending ?? false,
      };
    case 'begin-classroom-publish':
      return {
        ...state,
        isPublishingClassroomResults: true,
      };
    case 'clear-awaiting-results':
      return {
        ...state,
        isAwaitingResults: false,
        resultsPending: false,
      };
    case 'clear-load-error':
      return {
        ...state,
        loadError: null,
      };
    case 'merge-classroom-submission':
      return {
        ...state,
        classroomSubmissions: mergeClassroomRoundSubmission(state.classroomSubmissions, {
          answers: action.answers,
          participantId: action.participantId,
        }),
      };
    case 'reset-classroom-round':
      return {
        ...state,
        classroomSubmissions: {},
        hasSubmittedClassroomRound: false,
        isPublishingClassroomResults: false,
      };
    case 'set-load-error':
      return {
        ...state,
        loadError: action.message,
      };
    case 'set-results-pending':
      return {
        ...state,
        resultsPending: action.value,
      };
    case 'submit-local-classroom-round':
      return {
        ...state,
        classroomSubmissions: action.nextSubmissions,
        hasSubmittedClassroomRound: true,
        isAwaitingResults: true,
        loadError: null,
        resultsPending: action.resultsPending,
      };
  }
}

export function useSoloRound(params: {
  locale: string;
  messages: {
    factPending: string;
    loadError: string;
  };
  mode?: string;
}) {
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const saveMatchRecord = useAppStore((state) => state.saveMatchRecord);
  const activeRoom = useAppStore((state) => state.activeRoom);
  const activeRoomRound = useAppStore((state) => state.activeRoomRound);
  const classroomSession = useAppStore((state) => state.classroomSession);
  const leaveRoom = useAppStore((state) => state.leaveRoom);
  const profile = useAppStore((state) => state.profile);
  const selectedDifficulty = useAppStore((state) => state.selectedDifficulty);
  const setActiveRoom = useAppStore((state) => state.setActiveRoom);
  const setActiveRoomRound = useAppStore((state) => state.setActiveRoomRound);
  const setClassroomSession = useAppStore((state) => state.setClassroomSession);
  const clearActiveRound = useAppStore((state) => state.clearActiveRound);
  const roundDifficulty =
    classroomSession?.difficulty ??
    activeRoom?.settings.difficulty ??
    activeRoom?.difficulty ??
    activeRoomRound?.difficulty ??
    selectedDifficulty;
  const questionTimeLimit = difficultyConfig[roundDifficulty].timerSeconds;
  const [questions, setQuestions] = useState(() =>
    params.mode === 'room' || params.mode === 'classroom'
      ? activeRoomRound?.questions ?? []
      : []
  );
  const [isLoading, setIsLoading] = useState(
    params.mode === 'room' ? Boolean(activeRoom && !activeRoomRound) : true
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(questionTimeLimit);
  const [answerMap, setAnswerMap] = useState<QuizAnswerMap>({});
  const [isRevealed, setIsRevealed] = useState(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [roundFlow, dispatchRoundFlow] = useReducer(roundFlowReducer, initialRoundFlowState);
  const classroomTransport = useMemo(() => getSharedLocalHostTransport(), []);
  const {
    classroomSubmissions,
    hasSubmittedClassroomRound,
    isAwaitingResults,
    isPublishingClassroomResults,
    loadError,
    resultsPending,
  } = roundFlow;
  const question = questions[currentIndex];
  const progress = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;
  const isClassroomMode = params.mode === 'classroom';
  const isRoomMode = params.mode === 'room';
  const currentRoom = isRoomMode ? activeRoom : undefined;
  const currentRoomRound = isRoomMode ? activeRoomRound : undefined;
  const currentClassroomSession = isClassroomMode ? classroomSession : undefined;
  const localClassroomParticipantId =
    currentClassroomSession?.participants.find((participant) => participant.isLocalPlayer)?.id ??
    profile?.nickname.toLowerCase().replace(/\s+/g, '-');
  const isRecoveringWaitingRoom = Boolean(
    currentRoom &&
    currentRoomRound?.source === 'supabase' &&
    currentRoom.status === 'waiting' &&
    !currentRoom.roundId
  );

  const persistResult = useCallback(
    (result: QuizResultSummary) => {
      if (isClassroomMode && currentClassroomSession) {
        return;
      }

      const isLiveRoomResult = isRoomMode && currentRoomRound?.source === 'supabase';

      saveMatchRecord(
        normalizeMatchRecord({
          authority: isLiveRoomResult ? 'server' : 'client',
          input: result,
          isDemo: isRoomMode && currentRoomRound?.source !== 'supabase',
          roundId: isLiveRoomResult ? currentRoomRound?.roundId : undefined,
          syncStatus: isLiveRoomResult ? 'synced' : 'local-only',
          transport: isLiveRoomResult ? 'supabase' : 'local',
        })
      );
    },
    [
      currentClassroomSession,
      currentRoomRound?.roundId,
      currentRoomRound?.source,
      isClassroomMode,
      isRoomMode,
      saveMatchRecord,
    ]
  );

  useEffect(() => {
    if (!isClassroomMode) {
      return;
    }

    dispatchRoundFlow({ type: 'reset-classroom-round' });
  }, [currentClassroomSession?.id, activeRoomRound?.roomCode, isClassroomMode]);

  useEffect(() => {
    let isMounted = true;

    const loadQuestions = async () => {
      if (!hasHydrated) {
        return;
      }

      if (isRoomMode) {
        setIsLoading(true);
        dispatchRoundFlow({ type: 'clear-load-error' });

        if (!currentRoom) {
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        if (activeRoomRound && !isRecoveringWaitingRoom) {
          if (isMounted) {
            setQuestions(activeRoomRound.questions);
            setTimeLeft(questionTimeLimit);
            setIsLoading(false);
          }
          return;
        }

        if (
          !isSupabaseConfigured ||
          !currentRoom.roundId ||
          currentRoom.status === 'lobby' ||
          currentRoom.status === 'finished'
        ) {
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        try {
          const resumed = await resumeLiveRoomRound(currentRoom.roomCode);

          if (isMounted) {
            setActiveRoom(resumed.room);
            setActiveRoomRound(resumed.round);
            setQuestions(resumed.round.questions);
            setTimeLeft(questionTimeLimit);
          }
        } catch (error) {
          if (isMounted) {
            dispatchRoundFlow({
              message: error instanceof Error ? error.message : params.messages.loadError,
              type: 'set-load-error',
            });
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }

        return;
      }

      if (isClassroomMode) {
        setIsLoading(true);
        dispatchRoundFlow({ type: 'clear-load-error' });

        if (!currentClassroomSession) {
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        try {
          const nextQuestions =
            activeRoomRound?.source === 'classroom'
              ? activeRoomRound.questions
              : getSoloQuestionSet(
                  params.locale as 'uk' | 'en' | 'ru',
                  8,
                  currentClassroomSession.difficulty ?? selectedDifficulty
                );

          if (isMounted) {
            setQuestions(nextQuestions);
            setTimeLeft(questionTimeLimit);
          }
        } catch (error) {
          if (isMounted) {
            dispatchRoundFlow({
              message: error instanceof Error ? error.message : params.messages.loadError,
              type: 'set-load-error',
            });
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }

        return;
      }

      setIsLoading(true);
      dispatchRoundFlow({ type: 'clear-load-error' });

      try {
        // Solo is single-player and client-scored: it must use the local bank,
        // which carries correctIndex/explanation. The server start-solo-round
        // returns sanitized questions (no correct answer) and never records a
        // solo result, so routing solo through it left every answer marked
        // wrong with a score of 0. Selecting locally also honors the chosen
        // difficulty and shuffles answer positions per round.
        const fallbackDifficulty = currentRoom?.settings.difficulty ?? selectedDifficulty;
        const nextQuestions = getSoloQuestionSet(
          params.locale as 'uk' | 'en' | 'ru',
          8,
          fallbackDifficulty
        );

        if (isMounted) {
          setQuestions(nextQuestions);
          setTimeLeft(questionTimeLimit);
        }
      } catch (error) {
        if (isMounted) {
          dispatchRoundFlow({
            message: error instanceof Error ? error.message : params.messages.loadError,
            type: 'set-load-error',
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadQuestions();

    return () => {
      isMounted = false;
    };
  }, [
    activeRoomRound,
    currentClassroomSession,
    currentRoom,
    isRecoveringWaitingRoom,
    isClassroomMode,
    hasHydrated,
    isRoomMode,
    params.locale,
    params.messages.loadError,
    questionTimeLimit,
    selectedDifficulty,
    setActiveRoom,
    setActiveRoomRound,
  ]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!currentRoom) {
      return;
    }

    if (
      currentRoomRound?.source === 'supabase' &&
      (currentRoom.status === 'lobby' || currentRoom.status === 'finished')
    ) {
      clearActiveRound();
    }
  }, [clearActiveRound, currentRoom, currentRoomRound, hasHydrated]);

  useEffect(() => {
    if (!isClassroomMode) {
      return;
    }

    return classroomTransport.subscribe((event) => {
      const liveSession = useAppStore.getState().classroomSession;

      if (!liveSession) {
        return;
      }

      if ('roomCode' in event && event.roomCode !== liveSession.roomCode) {
        return;
      }

      if (event.type === 'round-submitted' && liveSession.role === 'host') {
        dispatchRoundFlow({
          answers: event.answers,
          participantId: event.participantId,
          type: 'merge-classroom-submission',
        });
        return;
      }

      if (event.type === 'round-finished') {
        if (liveSession.role === 'host') {
          return;
        }

        const localParticipant = liveSession.participants.find((participant) => participant.isLocalPlayer);
        const localRecord = event.records.find((entry) => entry.participantId === localParticipant?.id)?.record;

        if (!localRecord) {
          return;
        }

        saveMatchRecord(localRecord);
        dispatchRoundFlow({ type: 'clear-awaiting-results' });
        clearActiveRound();
        setClassroomSession({
          ...liveSession,
          status: 'finished',
        });
        router.replace('/results');
      }
    });
  }, [clearActiveRound, classroomTransport, isClassroomMode, saveMatchRecord, setClassroomSession]);

  useEffect(() => {
    if (!hasHydrated || !isRecoveringWaitingRoom || !currentRoomRound) {
      return;
    }

    let isMounted = true;

    dispatchRoundFlow({ type: 'begin-awaiting-results' });

    void finalizeLiveRoomRound(currentRoomRound)
      .then((finalized) => {
        if (!isMounted) {
          return;
        }

        if (finalized.status === 'pending') {
          dispatchRoundFlow({ type: 'set-results-pending', value: true });
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

        dispatchRoundFlow({ type: 'set-results-pending', value: true });
        dispatchRoundFlow({
          message: error instanceof Error ? error.message : params.messages.loadError,
          type: 'set-load-error',
        });
      });

    return () => {
      isMounted = false;
    };
  }, [
    currentRoomRound,
    hasHydrated,
    isRecoveringWaitingRoom,
    leaveRoom,
    params.messages.loadError,
    persistResult,
    saveMatchRecord,
  ]);

  useEffect(() => {
    if (
      !isClassroomMode ||
      !currentClassroomSession ||
      currentClassroomSession.role !== 'host' ||
      !hasSubmittedClassroomRound ||
      !activeRoomRound ||
      !localClassroomParticipantId ||
      isPublishingClassroomResults
    ) {
      return;
    }

    if (!hasClassroomRoundSubmissionsForAllParticipants(currentClassroomSession.participants, classroomSubmissions)) {
      dispatchRoundFlow({ type: 'set-results-pending', value: true });
      return;
    }

    dispatchRoundFlow({ type: 'begin-classroom-publish' });

    const records = buildClassroomRoundResults({
      participants: currentClassroomSession.participants,
      round: activeRoomRound,
      submissionsByParticipantId: classroomSubmissions,
    });
    const localRecord = records.find((entry) => entry.participantId === localClassroomParticipantId)?.record;

    if (localRecord) {
      saveMatchRecord(localRecord);
    }

    clearActiveRound();
    dispatchRoundFlow({ type: 'clear-awaiting-results' });
    setClassroomSession({
      ...currentClassroomSession,
      status: 'finished',
    });

    void classroomTransport.publishEvent({
      records,
      roomCode: currentClassroomSession.roomCode,
      type: 'round-finished',
    })
      .catch((error) => {
        dispatchRoundFlow({
          message: error instanceof Error ? error.message : params.messages.loadError,
          type: 'set-load-error',
        });
      })
      .finally(() => {
        router.replace('/results');
      });
  }, [
    activeRoomRound,
    classroomSubmissions,
    classroomTransport,
    clearActiveRound,
    currentClassroomSession,
    hasSubmittedClassroomRound,
    isClassroomMode,
    isPublishingClassroomResults,
    localClassroomParticipantId,
    params.messages.loadError,
    saveMatchRecord,
    setClassroomSession,
  ]);

  const finishRound = useCallback(async () => {
    const result = buildQuizResult(questions, answerMap, {
      difficulty: roundDifficulty,
      mode: isRoomMode || isClassroomMode ? 'room' : 'solo',
      roomCode: currentClassroomSession?.roomCode ?? currentRoom?.roomCode,
      standingsBuilder: (finalScore) => (isRoomMode
        ? createRoomStandings(currentRoom!, finalScore)
        : isClassroomMode && currentClassroomSession
          ? currentClassroomSession.participants.map((participant) => ({
              isPlayer: participant.isLocalPlayer,
              name: participant.name,
              score: participant.isLocalPlayer ? finalScore : 0,
            }))
        : [
            {
              isPlayer: true,
              name: 'You',
              score: finalScore,
            },
          ]),
    });

    if (isClassroomMode && currentClassroomSession && localClassroomParticipantId) {
      const nextSubmissions = mergeClassroomRoundSubmission(classroomSubmissions, {
        answers: answerMap,
        participantId: localClassroomParticipantId,
      });

      dispatchRoundFlow({
        nextSubmissions,
        resultsPending: currentClassroomSession.participants.length > 1,
        type: 'submit-local-classroom-round',
      });

      if (currentClassroomSession.role !== 'host') {
        try {
          await classroomTransport.publishEvent({
            answers: answerMap,
            participantId: localClassroomParticipantId,
            roomCode: currentClassroomSession.roomCode,
            type: 'round-submitted',
          });
        } catch (error) {
          dispatchRoundFlow({
            message: error instanceof Error ? error.message : params.messages.loadError,
            type: 'set-load-error',
          });
          return;
        }
      }

      return;
    }

    if (isRoomMode && currentRoomRound?.source === 'supabase') {
      dispatchRoundFlow({ type: 'begin-awaiting-results' });

      try {
        const finalized = await finalizeLiveRoomRound(currentRoomRound, result);

        if (finalized.status === 'pending') {
          dispatchRoundFlow({ type: 'set-results-pending', value: true });
          return;
        }

        if (finalized.record) {
          saveMatchRecord(finalized.record);
        }
      } catch (error) {
        dispatchRoundFlow({ type: 'set-results-pending', value: true });
        dispatchRoundFlow({
          message: error instanceof Error ? error.message : params.messages.loadError,
          type: 'set-load-error',
        });
        return;
      }
    } else {
      persistResult(result);
    }

    if (currentRoom) {
      leaveRoom();
    }
    if (currentClassroomSession) {
      clearActiveRound();
      setClassroomSession({
        ...currentClassroomSession,
        status: 'finished',
      });
    }
    router.replace('/results');
  }, [
    answerMap,
    classroomSubmissions,
    classroomTransport,
    clearActiveRound,
    currentClassroomSession,
    currentRoom,
    currentRoomRound,
    isClassroomMode,
    isRoomMode,
    leaveRoom,
    localClassroomParticipantId,
    params.messages.loadError,
    persistResult,
    questions,
    roundDifficulty,
    saveMatchRecord,
    setClassroomSession,
  ]);

  const goNext = useCallback(async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((value) => value + 1);
      setSelectedIndex(null);
      setIsRevealed(false);
      setIsSubmittingAnswer(false);
      setTimeLeft(questionTimeLimit);
      return;
    }

    await finishRound();
  }, [currentIndex, finishRound, questionTimeLimit, questions.length]);

  const answerQuestion = useCallback((optionIndex: number, recordedTimeLeft: number) => {
    if (!question || isRevealed) {
      return;
    }

    setSelectedIndex(optionIndex);
    setAnswerMap((current) => ({
      ...current,
      [question.id]: {
        selectedIndex: optionIndex,
        timeLeft: recordedTimeLeft,
      },
    }));
    setIsRevealed(true);

    if (currentRoomRound?.source === 'supabase') {
      setIsSubmittingAnswer(true);
      void submitLiveRoomAnswer(currentRoomRound, question.id, optionIndex, Math.max(0, recordedTimeLeft * 1000))
        .then((submission) => {
          if (!submission) {
            return;
          }

          setAnswerMap((current) => ({
            ...current,
            [question.id]: {
              ...current[question.id],
              correctIndex: submission.isCorrect ? optionIndex : undefined,
              explanation: submission.explanation,
              isCorrect: submission.isCorrect,
            },
          }));
        })
        .catch(() => {
          setAnswerMap((current) => ({
            ...current,
            [question.id]: {
              ...current[question.id],
              explanation: params.messages.factPending,
              isCorrect: false,
            },
          }));
        })
        .finally(() => {
          setIsSubmittingAnswer(false);
        });

      return;
    }
  }, [currentRoomRound, isRevealed, params.messages.factPending, question]);

  const handleAnswer = useCallback(
    (optionIndex: number, recordedTimeLeft = timeLeft) => {
      answerQuestion(optionIndex, recordedTimeLeft);
    },
    [answerQuestion, timeLeft]
  );

  useEffect(() => {
    if (!question || isRevealed) {
      return undefined;
    }

    const timer = setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          clearInterval(timer);
          answerQuestion(-1, 0);
          return 0;
        }

        return value - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [answerQuestion, currentIndex, isRevealed, question]);

  const retryFinalize = useCallback(() => {
    void finishRound();
  }, [finishRound]);

  return {
    answerMap,
    currentIndex,
    currentClassroomSession,
    difficulty: roundDifficulty,
    currentRoom,
    currentRoomRound,
    goNext,
    handleAnswer,
    isClassroomMode,
    isAwaitingResults,
    isLoading,
    isRevealed,
    isRoomMode,
    isSubmittingAnswer,
    loadError,
    progress,
    question,
    questions,
    resultsPending,
    retryFinalize,
    selectedIndex,
    timeLeft,
    timeLimit: questionTimeLimit,
  };
}
