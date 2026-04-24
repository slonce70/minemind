import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildClassroomInviteQrMatrix,
  buildClassroomInviteToken,
  parseClassroomInviteInput,
} from '../src/features/classroom/classroom-invite';

test('buildClassroomInviteToken encodes room code, host address, and port into one token', () => {
  const token = buildClassroomInviteToken({
    hostAddress: '192.168.0.42',
    port: 36735,
    roomCode: 'CLASS1',
  });

  assert.equal(token, 'minemind://classroom?host=192.168.0.42&port=36735&roomCode=CLASS1');
});

test('parseClassroomInviteInput accepts a full invite token', () => {
  const parsed = parseClassroomInviteInput(
    'minemind://classroom?host=192.168.0.42&port=36735&roomCode=CLASS1'
  );

  assert.deepEqual(parsed, {
    hostAddress: '192.168.0.42',
    port: 36735,
    roomCode: 'CLASS1',
  });
});

test('parseClassroomInviteInput accepts a raw host endpoint without losing the port', () => {
  const parsed = parseClassroomInviteInput('192.168.0.42:36735');

  assert.deepEqual(parsed, {
    hostAddress: '192.168.0.42',
    port: 36735,
    roomCode: undefined,
  });
});

test('buildClassroomInviteQrMatrix returns a scannable square matrix for invite tokens', () => {
  const token = buildClassroomInviteToken({
    hostAddress: '192.168.0.42',
    port: 36735,
    roomCode: 'CLASS1',
  });
  const matrix = buildClassroomInviteQrMatrix(token);

  assert.ok(matrix.size >= 21);
  assert.equal(matrix.cells.length, matrix.size);
  assert.equal(matrix.cells[0]?.length, matrix.size);
  assert.equal(matrix.cells[0]?.[0], true);
  assert.equal(matrix.cells[0]?.[matrix.size - 1], true);
  assert.equal(matrix.cells[matrix.size - 1]?.[0], true);
});
