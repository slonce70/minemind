import assert from 'node:assert/strict';
import test from 'node:test';

import { buildRecoveredRoomResult } from '../src/features/results/recover-room-result';

test('buildRecoveredRoomResult reconstructs player-facing room results from server rankings', () => {
  const result = buildRecoveredRoomResult(
    {
      difficulty: 'hard',
      mode: 'room',
      questions: [
        { id: 'q1', options: ['A', 'B'], prompt: 'Question 1', explanation: 'Explain 1' },
        { id: 'q2', options: ['A', 'B'], prompt: 'Question 2', explanation: 'Explain 2' },
      ],
      roomCode: 'AB12CD',
      roundId: 'round-1',
      source: 'supabase',
    },
    [
      {
        best_streak: 2,
        correct_count: 2,
        nickname: 'BlockFox',
        player_id: 'player-1',
        rank: 1,
        round_id: 'round-1',
        score: 236,
      },
      {
        best_streak: 1,
        correct_count: 1,
        nickname: 'PixelBee',
        player_id: 'player-2',
        rank: 2,
        round_id: 'round-1',
        score: 112,
      },
    ],
    'player-1'
  );

  assert.equal(result.mode, 'room');
  assert.equal(result.roomCode, 'AB12CD');
  assert.equal(result.difficulty, 'hard');
  assert.equal(result.questionCount, 2);
  assert.equal(result.correctAnswers, 2);
  assert.equal(result.bestStreak, 2);
  assert.equal(result.score, 236);
  assert.equal(result.speedBonus, 36);
  assert.deepEqual(result.breakdown, []);
  assert.equal(result.syncStatus, 'synced');
  assert.equal(result.transport, 'supabase');
  assert.equal(result.participants[0]?.isPlayer, true);
});
