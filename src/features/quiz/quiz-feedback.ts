export function createQuizFeedbackState(input: {
  correctIndex?: number;
  isRevealed: boolean;
  selectedIndex: number | null;
}) {
  if (!input.isRevealed) {
    return {
      correctIndex: input.correctIndex,
      selectedState: 'idle' as const,
    };
  }

  if (input.selectedIndex !== null && input.selectedIndex === input.correctIndex) {
    return {
      correctIndex: input.correctIndex,
      selectedState: 'correct' as const,
    };
  }

  return {
    correctIndex: input.correctIndex,
    selectedState: 'wrong' as const,
  };
}
