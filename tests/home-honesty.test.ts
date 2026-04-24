import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('home route no longer imports leaderboardPreview mock data', () => {
  const source = readFileSync(new URL('../app/home.tsx', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /leaderboardPreview/);
  assert.match(source, /recentMatches/);
});

test('results route reads the latest MatchRecord instead of raw lastResult', () => {
  const source = readFileSync(new URL('../app/results.tsx', import.meta.url), 'utf8');

  assert.match(source, /recentMatches/);
  assert.doesNotMatch(source, /lastResult/);
});

test('home view no longer expects leaderboard preview entries', () => {
  const source = readFileSync(new URL('../src/features/home/home-view.tsx', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /leaderboardEntries/);
});
