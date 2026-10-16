import { GameError } from './error-codes.ts';
import { checkNickname } from './nickname-rules.ts';

export { normalizeNickname } from './nickname-rules.ts';

export const roomStatusValues = ['lobby', 'active', 'waiting', 'finalizing', 'finished'] as const;
export type RoomStatus = (typeof roomStatusValues)[number];

const nicknameErrors = {
  'invalid-chars': 'Nickname contains invalid characters.',
  'too-long': 'Nickname must be between 2 and 16 characters.',
  'too-short': 'Nickname must be between 2 and 16 characters.',
  unsafe: 'Nickname contains blocked words.',
} as const;

export function assertSafeNickname(rawValue: string) {
  const result = checkNickname(rawValue);

  if (!result.ok) {
    throw new GameError('invalid_nickname', nicknameErrors[result.problem]);
  }

  return result.value;
}

export function assertRoomStatus(value: string): RoomStatus {
  if (!roomStatusValues.includes(value as RoomStatus)) {
    throw new Error('Invalid room status.');
  }

  return value as RoomStatus;
}
