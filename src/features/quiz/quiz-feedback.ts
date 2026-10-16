export function createQuizFeedbackState(input: {
  correctIndex?: number;
  isRevealed: boolean;
  selectedIndex: number | null;
}) {
  // Revealed but the verdict hasn't arrived yet (live room / classroom guest): stay neutral.
  if (!input.isRevealed || typeof input.correctIndex !== 'number') {
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
