import assert from 'node:assert/strict';
import test from 'node:test';

import { createDefaultRoomMatchSettings } from '../src/features/rooms/room-match-settings';

test('room match settings default to medium difficulty and 8 questions', () => {
  const settings = createDefaultRoomMatchSettings();

  assert.equal(settings.difficulty, 'medium');
  assert.equal(settings.questionCount, 8);
  assert.equal(settings.contentPackVersion, 'minecraft-v1');
  assert.equal(settings.topicMode, 'mixed');
});
