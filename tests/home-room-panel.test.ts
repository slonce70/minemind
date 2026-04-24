import assert from 'node:assert/strict';
import test from 'node:test';

import { getHomeRoomPanelModel } from '../src/features/home/home-room-panel';

const strings = {
  activeRoomCopy: 'Code 7A6AJF, 4 players. Jump back into the lobby and start the match.',
  activeRoomTitle: 'Active room',
  roomCardCopy: 'Create a room code, invite friends, and start once everyone is ready.',
  roomCardTitle: 'Play with friends',
};

test('active rooms collapse to a single primary home panel', () => {
  const panel = getHomeRoomPanelModel({ hasActiveRoom: true, strings });

  assert.deepEqual(panel, {
    actionVariant: 'primary',
    copy: strings.activeRoomCopy,
    title: strings.activeRoomTitle,
  });
});

test('empty room state keeps the invite panel on home', () => {
  const panel = getHomeRoomPanelModel({ hasActiveRoom: false, strings });

  assert.deepEqual(panel, {
    actionVariant: 'secondary',
    copy: strings.roomCardCopy,
    title: strings.roomCardTitle,
  });
});
