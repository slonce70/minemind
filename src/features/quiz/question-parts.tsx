import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors, fonts, motion, radii, spacing, typography } from '../../theme/tokens';
import type { PixelIconName } from '../ui/pixel-art';
import { PixelIcon } from '../ui/pixel-icon';
import { ItemIcon } from './question-media';

export const optionLetters = ['A', 'B', 'C', 'D'] as const;

export type OptionState = 'idle' | 'selected' | 'correct' | 'wrong' | 'dimmed';

type AnswerOptionProps = {
  accessibilityLabel: string;
  disabled: boolean;
  /** Item sprite shown before the text (recipe questions). */
  icon?: string;
  index: number;
  label: string;
  onPress: () => void;
  state: OptionState;
};

/** One answer: letter badge, text and, once revealed, a ✓ / ✗ mark so the result never relies on colour. */
export function AnswerOption({ accessibilityLabel, disabled, icon, index, label, onPress, state }: AnswerOptionProps) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const shift = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    if (state === 'correct') {
      scale.value = withSequence(withTiming(1.04, { duration: motion.fast }), withSpring(1));
    }

    if (state === 'wrong') {
      shift.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 70 }),
        withTiming(-5, { duration: 60 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [reduceMotion, scale, shift, state]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shift.value }, { scale: scale.value }],
  }));
  const mark: PixelIconName | null = state === 'correct' ? 'check' : state === 'wrong' ? 'cross' : null;
  const tone = toneFor(state);

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled, selected: state === 'selected' || state === 'wrong' || state === 'correct' }}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => {
          if (!reduceMotion) {
            scale.value = withTiming(0.97, { duration: motion.fast });
          }
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        style={({ pressed }) => [
          styles.option,
          { backgroundColor: tone.background, borderColor: tone.border },
          state === 'dimmed' && styles.optionDimmed,
          pressed && styles.optionPressed,
        ]}
        testID="answer-option"
      >
        <View style={[styles.letter, { backgroundColor: tone.border }]}>
          <Text maxFontSizeMultiplier={1.3} style={[styles.letterText, { color: tone.letterText }]}>
            {optionLetters[index]}
          </Text>
        </View>
        {icon ? <ItemIcon id={icon} size={28} /> : null}
        <Text style={styles.optionLabel}>{label}</Text>
        {mark ? <PixelIcon color={tone.border} name={mark} size={22} /> : null}
      </Pressable>
    </Animated.View>
  );
}

function toneFor(state: OptionState) {
  switch (state) {
    case 'correct':
      return { background: colors.successSoft, border: colors.success, letterText: colors.canvas };
    case 'wrong':
      return { background: colors.dangerSoft, border: colors.danger, letterText: colors.canvas };
    case 'selected':
      return { background: colors.surfaceAccent, border: colors.highlight, letterText: colors.canvas };
    default:
      return { background: colors.panelSurface, border: colors.borderStrong, letterText: colors.textPrimary };
  }
}

type TimerBarProps = {
  accessibilityLabel: string;
  isRunning: boolean;
  timeLeft: number;
  timeLimit: number;
};

/** Countdown bar that drains smoothly between the whole-second ticks and turns red near the end. */
export function TimerBar({ accessibilityLabel, isRunning, timeLeft, timeLimit }: TimerBarProps) {
  const reduceMotion = useReducedMotion();
  const ratio = timeLimit > 0 ? Math.max(0, Math.min(1, timeLeft / timeLimit)) : 0;
  const fill = useSharedValue(ratio);
  const previousTimeLeft = useRef(timeLeft);
  const isLow = timeLeft <= 5 && isRunning;

  useEffect(() => {
    // A new question refills the bar at once instead of animating up from empty.
    if (timeLeft > previousTimeLeft.current) {
      fill.value = ratio;
    }

    previousTimeLeft.current = timeLeft;

    // Drain towards the next second while the clock runs; jump straight there otherwise.
    const target = isRunning ? Math.max(0, (timeLeft - 1) / Math.max(1, timeLimit)) : ratio;

    fill.value = reduceMotion || !isRunning ? target : withTiming(target, { duration: 1000, easing: Easing.linear });
  }, [fill, isRunning, ratio, reduceMotion, timeLeft, timeLimit]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={{ max: timeLimit, min: 0, now: timeLeft }}
      accessible
      style={styles.timerRow}
    >
      <PixelIcon color={isLow ? colors.danger : colors.highlight} name="hourglass" size={18} />
      <View style={styles.timerTrack}>
        <Animated.View style={[styles.timerFill, { backgroundColor: isLow ? colors.danger : colors.highlight }, fillStyle]} />
      </View>
      <Text maxFontSizeMultiplier={1.4} style={[styles.timerValue, isLow && styles.timerValueLow]}>
        {timeLeft}
      </Text>
    </View>
  );
}

type ProgressPipsProps = {
  current: number;
  results: ('correct' | 'wrong' | 'pending')[];
  total: number;
};

/** One square per question: green ✓, red ✗ or empty, the current one outlined. */
export function ProgressPips({ current, results, total }: ProgressPipsProps) {
  return (
    <View importantForAccessibility="no-hide-descendants" style={styles.pips}>
      {Array.from({ length: total }, (_, index) => {
        const result = results[index] ?? 'pending';

        return (
          <View
            key={index}
            style={[
              styles.pip,
              result === 'correct' && styles.pipCorrect,
              result === 'wrong' && styles.pipWrong,
              index === current && styles.pipCurrent,
            ]}
          >
            {result === 'correct' ? <PixelIcon color={colors.canvas} name="check" size={10} /> : null}
            {result === 'wrong' ? <PixelIcon color={colors.canvas} name="cross" size={9} /> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  letter: {
    alignItems: 'center',
    borderRadius: radii.sm,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  letterText: {
    fontFamily: fonts.display,
    fontSize: typography.h3,
  },
  option: {
    alignItems: 'center',
    borderRadius: radii.xl,
    borderWidth: 2,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 64,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionDimmed: {
    opacity: 0.55,
  },
  optionLabel: {
    color: colors.textPrimary,
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: typography.body,
    lineHeight: 22,
  },
  optionPressed: {
    borderColor: colors.highlight,
  },
  pip: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 2,
    flex: 1,
    height: 18,
    justifyContent: 'center',
    maxWidth: 44,
  },
  pipCorrect: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  pipCurrent: {
    borderColor: colors.highlight,
  },
  pipWrong: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  pips: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  timerFill: {
    borderRadius: radii.sm,
    height: '100%',
  },
  timerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timerTrack: {
    backgroundColor: colors.surfaceInset,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 2,
    flex: 1,
    height: 16,
    overflow: 'hidden',
  },
  timerValue: {
    color: colors.highlight,
    fontFamily: fonts.black,
    fontSize: typography.h2,
    fontVariant: ['tabular-nums'],
    minWidth: 34,
    textAlign: 'right',
  },
  timerValueLow: {
    color: colors.danger,
  },
});
