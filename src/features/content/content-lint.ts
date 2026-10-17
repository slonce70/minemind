import { findCorrectIndexSkew } from './content-validator';
import { contentLocales, type ContentLocale, type ContentQuestionRecord } from './types';

export const contentLintLimits = {
  explanationMaxLength: 180,
  optionMaxLength: 32,
  promptMaxLength: 120,
} as const;

const cyrillic = /[А-Яа-яЁёІіЇїЄєҐґ]/;
const latinWord = /[A-Za-z]{3,}/;
const russianOnlyLetters = /[ЫыЭэЪъЁё]/;
const ukrainianOnlyLetters = /[ІіЇїЄєҐґ]/;

function normalize(value: string, locale: ContentLocale) {
  return value.toLocaleLowerCase(locale).replace(/[’'`]/g, '').replace(/\s+/g, ' ').trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Whole-word match, so "3" is not found inside "30". */
function containsAnswer(prompt: string, answer: string, locale: ContentLocale) {
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(normalize(answer, locale))}($|[^\\p{L}\\p{N}])`, 'u').test(
    normalize(prompt, locale)
  );
}

function checkScript(text: string, locale: ContentLocale): string | null {
  if (locale === 'en') {
    return cyrillic.test(text) ? 'en text contains cyrillic letters' : null;
  }

  if (!/\p{L}/u.test(text)) {
    return null;
  }

  if (!cyrillic.test(text) || latinWord.test(text)) {
    return `${locale} text is not written in cyrillic`;
  }

  if (locale === 'uk' && russianOnlyLetters.test(text)) {
    return 'uk text contains russian-only letters (ы, э, ъ, ё)';
  }

  if (locale === 'ru' && ukrainianOnlyLetters.test(text)) {
    return 'ru text contains ukrainian-only letters (і, ї, є, ґ)';
  }

  return null;
}

/**
 * Editorial lint for the runtime bank: short prompts and options, the right alphabet per locale,
 * a real russian translation, no answer inside its own question, no duplicates, balanced answers.
 */
export function lintQuestionBank(records: ContentQuestionRecord[]) {
  const issues: string[] = [];
  const seenPrompts = new Map<string, string>();

  for (const record of records) {
    const report = (message: string) => issues.push(`${record.id}: ${message}`);

    for (const locale of contentLocales) {
      const prompt = record.prompt[locale];
      const options = record.options.map((option) => option[locale]);
      const explanation = record.explanation[locale];
      const correct = options[record.correctIndex];

      if (prompt.length > contentLintLimits.promptMaxLength) {
        report(`${locale} prompt is ${prompt.length} chars (max ${contentLintLimits.promptMaxLength})`);
      }

      if (explanation.length > contentLintLimits.explanationMaxLength) {
        report(`${locale} explanation is ${explanation.length} chars (max ${contentLintLimits.explanationMaxLength})`);
      }

      options.forEach((option) => {
        if (option.length > contentLintLimits.optionMaxLength) {
          report(`${locale} option "${option}" is longer than ${contentLintLimits.optionMaxLength} chars`);
        }
      });

      if (new Set(options.map((option) => normalize(option, locale))).size !== options.length) {
        report(`${locale} options are not distinct`);
      }

      [prompt, explanation, ...options].forEach((text) => {
        const scriptIssue = checkScript(text, locale);

        if (scriptIssue) {
          report(`${scriptIssue}: "${text}"`);
        }
      });

      if (record.kind !== 'true-false' && containsAnswer(prompt, correct, locale)) {
        report(`${locale} prompt contains the correct answer "${correct}"`);
      }

      const promptKey = `${locale}:${normalize(prompt, locale)}`;
      const duplicateOf = seenPrompts.get(promptKey);

      if (duplicateOf) {
        report(`${locale} prompt duplicates ${duplicateOf}`);
      } else {
        seenPrompts.set(promptKey, record.id);
      }
    }

    if (record.prompt.ru === record.prompt.uk || record.explanation.ru === record.explanation.uk) {
      report('ru text is a copy of uk, not a russian translation');
    }
  }

  const skew = findCorrectIndexSkew(records);

  if (skew) {
    issues.push(skew);
  }

  return issues;
}
