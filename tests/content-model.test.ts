import assert from 'node:assert/strict';
import { test } from 'node:test';

import { difficultyConfig } from '../src/features/content/difficulty-config';
import {
  contentDifficultyEnum,
  contentDifficulties,
  contentTopicEnum,
  contentTopics,
} from '../src/features/content/types';

test('content model exposes stable difficulties, topics, and timer config', () => {
  assert.deepEqual(contentDifficultyEnum, {
    easy: 'easy',
    hard: 'hard',
    medium: 'medium',
  });
  assert.deepEqual(contentTopicEnum, {
    minecraft: 'minecraft',
  });
  assert.deepEqual(contentDifficulties, ['easy', 'medium', 'hard']);
  assert.deepEqual(contentTopics, ['minecraft']);
  assert.equal(difficultyConfig.easy.timerSeconds, 20);
  assert.equal(difficultyConfig.medium.timerSeconds, 18);
  assert.equal(difficultyConfig.hard.timerSeconds, 15);
  assert.equal(difficultyConfig.easy.translationKey, 'content.difficulty.easy');
  assert.equal(difficultyConfig.medium.translationKey, 'content.difficulty.medium');
  assert.equal(difficultyConfig.hard.translationKey, 'content.difficulty.hard');
});
