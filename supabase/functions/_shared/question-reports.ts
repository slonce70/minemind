// Reasons a player can give when reporting a question. Shared with the app (no Deno imports).
export const questionReportReasons = ['wrong-answer', 'outdated', 'typo', 'unclear', 'other'] as const;

export type QuestionReportReason = (typeof questionReportReasons)[number];
