import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseStartSoloRoundResponse,
  roomStateSchema,
  soloRoundSchema,
} from '../src/lib/api-contracts';

test('room state schema accepts difficulty and content pack metadata', () => {
  const parsed = roomStateSchema.parse({
    contentPackVersion: 'minecraft-v1',
    difficulty: 'medium',
    participants: [],
    questionCount: 8,
    roomCode: 'AB12CD',
    status: 'lobby',
    topicMode: 'mixed',
  });

  assert.equal(parsed.difficulty, 'medium');
  assert.equal(parsed.contentPackVersion, 'minecraft-v1');
  assert.equal(parsed.questionCount, 8);
  assert.equal(parsed.topicMode, 'mixed');
});

test('solo round schema accepts future difficulty and content pack metadata', () => {
  const parsed = soloRoundSchema.parse({
    contentPackVersion: 'minecraft-v1',
    difficulty: 'easy',
    questions: Array.from({ length: 8 }, (_, index) => ({
      id: `q-${index}`,
      options: ['A', 'B', 'C', 'D'],
      prompt: `Question ${index}`,
    })),
  });

  assert.equal(parsed.questions.length, 8);
  assert.equal(parsed.difficulty, 'easy');
});

test('start solo round parser rejects malformed payloads', () => {
  assert.throws(() => parseStartSoloRoundResponse({ questions: 'nope' }), /Invalid/);
});
