import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canonScopes,
  masterQuestionReviewStatuses,
  minecraftQuestionProgramTarget,
  minecraftTopicClusters,
} from '../src/features/content/master-types';

test('minecraft question program target is fixed at 1080 records', () => {
  assert.equal(minecraftQuestionProgramTarget.totalQuestions, 1080);
  assert.equal(minecraftQuestionProgramTarget.questionsPerTopicPerDifficulty, 45);
});

test('master content model exposes canon scope and review enums', () => {
  assert.deepEqual(canonScopes, ['common-canon', 'java-only', 'bedrock-only']);
  assert.deepEqual(masterQuestionReviewStatuses, [
    'draft',
    'auto-validated',
    'editor-reviewed',
    'approved',
    'rejected',
  ]);
});

test('every topic has exactly three internal clusters', () => {
  assert.equal(minecraftTopicClusters['survival-basics'].length, 3);
  assert.equal(minecraftTopicClusters['nether-end-and-redstone'].length, 3);
});
