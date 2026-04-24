import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  roomStatusSchema,
  roomStateSchema,
  startRoomRoundResponseSchema,
} from '../src/lib/api-contracts';

test('room status schema accepts canonical waiting and finished states', () => {
  assert.equal(roomStatusSchema.parse('waiting'), 'waiting');
  assert.equal(roomStatusSchema.parse('finished'), 'finished');

  const parsedRoom = roomStateSchema.parse({
    contentPackVersion: 'minecraft-v1',
    difficulty: 'hard',
    participants: [],
    questionCount: 8,
    roomCode: 'AB12CD',
    status: 'waiting',
    topicMode: 'mixed',
  });

  assert.equal(parsedRoom.status, 'waiting');
});

test('start room round response carries canonical room status and round manifest fields', () => {
  const parsed = startRoomRoundResponseSchema.parse({
    participants: [],
    questions: Array.from({ length: 8 }, (_, index) => ({
      id: `q-${index}`,
      options: ['A', 'B', 'C', 'D'],
      prompt: `Question ${index}`,
    })),
    room: {
      content_pack_version: 'minecraft-v1',
      current_round_id: 'round-1',
      difficulty: 'medium',
      host_id: 'host-1',
      id: 'room-1',
      question_count: 8,
      room_code: 'AB12CD',
      status: 'active',
      topic_mode: 'mixed',
    },
    roomCode: 'AB12CD',
    round: {
      content_pack_version: 'minecraft-v1',
      difficulty: 'medium',
      ends_at: null,
      id: 'round-1',
      question_ids: Array.from({ length: 8 }, (_, index) => `q-${index}`),
      room_id: 'room-1',
      started_at: '2026-04-19T10:00:00.000Z',
    },
  });

  assert.equal(parsed.room.status, 'active');
  assert.equal(parsed.round.id, 'round-1');
  assert.equal(parsed.round.content_pack_version, 'minecraft-v1');
  assert.equal(parsed.questions.length, 8);
});

test('create and join room contracts require canonical room settings metadata', () => {
  const parsed = roomStateSchema.parse({
    contentPackVersion: 'minecraft-v1',
    difficulty: 'hard',
    participants: [],
    questionCount: 8,
    roomCode: 'AB12CD',
    status: 'lobby',
    topicMode: 'mixed',
  });

  assert.equal(parsed.difficulty, 'hard');
  assert.equal(parsed.questionCount, 8);
  assert.equal(parsed.topicMode, 'mixed');
});

test('room shared selector includes settings columns for live rooms', () => {
  const roomHelperSource = readFileSync(
    new URL('../supabase/functions/_shared/rooms.ts', import.meta.url),
    'utf8'
  );
  const createRoomSource = readFileSync(
    new URL('../supabase/functions/create-room/index.ts', import.meta.url),
    'utf8'
  );

  assert.match(roomHelperSource, /content_pack_version/);
  assert.match(roomHelperSource, /difficulty/);
  assert.match(roomHelperSource, /question_count/);
  assert.match(roomHelperSource, /topic_mode/);
  assert.match(createRoomSource, /parseRoomMatchSettingsPayload/);
});
