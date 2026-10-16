import { useCallback, useEffect, useReducer } from 'react';

import type { AppLocale } from '../../lib/locale';
import { useAppStore } from '../../state/app-store';
import { difficultyConfig } from '../content/difficulty-config';
import { useClassroomMode } from './round/classroom-mode';
import type { ModeContext } from './round/mode-types';
import { useRoomMode } from './round/room-mode';
import { initialRoundState, roundReducer } from './round/round-machine';
import { useSoloMode } from './round/solo-mode';

/**
 * One round on screen: the shared question flow (round-machine) driven by the adapter of the
 * current mode — solo (local), room (live server or offline demo) or classroom (local network).
 */
export function useSoloRound(params: {
  locale: string;
  messages: {
    factPending: string;
    loadError: string;
  };
  mode?: string;
}) {
  const activeRoom = useAppStore((state) => state.activeRoom);
  const activeRoomRound = useAppStore((state) => state.activeRoomRound);
  const classroomSession = useAppStore((state) => state.classroomSession);
  const selectedDifficulty = useAppStore((state) => state.selectedDifficulty);
  const isRoomMode = params.mode === 'room';
  const isClassroomMode = params.mode === 'classroom';
  const roundDifficulty =
    classroomSession?.difficulty ??
    activeRoom?.settings.difficulty ??
    activeRoom?.difficulty ??
    activeRoomRound?.difficulty ??
    selectedDifficulty;
  const timeLimit = difficultyConfig[roundDifficulty].timerSeconds;
  // Room and classroom rounds are already in the store: show them on the very first render.
  const [round, dispatch] = useReducer(roundReducer, initialRoundState, (initial) =>
    (isRoomMode || isClassroomMode) && activeRoomRound
      ? roundReducer(initial, {
          answers: activeRoomRound.answers,
          awaitsVerdict: false,
          questions: activeRoomRound.questions,
          timeLimit,
          type: 'load',
        })
      : initial
  );
  const context: Omit<ModeContext, 'enabled'> = {
    difficulty: roundDifficulty,
    dispatch,
    locale: params.locale as AppLocale,
    messages: params.messages,
    round,
    timeLimit,
  };
  const solo = useSoloMode({ ...context, enabled: !isRoomMode && !isClassroomMode });
  const room = useRoomMode({ ...context, enabled: isRoomMode });
  const classroom = useClassroomMode({ ...context, enabled: isClassroomMode });
  const mode = isRoomMode ? room.controller : isClassroomMode ? classroom.controller : solo;
  const question = round.questions[round.currentIndex];
  // Live rooms run on the server timeline instead of the local countdown and "next" button.
  const isTimelineDriven = Boolean(room.timeline);
  const hasOpenQuestion = Boolean(question) && !round.isRevealed && !isTimelineDriven;
  const questionTotal = room.timeline ? (room.currentRoomRound?.timeline?.questionCount ?? 0) : round.questions.length;

  // The countdown only dispatches ticks; the machine decides when time is up.
  useEffect(() => {
    if (!hasOpenQuestion) {
      return undefined;
    }

    const timer = setInterval(() => dispatch({ type: 'tick' }), 1000);

    return () => clearInterval(timer);
  }, [hasOpenQuestion, round.currentIndex]);

  const { finish } = mode;
  const goNext = useCallback(async () => {
    if (isTimelineDriven) {
      return;
    }

    if (round.currentIndex < round.questions.length - 1) {
      dispatch({ type: 'next' });
      return;
    }

    await finish();
  }, [finish, isTimelineDriven, round.currentIndex, round.questions.length]);

  const handleAnswer = useCallback(
    (optionIndex: number, recordedTimeLeft = round.timeLeft) => {
      dispatch({ optionIndex, timeLeft: recordedTimeLeft, type: 'answer' });
    },
    [round.timeLeft]
  );

  return {
    answerMap: round.answerMap,
    currentClassroomSession: classroom.currentClassroomSession,
    currentIndex: round.currentIndex,
    currentRoom: room.currentRoom,
    currentRoomRound: room.currentRoomRound,
    difficulty: roundDifficulty,
    goNext,
    handleAnswer,
    isAwaitingResults: mode.isAwaitingResults,
    isClassroomMode,
    isLoading: mode.isLoading,
    isRevealed: round.isRevealed,
    isRoomMode,
    isSubmittingAnswer: round.isSubmittingAnswer,
    loadError: mode.loadError,
    progress: questionTotal > 0 ? Math.round(((round.currentIndex + 1) / questionTotal) * 100) : 0,
    question,
    questionTotal,
    questions: round.questions,
    roomTimeline: room.timeline,
    resultsPending: mode.resultsPending,
    retryFinalize: mode.retryFinalize,
    selectedIndex: round.selectedIndex,
    timeLeft: round.timeLeft,
    timeLimit,
  };
}
