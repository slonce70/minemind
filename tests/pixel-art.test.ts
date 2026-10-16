import assert from 'node:assert/strict';
import test from 'node:test';

import { avatarPresets } from '../src/features/profile/avatar-presets';
import { mascotSprites, pixelIcons, spriteRuns } from '../src/features/ui/pixel-art';

function assertRectangular(name: string, rows: readonly string[]) {
  const width = rows[0]?.length;

  rows.forEach((row, index) => assert.equal(row.length, width, `${name}: row ${index} is ${row.length} wide, expected ${width}`));
  assert.equal(rows.length, width, `${name}: sprites are square`);
}

test('every pixel icon is a 10×10 grid of known keys', () => {
  for (const [name, rows] of Object.entries(pixelIcons)) {
    assertRectangular(name, rows);
    assert.equal(rows.length, 10, name);
    assert.match(rows.join(''), /^[#+.]+$/, name);
  }
});

test('avatars and mascot moods are square and fully coloured', () => {
  assert.ok(avatarPresets.length >= 12);
  assert.equal(new Set(avatarPresets.map((preset) => preset.id)).size, avatarPresets.length);

  for (const sprite of [...avatarPresets.map((preset) => preset.sprite), ...Object.values(mascotSprites)]) {
    assertRectangular(sprite.rows[0], sprite.rows);

    for (const key of sprite.rows.join('')) {
      assert.ok(key === '.' || sprite.palette[key], `unknown palette key ${key}`);
    }
  }
});

test('earlier avatar ids stay available for stored profiles', () => {
  const ids = avatarPresets.map((preset) => preset.id);

  for (const id of ['fox', 'slime', 'bee', 'axolotl']) {
    assert.ok(ids.includes(id), id);
  }
});

test('sprite runs merge neighbouring pixels of one colour', () => {
  const runs = spriteRuns({ palette: { a: '#000', b: '#fff' }, rows: ['aab.', 'bbbb'] });

  assert.deepEqual(
    runs.map(({ width, x, y }) => [x, y, width]),
    [
      [0, 0, 2],
      [2, 0, 1],
      [0, 1, 4],
    ]
  );
});
