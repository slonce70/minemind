import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { createRoomStandings } from '../rooms/demo-room-service';
import {
  finalizeLiveRoomRound,
  resumeLiveRoomRound,
  submitLiveRoomAnswer,
} from '../rooms/live-room-service';
import { useAppStore } from '../../state/app-store';
import { isSupabaseConfigured } from '../../lib/supabase';
import { difficultyConfig } from '../content/difficulty-config';
import { startLiveSoloRound } from './live-quiz-service';
import { buildQuizResult, getSoloQuestionSet } from './quiz-service';
import type { QuizAnswerMap } from './types';

export function useSoloRound(params: {
  locale: string;
  messages: {
    factPending: string;
    loadError: string;
  };
  mode?: string;
}) {
  const saveLastResult = useAppStore((state) => state.saveLastResult);
  const activeRoom = useAppStore((state) => state.activeRoom);
  const activeRoomRound = useAppStore((state) => state.activeRoomRound);
  const leaveRoom = useAppStore((state) => state.leaveRoom);
  const selectedDifficulty = useAppStore((state) => state.selectedDifficulty);
  const setActiveRoom = useAppStore((state) => state.setActiveRoom);
  const setActiveRoomRound = useAppStore((state) => state.setActiveRoomRound);
  const clearActiveRound = useAppStore((state) => state.clearActiveRound);
  const roundDifficulty =
    activeRoom?.settings.difficulty ??
    activeRoom?.difficulty ??
    activeRoomRound?.difficulty ??
    selectedDifficulty;
  const questionTimeLimit = difficultyConfig[roundDifficulty].timerSeconds;
  const [questions, setQuestions] = useState(() =>
    params.mode === 'room' && activeRoomRound ? activeRoomRound.questions : []
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

  const question = questions[currentIndex];
  const progress = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;
  const isRoomMode = params.mode === 'room';
  const currentRoom = isRoomMode ? activeRoom : undefined;
  const currentRoomRound = isRoomMode ? activeRoomRound : undefined;

  useEffect(() => {
    let isMounted = true;

    const loadQuestions = async () => {
      if (isRoomMode) {
        setIsLoading(true);
        setLoadError(null);

        if (!currentRoom) {
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        if (activeRoomRound) {
          if (isMounted) {
            setQuestions(activeRoomRound.questions);
            setIsLoading(false);
          }
          return;
        }

        if (!isSupabaseConfigured || currentRoom.status !== 'active') {
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
    currentRoom,
    isRoomMode,
    params.locale,
    params.messages.loadError,
    selectedDifficulty,
    setActiveRoom,
    setActiveRoomRound,
  ]);

  useEffect(() => {
    if (!currentRoom) {
      return;
    }

    if (currentRoom.status !== 'active' && currentRoomRound) {
      clearActiveRound();
    }
  }, [clearActiveRound, currentRoom, currentRoomRound]);

  const finishRound = async () => {
    const provisionalResult = buildQuizResult(questions, answerMap);
    const result = buildQuizResult(questions, answerMap, {
      difficulty: roundDifficulty,
      mode: isRoomMode ? 'room' : 'solo',
      roomCode: currentRoom?.roomCode,
      standings: isRoomMode
        ? createRoomStandings(currentRoom!, provisionalResult.score)
        : [
            {
              isPlayer: true,
              name: 'You',
              score: provisionalResult.score,
            },
          ],
    });

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

        saveLastResult(finalized.result);
      } catch (error) {
        setResultsPending(true);
        setLoadError(error instanceof Error ? error.message : params.messages.loadError);
        return;
      }
    } else {
      saveLastResult(result);
    }

    if (currentRoom) {
      leaveRoom();
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
          setTimeout(() => {
            void goNext();
          }, 1100);
        });

      return;
    }

    setTimeout(() => {
      void goNext();
    }, 1100);
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
    difficulty: roundDifficulty,
    currentRoom,
    currentRoomRound,
    handleAnswer,
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
