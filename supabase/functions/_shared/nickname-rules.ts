// Nickname rules shared by the app and the Edge Functions (no Deno or npm imports here).
// The SQL check `nickname_is_allowed` mirrors them as a last line of defence.

export const nicknameMinLength = 2;
export const nicknameMaxLength = 16;

export type NicknameProblem = 'too-short' | 'too-long' | 'invalid-chars' | 'unsafe';

export type NicknameCheck =
  | { ok: true; value: string }
  | { ok: false; problem: NicknameProblem; value: string };

/**
 * Blocked only as a whole word, so ordinary words that contain them stay allowed:
 * "Modern", "Essex", "Sextant", "Commodore" pass, "Mod King", "ModKing" and "admin_1" do not.
 */
export const reservedNicknameWords = [
  'admin',
  'administrator',
  'hitler',
  'minemind',
  'mod',
  'moderator',
  'mojang',
  'microsoft',
  'nazi',
  'official',
  'owner',
  'sex',
  'sexy',
  'staff',
  'support',
] as const;

/**
 * Blocked anywhere in the name. Each root was checked against everyday uk/ru/en words, which is
 * why short or ambiguous ones ("ебан" in "небанальний", "хуя" in "страхуя") are not on the list.
 */
export const profanityRoots = [
  'bitch',
  'cunt',
  'fuck',
  'nigga',
  'nigger',
  'porn',
  'shit',
  'whore',
  'бляд',
  'блять',
  'гандон',
  'ебать',
  'залуп',
  'курва',
  'мудак',
  'пидор',
  'пизд',
  'підор',
  'сука',
  'хуй',
  'шлюх',
] as const;

const leetLetters: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', $: 's' };

export function normalizeNickname(rawValue: string) {
  return rawValue.trim().replace(/\s+/g, ' ');
}

/** Words of a nickname: split on anything that is not a letter and on camelCase humps. */
export function nicknameWords(value: string) {
  return value
    .replace(/(\p{Ll})(\p{Lu})/gu, '$1 $2')
    .toLowerCase()
    .split(/[^\p{L}]+/u)
    .filter(Boolean);
}

function foldLeet(value: string) {
  return value.replace(/[013457@$]/g, (character) => leetLetters[character] ?? character);
}

export function isNicknameSafe(value: string) {
  const variants = [value, foldLeet(value)];

  return variants.every((variant) => {
    const words = nicknameWords(variant);
    // "f u c k" is caught by gluing single letters back together; normal words are checked one by
    // one so that two innocent words cannot form a root across the gap.
    const pieces = words.every((word) => word.length <= 2) ? [...words, words.join('')] : words;

    return (
      !words.some((word) => (reservedNicknameWords as readonly string[]).includes(word)) &&
      !pieces.some((piece) => profanityRoots.some((root) => piece.includes(root)))
    );
  });
}

export function checkNickname(rawValue: string): NicknameCheck {
  const value = normalizeNickname(rawValue);

  if (value.length < nicknameMinLength) {
    return { ok: false, problem: 'too-short', value };
  }

  if (value.length > nicknameMaxLength) {
    return { ok: false, problem: 'too-long', value };
  }

  if (!/^[\p{L}\p{N}_ -]+$/u.test(value)) {
    return { ok: false, problem: 'invalid-chars', value };
  }

  if (!isNicknameSafe(value)) {
    return { ok: false, problem: 'unsafe', value };
  }

  return { ok: true, value };
}
