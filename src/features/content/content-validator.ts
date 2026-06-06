import { z } from 'zod';

import {
  contentAgeBands,
  contentCategoryIds,
  contentDifficulties,
  contentLocales,
  contentTopics,
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

export const minecraftQuestionRecordSchema: z.ZodType<ContentQuestionRecord> = z.strictObject({
    ageBand: minecraftAgeBandSchema,
    categoryId: minecraftCategorySchema,
    correctIndex: z.number().int().min(0).max(3),
    difficulty: minecraftDifficultySchema,
    explanation: minecraftLocalizedStringSchema,
    id: z.string().trim().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    isActive: z.boolean(),
    options: z.tuple([
      minecraftLocalizedStringSchema,
      minecraftLocalizedStringSchema,
      minecraftLocalizedStringSchema,
      minecraftLocalizedStringSchema,
    ]),
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

    if (record.correctIndex < 0 || record.correctIndex > 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'correctIndex must point at one of the four options',
        path: ['correctIndex'],
      });
    }
  });

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
  });

export type MinecraftQuestionRecord = z.infer<typeof minecraftQuestionRecordSchema>;

export type MinecraftQuestionBank = z.infer<typeof minecraftQuestionBankSchema>;

export function validateQuestionBank(input: unknown): MinecraftQuestionBank {
  return minecraftQuestionBankSchema.parse(input);
}
