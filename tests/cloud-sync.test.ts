import assert from 'node:assert/strict';
import test from 'node:test';

import { syncProgressWith, type ProgressRemote, type RemoteProgress } from '../src/features/progress/cloud-sync';
import { createEmptyProgress, type PlayerProgress } from '../src/features/progress/progression';

function memoryRemote(initial: RemoteProgress | null) {
  let row = initial;
  let version = 0;
  const writes: PlayerProgress[] = [];
  const remote: ProgressRemote & { beforeWrite?: () => void } = {
    fetch: async () => row && { ...row },
    insert: async (progress) => {
      remote.beforeWrite?.();

      if (row) {
        return false;
      }

      writes.push(progress);
      row = { progress, updated_at: `v${(version += 1)}` };
      return true;
    },
    update: async (progress, expected) => {
      remote.beforeWrite?.();

      if (!row || row.updated_at !== expected) {
        return false;
      }

      writes.push(progress);
      row = { progress, updated_at: `v${(version += 1)}` };
      return true;
    },
  };

  return { remote, row: () => row, writes };
}

const withXp = (xp: number, extra: Partial<PlayerProgress> = {}): PlayerProgress => ({
  ...createEmptyProgress(new Date('2026-10-17T10:00:00Z')),
  xp,
  ...extra,
});

test('first sync uploads the device progress', async () => {
  const store = memoryRemote(null);
  const result = await syncProgressWith(store.remote, withXp(120));

  assert.equal(result.xp, 120);
  assert.equal((store.row()?.progress as PlayerProgress).xp, 120);
});

test('bigger progress wins both ways and nothing is written when the cloud is up to date', async () => {
  const store = memoryRemote({ progress: withXp(500, { cards: { sprout: 2 } }), updated_at: 'v0' });
  const result = await syncProgressWith(store.remote, withXp(80, { cards: { pebble: 1 } }));

  assert.equal(result.xp, 500);
  assert.deepEqual(result.cards, { pebble: 1, sprout: 2 });
  assert.equal(store.writes.length, 1);

  await syncProgressWith(store.remote, result);
  assert.equal(store.writes.length, 1, 'an equal copy is not rewritten');
});

test('a write that loses a race re-reads and keeps the other device progress', async () => {
  const store = memoryRemote({ progress: withXp(100), updated_at: 'v0' });
  let raced = false;

  store.remote.beforeWrite = () => {
    if (!raced) {
      raced = true;
      // Another device writes between our read and our write.
      void store.remote.update(withXp(300, { cards: { miner: 1 } }), 'v0');
    }
  };

  const result = await syncProgressWith(store.remote, withXp(150, { cards: { sprout: 1 } }));

  assert.equal(result.xp, 300);
  assert.deepEqual(result.cards, { miner: 1, sprout: 1 });
});
