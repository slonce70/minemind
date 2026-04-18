import { StyleSheet, Text, View } from 'react-native';

import { SecondaryButton } from '../../components/ui/button';
import { colors, spacing, typography } from '../../theme/tokens';
import type { ContentDifficulty } from '../content/types';

type DifficultySelectorProps = {
  label?: string;
  onSelect: (difficulty: ContentDifficulty) => void;
  selectedDifficulty: ContentDifficulty;
  strings: Record<ContentDifficulty, string>;
};

const difficultyOrder: ContentDifficulty[] = ['easy', 'medium', 'hard'];

export function DifficultySelector({
  label,
  onSelect,
  selectedDifficulty,
  strings,
}: DifficultySelectorProps) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        {difficultyOrder.map((difficulty) => (
          <SecondaryButton
            key={difficulty}
            label={strings[difficulty]}
            onPress={() => onSelect(difficulty)}
            selected={selectedDifficulty === difficulty}
            style={styles.button}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    minHeight: 48,
  },
  container: {
    gap: spacing.sm,
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.micro,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
});
