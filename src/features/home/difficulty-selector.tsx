import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radii, spacing, typography } from '../../theme/tokens';
import { difficultyConfig } from '../content/difficulty-config';
import type { ContentDifficulty } from '../content/types';
import { feedback } from '../feel/feedback';
import { PixelIcon } from '../ui/pixel-icon';

type DifficultySelectorProps = {
  label?: string;
  onSelect: (difficulty: ContentDifficulty) => void;
  selectedDifficulty: ContentDifficulty;
  strings: Record<ContentDifficulty, string>;
  timerLabel: (seconds: number) => string;
};

const difficultyOrder: ContentDifficulty[] = ['easy', 'medium', 'hard'];

/** Three compact segments with the answer timer under each name. */
export function DifficultySelector({ label, onSelect, selectedDifficulty, strings, timerLabel }: DifficultySelectorProps) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View accessibilityLabel={label} accessibilityRole="radiogroup" style={styles.row}>
        {difficultyOrder.map((difficulty) => {
          const isActive = selectedDifficulty === difficulty;
          const seconds = difficultyConfig[difficulty].timerSeconds;

          return (
            <Pressable
              accessibilityLabel={`${strings[difficulty]}, ${timerLabel(seconds)}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: isActive }}
              key={difficulty}
              onPress={() => {
                feedback.tap();
                onSelect(difficulty);
              }}
              style={[styles.button, isActive && styles.buttonActive]}
            >
              <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.name, isActive && styles.nameActive]}>
                {strings[difficulty]}
              </Text>
              <View style={styles.timer}>
                <PixelIcon color={isActive ? colors.highlight : colors.textMuted} name="hourglass" size={11} />
                <Text style={[styles.seconds, isActive && styles.nameActive]}>{seconds}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    borderWidth: 2,
    flexBasis: 90,
    flexGrow: 1,
    flexShrink: 1,
    gap: spacing.xxs,
    minHeight: 56,
    minWidth: 0,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  buttonActive: {
    backgroundColor: colors.surfaceAccent,
    borderColor: colors.highlight,
  },
  container: {
    gap: spacing.sm,
  },
  label: {
    color: colors.textMuted,
    fontFamily: fonts.display,
    fontSize: typography.micro,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  name: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: typography.caption,
  },
  nameActive: {
    color: colors.highlight,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  seconds: {
    color: colors.textMuted,
    fontFamily: fonts.bold,
    fontSize: typography.micro,
  },
  timer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xxs,
  },
});
