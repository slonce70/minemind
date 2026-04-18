import { z } from 'zod';

const QuizQuestionSchema = z.object({
  correctIndex: z.number().optional(),
  explanation: z.string().optional(),
  id: z.string(),
  options: z.array(z.string()).min(2),
  prompt: z.string(),
});

const RoomParticipantResponseSchema = z.object({
  avatar_id: z.string(),
  nickname: z.string(),
  player_id: z.string(),
  ready_state: z.boolean(),
});

const RoomResponseSchema = z.object({
  current_round_id: z.string().nullable().optional(),
  host_id: z.string(),
  id: z.string(),
  room_code: z.string(),
  status: z.enum(['active', 'completed', 'waiting']),
});

export function parseStartSoloRoundResponse(input: unknown) {
  try {
    return z.object({
      pack: z.object({
        id: z.string(),
        title: z.string(),
      }),
      questions: z.array(QuizQuestionSchema),
    }).parse(input);
  } catch {
    throw new Error('Invalid start solo round response');
  }
}

export function parseCreateOrJoinRoomResponse(input: unknown) {
  try {
    return z.object({
      participants: z.array(RoomParticipantResponseSchema),
      room: RoomResponseSchema,
    }).parse(input);
  } catch {
    throw new Error('Invalid room state response');
  }
}

export function parseStartRoomRoundResponse(input: unknown) {
  try {
    return z.object({
      participants: z.array(RoomParticipantResponseSchema),
      questions: z.array(QuizQuestionSchema),
      room: RoomResponseSchema,
      roomCode: z.string(),
      round: z.object({
        ends_at: z.string().nullable().optional(),
        id: z.string(),
        question_ids: z.array(z.string()),
        room_id: z.string(),
        started_at: z.string(),
      }),
    }).parse(input);
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
