// Waiting for round results (live room finalize, classroom host) — shared by the room and
// classroom mode adapters.
import {
  mergeClassroomRoundSubmission,
  type ClassroomRoundSubmissions,
} from '../../classroom/classroom-round-authority';
import type { QuizAnswerMap } from '../types';

export type RoundFlowState = {
  classroomDeadlinePassed: boolean;
  classroomSubmissions: ClassroomRoundSubmissions;
  hasSubmittedClassroomRound: boolean;
  isAwaitingResults: boolean;
  isPublishingClassroomResults: boolean;
  loadError: string | null;
  resultsPending: boolean;
};

export type RoundFlowAction =
  | { type: 'begin-awaiting-results'; resultsPending?: boolean }
  | { type: 'begin-classroom-publish' }
  | { type: 'classroom-deadline-passed' }
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

export const initialRoundFlowState: RoundFlowState = {
  classroomDeadlinePassed: false,
  classroomSubmissions: {},
  hasSubmittedClassroomRound: false,
  isAwaitingResults: false,
  isPublishingClassroomResults: false,
  loadError: null,
  resultsPending: false,
};

export function roundFlowReducer(state: RoundFlowState, action: RoundFlowAction): RoundFlowState {
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
    case 'classroom-deadline-passed':
      return {
        ...state,
        classroomDeadlinePassed: true,
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
        classroomDeadlinePassed: false,
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
