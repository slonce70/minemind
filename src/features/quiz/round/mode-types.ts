import type { Dispatch } from 'react';

import type { AppLocale } from '../../../lib/locale';
import type { ContentDifficulty } from '../../content/types';
import type { RoundAction, RoundState } from './round-machine';

/** What every mode adapter gets from useSoloRound. Adapters for inactive modes stay idle. */
export type ModeContext = {
  difficulty: ContentDifficulty;
  dispatch: Dispatch<RoundAction>;
  enabled: boolean;
  locale: AppLocale;
  messages: { factPending: string; loadError: string };
  round: RoundState;
  timeLimit: number;
};

/** What useSoloRound needs back from the active mode. */
export type ModeController = {
  /** Called after the last question: score, persist or hand in the round. */
  finish: () => Promise<void>;
  isAwaitingResults: boolean;
  isLoading: boolean;
  loadError: string | null;
  resultsPending: boolean;
  retryFinalize: () => void;
};
