// Error codes returned by Edge Functions as `{ code, error }`. Shared with the app (no Deno or
// npm imports here), which translates the code instead of showing the English `error` text.

export const apiErrorStatus = {
  answer_already_submitted: 409,
  host_only: 403,
  invalid_nickname: 400,
  invalid_request: 400,
  no_active_round: 409,
  no_questions: 503,
  not_enough_players: 409,
  not_room_member: 403,
  players_not_ready: 409,
  question_not_open: 409,
  question_not_in_round: 400,
  rate_limited: 429,
  room_closed: 409,
  room_full: 409,
  room_in_progress: 409,
  room_not_found: 404,
  round_not_found: 404,
  round_over: 409,
  server_error: 500,
  unauthorized: 401,
} as const;

export type ApiErrorCode = keyof typeof apiErrorStatus;

export const apiErrorCodes = Object.keys(apiErrorStatus) as ApiErrorCode[];

export function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return typeof value === 'string' && value in apiErrorStatus;
}

/** An expected failure the player can understand; anything else is reported as `server_error`. */
export class GameError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string = code
  ) {
    super(message);
    this.name = 'GameError';
  }
}
