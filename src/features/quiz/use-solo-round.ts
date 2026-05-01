import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import {
  buildClassroomRoundResults,
  hasClassroomRoundSubmissionsForAllParticipants,
  mergeClassroomRoundSubmission,
  type ClassroomRoundSubmissions,
} from '../classroom/classroom-round-authority';
import { finalizeClassroomRound } from '../classroom/use-classroom-round';
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
import { startLiveSoloRound } from './live-quiz-service';
import { buildQuizResult, getSoloQuestionSet } from './quiz-service';
import type { QuizAnswerMap, QuizResultSummary } from './types';

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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(questionTimeLimit);
  const [answerMap, setAnswerMap] = useState<QuizAnswerMap>({});
  const [isAwaitingResults, setIsAwaitingResults] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [resultsPending, setResultsPending] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [classroomSubmissions, setClassroomSubmissions] = useState<ClassroomRoundSubmissions>({});
  const [hasSubmittedClassroomRound, setHasSubmittedClassroomRound] = useState(false);
  const [isPublishingClassroomResults, setIsPublishingClassroomResults] = useState(false);
  const classroomTransport = getSharedLocalHostTransport();
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
          syncStatus: isLiveRoomResult ? 'synced' : 'local-only',
          transport: isLiveRoomResult ? 'supabase' : 'local',
        })
      );
    },
    [currentClassroomSession, currentRoomRound?.source, isClassroomMode, isRoomMode, saveMatchRecord]
  );

  useEffect(() => {
    if (!isClassroomMode) {
      return;
    }

    setClassroomSubmissions({});
    setHasSubmittedClassroomRound(false);
    setIsPublishingClassroomResults(false);
  }, [currentClassroomSession?.id, activeRoomRound?.roomCode, isClassroomMode]);

  useEffect(() => {
    let isMounted = true;

    const loadQuestions = async () => {
      if (!hasHydrated) {
        return;
      }

      if (isRoomMode) {
        setIsLoading(true);
        setLoadError(null);

        if (!currentRoom) {
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        if (activeRoomRound && !isRecoveringWaitingRoom) {
          if (isMounted) {
            setQuestions(activeRoomRound.questions);
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
          }
        } catch (error) {
          if (isMounted) {
            setLoadError(error instanceof Error ? error.message : params.messages.loadError);
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
        setLoadError(null);

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
          }
        } catch (error) {
          if (isMounted) {
            setLoadError(error instanceof Error ? error.message : params.messages.loadError);
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }

        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const fallbackDifficulty = currentRoom?.settings.difficulty ?? selectedDifficulty;
        const nextQuestions = isSupabaseConfigured
          ? await startLiveSoloRound(params.locale as 'uk' | 'en' | 'ru')
          : getSoloQuestionSet(params.locale as 'uk' | 'en' | 'ru', 8, fallbackDifficulty);

        if (isMounted) {
          setQuestions(nextQuestions);
        }
      } catch (error) {
        if (isMounted) {
          setQuestions(
            getSoloQuestionSet(
              params.locale as 'uk' | 'en' | 'ru',
              8,
              currentRoom?.settings.difficulty ?? selectedDifficulty
            )
          );
          setLoadError(error instanceof Error ? error.message : params.messages.loadError);
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
        setClassroomSubmissions((current) =>
          mergeClassroomRoundSubmission(current, {
            answers: event.answers,
            participantId: event.participantId,
          })
        );
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
        setResultsPending(false);
        setIsAwaitingResults(false);
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

    setIsAwaitingResults(true);
    setResultsPending(false);
    setLoadError(null);

    void finalizeLiveRoomRound(currentRoomRound)
      .then((finalized) => {
        if (!isMounted) {
          return;
        }

        if (finalized.status === 'pending') {
          setResultsPending(true);
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

        setResultsPending(true);
        setLoadError(error instanceof Error ? error.message : params.messages.loadError);
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
      setResultsPending(true);
      return;
    }

    setIsPublishingClassroomResults(true);

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
    setResultsPending(false);
    setIsAwaitingResults(false);
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
        setLoadError(error instanceof Error ? error.message : params.messages.loadError);
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

  const finishRound = async () => {
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

      setClassroomSubmissions(nextSubmissions);
      setHasSubmittedClassroomRound(true);
      setIsAwaitingResults(true);
      setResultsPending(currentClassroomSession.participants.length > 1);
      setLoadError(null);

      if (currentClassroomSession.role !== 'host') {
        try {
          await classroomTransport.publishEvent({
            answers: answerMap,
            participantId: localClassroomParticipantId,
            roomCode: currentClassroomSession.roomCode,
            type: 'round-submitted',
          });
        } catch (error) {
          setLoadError(error instanceof Error ? error.message : params.messages.loadError);
          return;
        }
      }

      return;
    }

    if (isRoomMode && currentRoomRound?.source === 'supabase') {
      setIsAwaitingResults(true);
      setResultsPending(false);
      setLoadError(null);

      try {
        const finalized = await finalizeLiveRoomRound(currentRoomRound, result);

        if (finalized.status === 'pending') {
          setResultsPending(true);
          return;
        }

        if (finalized.record) {
          saveMatchRecord(finalized.record);
        }
      } catch (error) {
        setResultsPending(true);
        setLoadError(error instanceof Error ? error.message : params.messages.loadError);
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
  };

  const goNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((value) => value + 1);
      setSelectedIndex(null);
      setIsRevealed(false);
      setIsSubmittingAnswer(false);
      setTimeLeft(questionTimeLimit);
      return;
    }

    await finishRound();
  };

  const handleAnswer = (optionIndex: number, recordedTimeLeft = timeLeft) => {
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
  };

  useEffect(() => {
    setTimeLeft(questionTimeLimit);
  }, [questionTimeLimit]);

  useEffect(() => {
    if (!question || isRevealed) {
      return undefined;
    }

    const timer = setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          clearInterval(timer);
          handleAnswer(-1, 0);
          return 0;
        }

        return value - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, isRevealed, question]);

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
    retryFinalize: () => void finishRound(),
    selectedIndex,
    timeLeft,
    timeLimit: questionTimeLimit,
  };
}
