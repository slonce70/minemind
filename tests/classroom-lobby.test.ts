import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { finalizeClassroomRound } from '../src/features/classroom/use-classroom-round';
import { normalizeClassroomResult } from '../src/features/results/recover-room-result';
import type { QuizResultSummary } from '../src/features/quiz/types';
import type { RoomParticipant } from '../src/features/rooms/types';

function buildClassroomSummary(overrides?: Partial<QuizResultSummary>): QuizResultSummary {
  return {
    bestStreak: 4,
    breakdown: [],
    completedAt: '2026-04-19T15:00:00.000Z',
    correctAnswers: 7,
    difficulty: 'medium',
    mode: 'room',
    questionCount: 8,
    roomCode: 'CLASS1',
    score: 812,
    speedBonus: 112,
    standings: [
      {
        isPlayer: true,
        name: 'TeacherFox',
        score: 812,
      },
      {
        isPlayer: false,
        name: 'StoneBee',
        score: 700,
      },
    ],
    ...overrides,
  };
}

test('classroom session records use host-device authority and lan-host transport', () => {
  const record = normalizeClassroomResult(buildClassroomSummary());

  assert.equal(record.mode, 'classroom');
  assert.equal(record.transport, 'lan-host');
  assert.equal(record.authority, 'host-device');
  assert.equal(record.syncStatus, 'local-only');
  assert.match(record.id, /^classroom:/);
});

test('completed classroom rounds persist as local-only classroom MatchRecords', () => {
  const participants: RoomParticipant[] = [
    {
      avatarId: 'fox',
      id: 'teacher-fox',
      isHost: true,
      isLocalPlayer: true,
      name: 'TeacherFox',
      ready: true,
    },
    {
      avatarId: 'bee',
      id: 'stone-bee',
      isHost: false,
      isLocalPlayer: false,
      name: 'StoneBee',
      ready: true,
    },
  ];
  const record = finalizeClassroomRound(buildClassroomSummary(), participants);

  assert.equal(record.mode, 'classroom');
  assert.equal(record.syncStatus, 'local-only');
  assert.equal(record.transport, 'lan-host');
  assert.equal(record.participants.length, 2);
  assert.match(record.id, /^classroom:/);
});

test('classroom route offers host and join flows without Supabase', () => {
  const source = readFileSync(new URL('../app/classroom.tsx', import.meta.url), 'utf8');

  assert.match(source, /useClassroomLobby/);
  assert.match(source, /host session/i);
  assert.match(source, /join session/i);
  assert.match(source, /classroomSession\?\.status === 'active'/);
  assert.match(source, /\/solo\?mode=classroom/);
});

test('solo classroom flow waits for host-authoritative round completion', () => {
  const source = readFileSync(new URL('../src/features/quiz/use-solo-round.ts', import.meta.url), 'utf8');

  assert.match(source, /getSharedLocalHostTransport/);
  assert.match(source, /round-submitted/);
  assert.match(source, /round-finished/);
});

test('classroom lobby builds and shares a single invite token for host sessions', () => {
  const hookSource = readFileSync(new URL('../src/features/classroom/use-classroom-lobby.ts', import.meta.url), 'utf8');
  const viewSource = readFileSync(new URL('../src/features/classroom/classroom-lobby-view.tsx', import.meta.url), 'utf8');

  assert.match(hookSource, /buildClassroomInviteToken/);
  assert.match(hookSource, /Share\.share/);
  assert.match(hookSource, /parseClassroomInviteInput/);
  assert.match(viewSource, /inviteToken/);
  assert.match(viewSource, /onShareInvite/);
});

test('classroom lobby keeps ready controls and host start gating in the UI flow', () => {
  const hookSource = readFileSync(new URL('../src/features/classroom/use-classroom-lobby.ts', import.meta.url), 'utf8');
  const viewSource = readFileSync(new URL('../src/features/classroom/classroom-lobby-view.tsx', import.meta.url), 'utf8');

  assert.match(hookSource, /participant-ready/);
  assert.match(hookSource, /handleToggleReady/);
  assert.match(viewSource, /readySummary/);
  assert.match(viewSource, /toggleReady/);
  assert.match(viewSource, /disabled=\{isStartDisabled\}/);
});
