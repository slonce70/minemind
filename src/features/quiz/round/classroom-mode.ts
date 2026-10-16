import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { useAppStore } from '../../../state/app-store';
import {
  buildClassroomRoundResults,
  hasClassroomRoundSubmissionsForAllParticipants,
  mergeClassroomRoundSubmission,
  recordClassroomAnswer,
  type ClassroomRoundSubmissions,
} from '../../classroom/classroom-round-authority';
import { getSharedLocalHostTransport } from '../../classroom/local-host-transport';
import { getSoloQuestionSet } from '../quiz-service';
import type { ModeContext, ModeController } from './mode-types';
import { initialRoundFlowState, roundFlowReducer } from './round-flow';

/**
 * Classroom over the local network. The host device is the authority: guests get questions
 * without answers, send each answer to the host (answer-submitted) and receive the verdict
 * (answer-revealed); the host scores everyone and publishes round-finished.
 */
export function useClassroomMode({ dispatch, enabled, locale, messages, round, timeLimit }: ModeContext) {
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const saveMatchRecord = useAppStore((state) => state.saveMatchRecord);
  const activeRoomRound = useAppStore((state) => state.activeRoomRound);
  const classroomSession = useAppStore((state) => state.classroomSession);
  const profile = useAppStore((state) => state.profile);
  const selectedDifficulty = useAppStore((state) => state.selectedDifficulty);
  const setClassroomSession = useAppStore((state) => state.setClassroomSession);
  const clearActiveRound = useAppStore((state) => state.clearActiveRound);
  const [flow, dispatchFlow] = useReducer(roundFlowReducer, initialRoundFlowState);
  const [isLoading, setIsLoading] = useState(true);
  const classroomTransport = useMemo(() => getSharedLocalHostTransport(), []);
  // Host only: guest answers as the host recorded them, one per question (never the guest's own verdict).
  const hostRecordedAnswersRef = useRef<ClassroomRoundSubmissions>({});
  const currentClassroomSession = enabled ? classroomSession : undefined;
  const localClassroomParticipantId =
    currentClassroomSession?.participants.find((participant) => participant.isLocalPlayer)?.id ??
    profile?.nickname.toLowerCase().replace(/\s+/g, '-');
  const isGuest = currentClassroomSession?.role === 'participant';
  const {
    classroomDeadlinePassed,
    classroomSubmissions,
    hasSubmittedClassroomRound,
    isPublishingClassroomResults,
  } = flow;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    hostRecordedAnswersRef.current = {};
    dispatchFlow({ type: 'reset-classroom-round' });
  }, [currentClassroomSession?.id, activeRoomRound?.roomCode, enabled]);

  // Load once per session round; later session updates (roster changes) must not restart it.
  const loadedRoundRef = useRef<unknown>(null);

  useEffect(() => {
    if (!enabled || !hasHydrated) {
      return;
    }

    if (!currentClassroomSession) {
      setIsLoading(false);
      return;
    }

    const roundQuestions = activeRoomRound?.source === 'classroom' ? activeRoomRound.questions : null;
    const loadKey = roundQuestions ?? currentClassroomSession.id;

    if (loadedRoundRef.current === loadKey) {
      return;
    }

    loadedRoundRef.current = loadKey;
    dispatchFlow({ type: 'clear-load-error' });

    try {
      dispatch({
        awaitsVerdict: currentClassroomSession.role === 'participant',
        questions:
          roundQuestions ?? getSoloQuestionSet(locale, 8, currentClassroomSession.difficulty ?? selectedDifficulty),
        timeLimit,
        type: 'load',
      });
    } catch (error) {
      dispatchFlow({ message: error instanceof Error ? error.message : messages.loadError, type: 'set-load-error' });
    } finally {
      setIsLoading(false);
    }
  }, [
    activeRoomRound,
    currentClassroomSession,
    dispatch,
    enabled,
    hasHydrated,
    locale,
    messages.loadError,
    selectedDifficulty,
    timeLimit,
  ]);

  useEffect(() => {
    if (!enabled) {
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

      if (event.type === 'answer-submitted' && liveSession.role === 'host') {
        const liveRound = useAppStore.getState().activeRoomRound;
        const recorded = liveRound
          ? recordClassroomAnswer(hostRecordedAnswersRef.current[event.participantId] ?? {}, liveRound, event)
          : null;

        if (!recorded) {
          return;
        }

        hostRecordedAnswersRef.current = {
          ...hostRecordedAnswersRef.current,
          [event.participantId]: recorded.answers,
        };
        void classroomTransport.publishEvent({
          ...recorded.reveal,
          participantId: event.participantId,
          questionId: event.questionId,
          roomCode: liveSession.roomCode,
          type: 'answer-revealed',
        }).catch(() => undefined);
        return;
      }

      if (event.type === 'answer-revealed' && liveSession.role !== 'host') {
        const localParticipant = liveSession.participants.find((participant) => participant.isLocalPlayer);

        if (event.participantId !== localParticipant?.id) {
          return;
        }

        dispatch({
          questionId: event.questionId,
          type: 'verdict',
          verdict: { correctIndex: event.correctIndex, explanation: event.explanation, isCorrect: event.isCorrect },
        });
        return;
      }

      if (event.type === 'round-submitted' && liveSession.role === 'host') {
        // The guest's own answer map is ignored: it could claim anything.
        dispatchFlow({
          answers: hostRecordedAnswersRef.current[event.participantId] ?? {},
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
        dispatchFlow({ type: 'clear-awaiting-results' });
        clearActiveRound();
        setClassroomSession({
          ...liveSession,
          status: 'finished',
        });
        router.replace('/results');
      }
    });
  }, [clearActiveRound, classroomTransport, dispatch, enabled, saveMatchRecord, setClassroomSession]);

  // Guest: hand the answer to the host, who replies with answer-revealed.
  const pendingAnswer = enabled && isGuest ? round.pendingAnswer : null;

  useEffect(() => {
    if (!pendingAnswer || !currentClassroomSession || !localClassroomParticipantId) {
      return;
    }

    dispatch({ type: 'answer-sent' });
    void classroomTransport.publishEvent({
      participantId: localClassroomParticipantId,
      questionId: pendingAnswer.questionId,
      roomCode: currentClassroomSession.roomCode,
      selectedIndex: pendingAnswer.optionIndex,
      timeLeft: pendingAnswer.timeLeft,
      type: 'answer-submitted',
    }).catch(() => {
      dispatch({
        explanation: messages.factPending,
        markWrong: false,
        questionId: pendingAnswer.questionId,
        type: 'verdict-failed',
      });
    });
  }, [classroomTransport, currentClassroomSession, dispatch, localClassroomParticipantId, messages.factPending, pendingAnswer]);

  // Host: publish everyone's results once all guests handed in (or the deadline passed).
  useEffect(() => {
    if (
      !currentClassroomSession ||
      currentClassroomSession.role !== 'host' ||
      !hasSubmittedClassroomRound ||
      !activeRoomRound ||
      !localClassroomParticipantId ||
      isPublishingClassroomResults
    ) {
      return;
    }

    if (
      !classroomDeadlinePassed &&
      !hasClassroomRoundSubmissionsForAllParticipants(currentClassroomSession.participants, classroomSubmissions)
    ) {
      dispatchFlow({ type: 'set-results-pending', value: true });
      return;
    }

    dispatchFlow({ type: 'begin-classroom-publish' });

    // After the deadline, guests who never finished are scored on what they answered so far.
    const records = buildClassroomRoundResults({
      participants: currentClassroomSession.participants,
      round: activeRoomRound,
      submissionsByParticipantId: {
        ...hostRecordedAnswersRef.current,
        ...classroomSubmissions,
      },
    });
    const localRecord = records.find((entry) => entry.participantId === localClassroomParticipantId)?.record;

    if (localRecord) {
      saveMatchRecord(localRecord);
    }

    clearActiveRound();
    dispatchFlow({ type: 'clear-awaiting-results' });
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
        dispatchFlow({ message: error instanceof Error ? error.message : messages.loadError, type: 'set-load-error' });
      })
      .finally(() => {
        router.replace('/results');
      });
  }, [
    activeRoomRound,
    classroomDeadlinePassed,
    classroomSubmissions,
    classroomTransport,
    clearActiveRound,
    currentClassroomSession,
    hasSubmittedClassroomRound,
    isPublishingClassroomResults,
    localClassroomParticipantId,
    messages.loadError,
    saveMatchRecord,
    setClassroomSession,
  ]);

  const finish = useCallback(async () => {
    if (!currentClassroomSession || !localClassroomParticipantId) {
      return;
    }

    dispatchFlow({
      nextSubmissions: mergeClassroomRoundSubmission(classroomSubmissions, {
        answers: round.answerMap,
        participantId: localClassroomParticipantId,
      }),
      resultsPending: currentClassroomSession.participants.length > 1,
      type: 'submit-local-classroom-round',
    });

    if (currentClassroomSession.role !== 'host') {
      try {
        await classroomTransport.publishEvent({
          answers: round.answerMap,
          participantId: localClassroomParticipantId,
          roomCode: currentClassroomSession.roomCode,
          type: 'round-submitted',
        });
      } catch (error) {
        dispatchFlow({ message: error instanceof Error ? error.message : messages.loadError, type: 'set-load-error' });
      }
    }
  }, [
    classroomSubmissions,
    classroomTransport,
    currentClassroomSession,
    localClassroomParticipantId,
    messages.loadError,
    round.answerMap,
  ]);

  // Host: stop waiting for guests once the round deadline passes.
  const classroomEndsAt = currentClassroomSession?.role === 'host' ? activeRoomRound?.endsAt : undefined;

  useEffect(() => {
    if (!classroomEndsAt) {
      return undefined;
    }

    const deadlineTimer = setTimeout(
      () => dispatchFlow({ type: 'classroom-deadline-passed' }),
      Math.max(0, Date.parse(classroomEndsAt) - Date.now())
    );

    return () => clearTimeout(deadlineTimer);
  }, [classroomEndsAt]);

  return {
    controller: {
      finish,
      isAwaitingResults: flow.isAwaitingResults,
      isLoading,
      loadError: flow.loadError,
      resultsPending: flow.resultsPending,
      retryFinalize: () => void finish(),
    } satisfies ModeController,
    currentClassroomSession,
  };
}
