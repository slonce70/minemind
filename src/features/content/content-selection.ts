import { minecraftTopicConfig } from './topic-config';
import type { ContentDifficulty, ContentQuestionBank, ContentQuestionRecord, ContentTopicId } from './types';

function hashString(input: string) {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededCompare(left: string, right: string, seed: string) {
  const leftHash = hashString(`${seed}:${left}`);
  const rightHash = hashString(`${seed}:${right}`);

  if (leftHash === rightHash) {
    return left.localeCompare(right);
  }

  return leftHash - rightHash;
}

function seededTopicOrder(topics: ContentTopicId[], seed: string) {
  return [...topics].sort((left, right) => {
    const priorityDelta = minecraftTopicConfig[left].priority - minecraftTopicConfig[right].priority;

    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return seededCompare(left, right, seed);
  });
}

function groupByTopic(records: ContentQuestionRecord[]) {
  return records.reduce<Record<ContentTopicId, ContentQuestionRecord[]>>((groups, record) => {
    const existing = groups[record.topicId] ?? [];
    return {
      ...groups,
      [record.topicId]: [...existing, record],
    };
  }, {} as Record<ContentTopicId, ContentQuestionRecord[]>);
}

function getSeededTopicQueues(records: ContentQuestionRecord[], seed: string) {
  const grouped = groupByTopic(records);

  return Object.fromEntries(
    Object.entries(grouped).map(([topicId, entries]) => [
      topicId,
      [...entries].sort((left, right) => seededCompare(left.id, right.id, `${seed}:${topicId}`)),
    ])
  ) as Record<ContentTopicId, ContentQuestionRecord[]>;
}

export function selectQuestionRound(params: {
  bank: ContentQuestionBank;
  count: number;
  difficulty: ContentDifficulty;
  seed: string;
}) {
  const candidates = params.bank.filter(
    (entry) => entry.difficulty === params.difficulty && entry.isActive
  );

  if (candidates.length === 0 || params.count <= 0) {
    return [];
  }

  const topicQueues = getSeededTopicQueues(candidates, params.seed);
  const topicOrder = seededTopicOrder(Object.keys(topicQueues) as ContentTopicId[], params.seed);
  const round: ContentQuestionRecord[] = [];
  const activeTopics = [...topicOrder];

  while (round.length < params.count && activeTopics.length > 0) {
    for (let index = 0; index < activeTopics.length && round.length < params.count; index += 1) {
      const topicId = activeTopics[index];
      const nextQuestion = topicQueues[topicId]?.shift();

      if (nextQuestion) {
        round.push(nextQuestion);
      }

      if (!topicQueues[topicId] || topicQueues[topicId].length === 0) {
        activeTopics.splice(index, 1);
        index -= 1;
      }
    }
  }

  return round;
}
