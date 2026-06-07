import { z } from 'zod';

import {
  canonScopes,
  masterQuestionReviewStatuses,
  translationStatuses,
} from './master-types';
import {
  contentDifficulties,
  contentTopics,
} from './types';

const sourceRecordSchema = z.strictObject({
  accessedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  evidenceNote: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(['wiki', 'official-article', 'official-release-note', 'technical-reference']),
  url: z.url(),
});

const sourceRegisterEntrySchema = z.strictObject({
  accessedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  canonScope: z.enum(canonScopes),
  id: z.string().trim().min(1),
  notes: z.string().min(1),
  title: z.string().min(1),
  topics: z.array(z.enum(contentTopics)).min(1),
  type: z.enum(['wiki', 'official-article', 'official-release-note', 'technical-reference']),
  url: z.url(),
});

const slotBlueprintEntrySchema = z.strictObject({
  clusterId: z.string().trim().min(1),
  difficulty: z.enum(contentDifficulties),
  targetCount: z.number().int().positive(),
  topicId: z.enum(contentTopics),
});

const localizedMasterPayloadSchema = z.strictObject({
  explanation: z.string().trim().min(1),
  options: z.tuple([
    z.string().trim().min(1),
    z.string().trim().min(1),
    z.string().trim().min(1),
    z.string().trim().min(1),
  ]),
  prompt: z.string().trim().min(1),
});

const masterQuestionRecordSchema = z.strictObject({
  ageBand: z.literal('8-12'),
  canonScope: z.enum(canonScopes),
  categoryId: z.literal('minecraft'),
  clusterId: z.string().trim().min(1),
  correctAnswer: z.string().trim().min(1),
  difficulty: z.enum(contentDifficulties),
  distractors: z.tuple([
    z.string().trim().min(1),
    z.string().trim().min(1),
    z.string().trim().min(1),
  ]),
  explanationEn: z.string().trim().min(1),
  id: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  isActive: z.boolean(),
  localized: z.strictObject({
    en: localizedMasterPayloadSchema,
    uk: localizedMasterPayloadSchema,
    ru: localizedMasterPayloadSchema.optional(),
  }),
  notes: z.string().trim().min(1).optional(),
  promptEn: z.string().trim().min(1),
  reviewNotes: z.string().trim().min(1).optional(),
  reviewStatus: z.enum(masterQuestionReviewStatuses),
  sourceVersion: z.string().trim().regex(/^[a-z0-9]+(?:[-.][a-z0-9]+)*$/),
  sources: z.array(sourceRecordSchema).min(1, 'at least one source is required'),
  tags: z.array(z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)).min(1),
  topicId: z.enum(contentTopics),
  translationStatus: z.enum(translationStatuses),
  versionGated: z.boolean(),
});

export const masterQuestionProgramSchema = z.strictObject({
  sourceRegister: z.array(sourceRegisterEntrySchema),
  slotBlueprint: z.array(slotBlueprintEntrySchema),
  masterBank: z.array(masterQuestionRecordSchema),
});

export type MasterQuestionProgram = z.infer<typeof masterQuestionProgramSchema>;

export function validateMasterQuestionProgram(input: unknown): MasterQuestionProgram {
  return masterQuestionProgramSchema.parse(input);
}
