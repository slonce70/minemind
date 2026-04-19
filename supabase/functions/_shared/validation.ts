const blockedFragments = ['admin', 'owner', 'mod', 'fuck', 'shit', 'sex', 'сука', 'хуй'];
export const roomStatusValues = ['lobby', 'active', 'waiting', 'finalizing', 'finished'] as const;
export type RoomStatus = (typeof roomStatusValues)[number];

export function normalizeNickname(rawValue: string) {
  return rawValue.trim().replace(/\s+/g, ' ');
}

export function assertSafeNickname(rawValue: string) {
  const candidate = normalizeNickname(rawValue);

  if (candidate.length < 2 || candidate.length > 16) {
    throw new Error('Nickname must be between 2 and 16 characters.');
  }

  if (!/^[\p{L}\p{N}_ -]+$/u.test(candidate)) {
    throw new Error('Nickname contains invalid characters.');
  }

  const lowerCaseCandidate = candidate.toLowerCase();
  const blocked = blockedFragments.some((fragment) => lowerCaseCandidate.includes(fragment));

  if (blocked) {
    throw new Error('Nickname contains blocked words.');
  }

  return candidate;
}

export function assertRoomStatus(value: string): RoomStatus {
  if (!roomStatusValues.includes(value as RoomStatus)) {
    throw new Error('Invalid room status.');
  }

  return value as RoomStatus;
}
