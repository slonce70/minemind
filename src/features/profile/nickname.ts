const blockedFragments = ['admin', 'owner', 'mod', 'fuck', 'shit', 'sex', 'сука', 'хуй'];

export function validateNickname(rawValue: string) {
  const sanitizedValue = rawValue.trim().replace(/\s+/g, ' ');

  if (sanitizedValue.length < 2) {
    return { valid: false as const, reasonKey: 'errors.nicknameTooShort', sanitizedValue };
  }

  if (sanitizedValue.length > 16) {
    return { valid: false as const, reasonKey: 'errors.nicknameTooLong', sanitizedValue };
  }

  if (!/^[\p{L}\p{N}_ -]+$/u.test(sanitizedValue)) {
    return { valid: false as const, reasonKey: 'errors.nicknameInvalidChars', sanitizedValue };
  }

  const lowerCaseValue = sanitizedValue.toLowerCase();
  const hasBlockedFragment = blockedFragments.some((fragment) => lowerCaseValue.includes(fragment));

  if (hasBlockedFragment) {
    return { valid: false as const, reasonKey: 'errors.nicknameUnsafe', sanitizedValue };
  }

  return { valid: true as const, sanitizedValue };
}
