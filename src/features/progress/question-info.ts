import { loadMinecraftQuestionBank } from '../content/content-loader';
import type { QuestionInfo } from './progression';

let index: Map<string, QuestionInfo> | null = null;

/** Topic and difficulty of a bank question; undefined for server-only ids (live rooms). */
export function bankQuestionInfo(questionId: string): QuestionInfo | undefined {
  index ??= new Map(
    loadMinecraftQuestionBank().map((record) => [record.id, { difficulty: record.difficulty, topicId: record.topicId }])
  );

  return index.get(questionId);
}
