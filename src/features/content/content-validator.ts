import { z } from 'zod';

import { isItemSpriteId } from '../ui/item-sprites';
import {
  contentAgeBands,
  contentCategoryIds,
  contentDifficulties,
  contentLocales,
  contentTopics,
  questionKinds,
  type ContentQuestionBank,
  type ContentQuestionRecord,
  type LocalizedString,
} from './types';

export const minecraftLocalizedStringSchema: z.ZodType<LocalizedString> = z.strictObject(
  Object.fromEntries(contentLocales.map((locale) => [locale, z.string().min(1)])) as Record<
    (typeof contentLocales)[number],
    z.ZodString
  >
);

export const minecraftAgeBandSchema = z.enum(contentAgeBands);

export const minecraftDifficultySchema = z.enum(contentDifficulties);

export const minecraftCategorySchema = z.enum(contentCategoryIds);

export const minecraftTopicSchema = z.enum(contentTopics);

const itemSpriteSchema = z.string().refine(isItemSpriteId, 'unknown item sprite');

export const questionMediaSchema = z.discriminatedUnion('type', [
  z.strictObject({ sprite: itemSpriteSchema, type: z.literal('picture') }),
  z.strictObject({
    grid: z.array(itemSpriteSchema.nullable()).length(9),
    missingSlot: z.number().int().min(0).max(8),
    type: z.literal('recipe'),
  }),
]);

export const minecraftQuestionRecordSchema: z.ZodType<ContentQuestionRecord> = z.strictObject({
    ageBand: minecraftAgeBandSchema,
    categoryId: minecraftCategorySchema,
    correctIndex: z.number().int().min(0).max(3),
    difficulty: minecraftDifficultySchema,
    explanation: minecraftLocalizedStringSchema,
    id: z.string().trim().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    isActive: z.boolean(),
    kind: z.enum(questionKinds).optional(),
    media: questionMediaSchema.optional(),
    optionIcons: z.array(itemSpriteSchema).optional(),
    options: z.array(minecraftLocalizedStringSchema).min(2).max(4),
    prompt: minecraftLocalizedStringSchema,
    sourceVersion: z.string().trim().regex(/^[a-z0-9]+(?:[-.][a-z0-9]+)*$/),
    tags: z.array(z.string().trim().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)).min(1),
    topicId: minecraftTopicSchema,
}).superRefine((record, ctx) => {
    const uniqueTags = new Set(record.tags);

    if (uniqueTags.size !== record.tags.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'tags must not contain duplicates',
        path: ['tags'],
      });
    }

    if (record.correctIndex < 0 || record.correctIndex >= record.options.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'correctIndex must point at one of the options',
        path: ['correctIndex'],
      });
    }

    for (const issue of questionShapeIssues(record)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: issue, path: [] });
    }
  });

/** What each question type needs: true-false has two options, the rest four; media must match. */
export function questionShapeIssues(record: Pick<ContentQuestionRecord, 'kind' | 'media' | 'optionIcons' | 'options'>) {
  const kind = record.kind ?? 'choice';
  const issues: string[] = [];
  const expectedOptions = kind === 'true-false' ? 2 : 4;

  if (record.options.length !== expectedOptions) {
    issues.push(`${kind} questions need ${expectedOptions} options`);
  }

  if ((kind === 'picture') !== (record.media?.type === 'picture')) {
    issues.push('picture questions (and only they) carry a picture');
  }

  if (kind === 'recipe') {
    if (record.media?.type !== 'recipe') {
      issues.push('recipe questions need a recipe grid');
    } else if (record.media.grid[record.media.missingSlot] !== null) {
      issues.push('the missing recipe slot must be empty');
    }

    if (record.optionIcons?.length !== record.options.length) {
      issues.push('recipe questions need an item icon per option');
    }
  } else if (record.media?.type === 'recipe') {
    issues.push('only recipe questions carry a recipe grid');
  }

  return issues;
}

// Below this many records the distribution is too noisy to judge.
const minRecordsForCorrectIndexCheck = 40;
const maxCorrectIndexShare = 0.35;
const minCorrectIndexShare = 0.15;

/** Returns a message when the correct answer sits in one position too often (or too rarely). */
export function findCorrectIndexSkew(
  records: (Pick<ContentQuestionRecord, 'correctIndex'> & Partial<Pick<ContentQuestionRecord, 'options'>>)[]
) {
  // True/false keeps "true" first, so only four-option questions are judged.
  const fourOption = records.filter((record) => (record.options?.length ?? 4) === 4);

  if (fourOption.length < minRecordsForCorrectIndexCheck) {
    return null;
  }

  const counts = [0, 0, 0, 0];
  fourOption.forEach((record) => {
    counts[record.correctIndex] += 1;
  });
  const shares = counts.map((count) => count / fourOption.length);

  if (shares.every((share) => share >= minCorrectIndexShare && share <= maxCorrectIndexShare)) {
    return null;
  }

  return `correctIndex distribution is skewed: ${counts.join('/')} for positions 0/1/2/3`;
}

export const minecraftQuestionBankSchema: z.ZodType<ContentQuestionBank> = z
  .array(minecraftQuestionRecordSchema)
  .min(1)
  .superRefine((records, ctx) => {
    const seenIds = new Set<string>();

    records.forEach((record, index) => {
      if (seenIds.has(record.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'question ids must be unique across the bank',
          path: [index, 'id'],
        });
        return;
      }

      seenIds.add(record.id);
    });

    const skew = findCorrectIndexSkew(records);

    if (skew) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: skew,
        path: [],
      });
    }
  });

export type MinecraftQuestionRecord = z.infer<typeof minecraftQuestionRecordSchema>;

export type MinecraftQuestionBank = z.infer<typeof minecraftQuestionBankSchema>;

export function validateQuestionBank(input: unknown): MinecraftQuestionBank {
  return minecraftQuestionBankSchema.parse(input);
}
