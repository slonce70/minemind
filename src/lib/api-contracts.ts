import { z } from 'zod';

export const quizQuestionSchema = z.object({
  correctIndex: z.number().optional(),
  explanation: z.string().optional(),
  id: z.string(),
  options: z.array(z.string()).min(2),
  prompt: z.string(),
});

const difficultySchema = z.enum(['easy', 'medium', 'hard']);
export const roomStatusSchema = z.enum(['lobby', 'active', 'waiting', 'finalizing', 'finished']);
const legacyRoomStatusSchema = z.enum(['active', 'completed', 'finalizing', 'finished', 'lobby', 'waiting']);

export const roomParticipantSchema = z.object({
  avatar_id: z.string(),
  nickname: z.string(),
  player_id: z.string(),
  ready_state: z.boolean(),
});

const legacyRoomResponseSchema = z.object({
  content_pack_version: z.string().nullable().optional(),
  current_round_id: z.string().nullable().optional(),
  difficulty: difficultySchema.optional(),
  host_id: z.string(),
  id: z.string(),
  question_count: z.literal(8).nullable().optional(),
  room_code: z.string(),
  status: legacyRoomStatusSchema,
  topic_mode: z.enum(['mixed']).nullable().optional(),
});

export const roomStateSchema = z.object({
  contentPackVersion: z.string().min(1),
  difficulty: difficultySchema,
  participants: z.array(roomParticipantSchema),
  questionCount: z.literal(8),
  roomCode: z.string().min(1),
  status: roomStatusSchema,
  topicMode: z.literal('mixed'),
});

export const soloRoundSchema = z.object({
  contentPackVersion: z.string().min(1),
  difficulty: difficultySchema,
  questions: z.array(quizQuestionSchema).length(8),
});

const legacyStartSoloRoundResponseSchema = z.object({
  pack: z.object({
    id: z.string(),
    title: z.string(),
  }),
  questions: z.array(quizQuestionSchema),
});

export const startRoomRoundResponseSchema = z.object({
  participants: z.array(roomParticipantSchema),
  questions: z.array(quizQuestionSchema).min(1),
  room: legacyRoomResponseSchema.extend({
    status: roomStatusSchema,
  }),
  roomCode: z.string().min(1),
    round: z.object({
      content_pack_version: z.string().nullable().optional(),
      difficulty: difficultySchema.optional(),
      ends_at: z.string().nullable().optional(),
      id: z.string(),
      question_count: z.literal(8).nullable().optional(),
      question_ids: z.array(z.string()).min(1),
      room_id: z.string(),
      started_at: z.string(),
      topic_mode: z.enum(['mixed']).nullable().optional(),
    }),
});

export function parseStartSoloRoundResponse(input: unknown) {
  try {
    const parsed = z.union([legacyStartSoloRoundResponseSchema, soloRoundSchema]).parse(input);

    if ('pack' in parsed) {
      return {
        contentPackVersion: parsed.pack.id,
        difficulty: 'medium' as const,
        pack: parsed.pack,
        questions: parsed.questions,
      };
    }

    return {
      contentPackVersion: parsed.contentPackVersion,
      difficulty: parsed.difficulty,
      pack: {
        id: parsed.contentPackVersion,
        title: parsed.contentPackVersion,
      },
      questions: parsed.questions,
    };
  } catch {
    throw new Error('Invalid start solo round response');
  }
}

export function parseCreateOrJoinRoomResponse(input: unknown) {
  try {
    return z.object({
      participants: z.array(roomParticipantSchema),
      room: legacyRoomResponseSchema,
    }).parse(input);
  } catch {
    throw new Error('Invalid room state response');
  }
}

export function parseStartRoomRoundResponse(input: unknown) {
  try {
    return startRoomRoundResponseSchema.parse(input);
  } catch {
    throw new Error('Invalid room round response');
  }
}

export function parseFinalizeRoomResponse(input: unknown) {
  try {
    return z.object({
      rankings: z.array(
        z.object({
          best_streak: z.number(),
          correct_count: z.number(),
          nickname: z.string(),
          player_id: z.string(),
          rank: z.number(),
          round_id: z.string(),
          score: z.number(),
        })
      ),
      roomId: z.string(),
      roundId: z.string(),
      status: z.enum(['completed', 'pending']),
    }).parse(input);
  } catch {
    throw new Error('Invalid finalize round response');
  }
}
