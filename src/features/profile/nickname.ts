import { checkNickname, type NicknameProblem } from '../../../supabase/functions/_shared/nickname-rules';

const reasonKeys: Record<NicknameProblem, string> = {
  'invalid-chars': 'errors.nicknameInvalidChars',
  'too-long': 'errors.nicknameTooLong',
  'too-short': 'errors.nicknameTooShort',
  unsafe: 'errors.nicknameUnsafe',
};

export function validateNickname(rawValue: string) {
  const result = checkNickname(rawValue);

  if (!result.ok) {
    return { valid: false as const, reasonKey: reasonKeys[result.problem], sanitizedValue: result.value };
  }

  return { valid: true as const, sanitizedValue: result.value };
}
