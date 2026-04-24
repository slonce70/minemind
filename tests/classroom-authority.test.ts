import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildClassroomRoundResults,
  hasClassroomRoundSubmissionsForAllParticipants,
  mergeClassroomRoundSubmission,
} from '../src/features/classroom/classroom-round-authority';
import { buildClassroomRoundManifest } from '../src/features/classroom/classroom-session-sync';
import type { QuizAnswerMap, QuizQuestion } from '../src/features/quiz/types';
import type { RoomParticipant } from '../src/features/rooms/types';

function buildAnswerMap(questions: QuizQuestion[], answers: number[]): QuizAnswerMap {
  return Object.fromEntries(
    answers.map((selectedIndex, index) => [
      questions[index]?.id ?? `q-${index}`,
      {
        correctIndex: questions[index]?.correctIndex ?? 0,
        explanation: `Fact ${index}`,
        isCorrect: selectedIndex === (questions[index]?.correctIndex ?? 0),
        selectedIndex,
        timeLeft: Math.max(0, 10 - index),
      },
    ])
  );
}

test('host can track whether every classroom participant has submitted the round', () => {
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
  const questions: QuizQuestion[] = [
    { correctIndex: 0, explanation: 'Fact 0', id: 'q-0', options: ['A', 'B'], prompt: 'Q0' },
    { correctIndex: 1, explanation: 'Fact 1', id: 'q-1', options: ['A', 'B'], prompt: 'Q1' },
  ];
  const hostSubmission = mergeClassroomRoundSubmission({}, {
    answers: buildAnswerMap(questions, [0, 1]),
    participantId: 'teacher-fox',
  });

  assert.equal(hasClassroomRoundSubmissionsForAllParticipants(participants, hostSubmission), false);

  const fullSubmissionSet = mergeClassroomRoundSubmission(hostSubmission, {
    answers: buildAnswerMap(questions, [0, 0]),
    participantId: 'stone-bee',
  });

  assert.equal(hasClassroomRoundSubmissionsForAllParticipants(participants, fullSubmissionSet), true);
});

test('buildClassroomRoundResults fans out truthful classroom records for every participant', () => {
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
  const round = buildClassroomRoundManifest({
    difficulty: 'medium',
    locale: 'uk',
    roomCode: 'CLASS1',
  });
  const correctIndexes = round.questions.map((question) => question.correctIndex ?? 0);
  const records = buildClassroomRoundResults({
    participants,
    round,
    submissionsByParticipantId: {
      'stone-bee': buildAnswerMap(
        round.questions,
        correctIndexes.map((index, idx) => (idx < 4 ? index : (index + 1) % 4))
      ),
      'teacher-fox': buildAnswerMap(round.questions, correctIndexes),
    },
  });

  assert.equal(records.length, 2);

  const hostRecord = records.find((entry) => entry.participantId === 'teacher-fox')?.record;
  const guestRecord = records.find((entry) => entry.participantId === 'stone-bee')?.record;

  assert.ok(hostRecord);
  assert.ok(guestRecord);
  assert.equal(hostRecord?.mode, 'classroom');
  assert.equal(guestRecord?.mode, 'classroom');
  assert.equal(hostRecord?.transport, 'lan-host');
  assert.equal(guestRecord?.transport, 'lan-host');
  assert.equal(hostRecord?.participants.length, 2);
  assert.equal(guestRecord?.participants.length, 2);
  assert.equal(hostRecord?.participants.find((entry) => entry.isPlayer)?.name, 'TeacherFox');
  assert.equal(guestRecord?.participants.find((entry) => entry.isPlayer)?.name, 'StoneBee');
  assert.equal((hostRecord?.score ?? 0) > (guestRecord?.score ?? 0), true);
  assert.equal((hostRecord?.participants[0]?.score ?? 0) >= (hostRecord?.participants[1]?.score ?? 0), true);
});
