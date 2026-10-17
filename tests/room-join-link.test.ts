import assert from 'node:assert/strict';
import test from 'node:test';

import { buildRoomJoinUrl, parseRoomCode } from '../src/features/rooms/room-join-link';

test('room join links work on the web and with the app scheme', () => {
  assert.equal(buildRoomJoinUrl('https://minemind.example/', 'AB12CD'), 'https://minemind.example/rooms?join=AB12CD');
  assert.equal(buildRoomJoinUrl('minemind://', 'AB12CD'), 'minemind://rooms?join=AB12CD');
});

test('a room code is read from a link or typed on its own, nothing else', () => {
  assert.equal(parseRoomCode('https://minemind.example/rooms?join=ab12cd'), 'AB12CD');
  assert.equal(parseRoomCode('minemind://rooms?join=AB12CD&x=1'), 'AB12CD');
  assert.equal(parseRoomCode(' ab12cd '), 'AB12CD');
  assert.equal(parseRoomCode('https://evil.example/?join=AB12CDE'), null);
  assert.equal(parseRoomCode('hello'), null);
  assert.equal(parseRoomCode(undefined), null);
});
