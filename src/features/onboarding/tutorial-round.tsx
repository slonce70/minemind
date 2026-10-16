import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { PrimaryButton } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import type { AppLocale } from '../../lib/locale';
import { colors, fonts, spacing, typography } from '../../theme/tokens';
import { feedback } from '../feel/feedback';
import { ChoiceRow } from '../profile/profile-controls';
import { AnswerOption, optionLetters, type OptionState } from '../quiz/question-parts';
import { getSoloQuestionSet } from '../quiz/quiz-service';
import { Mascot } from '../ui/mascot';
import { PixelIcon } from '../ui/pixel-icon';

const tutorialLength = 3;

type TutorialRoundProps = {
  locale: AppLocale;
  localeOptions: { label: string; value: AppLocale }[];
  onDone: () => void;
  onLocaleChange: (locale: AppLocale) => void;
  strings: {
    correct: string;
    eyebrow: string;
    factEyebrow: string;
    hints: [string, string, string];
    languageLabel: string;
    next: string;
    optionA11y: (letter: string, text: string) => string;
    skip: string;
    step: (current: number, total: number) => string;
    subtitle: string;
    title: string;
    toProfile: string;
    wrong: string;
  };
};

/** Three easy questions with hints before the profile form, so the first real round is not a surprise. */
export function TutorialRound({ locale, localeOptions, onDone, onLocaleChange, strings }: TutorialRoundProps) {
  // A fixed seed: the same three questions in whichever language is picked.
  const questions = useMemo(() => getSoloQuestionSet(locale, tutorialLength, 'easy', 'tutorial'), [locale]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const question = questions[index];
  const isRevealed = selected !== null;
  const isCorrect = isRevealed && selected === question?.correctIndex;
  const isLast = index >= questions.length - 1;

  if (!question) {
    return null;
  }

  const stateFor = (optionIndex: number): OptionState => {
    if (!isRevealed) {
      return 'idle';
    }

    if (optionIndex === question.correctIndex) {
      return 'correct';
    }

    return optionIndex === selected ? 'wrong' : 'dimmed';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Mascot mood={isRevealed ? (isCorrect ? 'happy' : 'sad') : 'wow'} size={72} />
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>{strings.eyebrow}</Text>
          <Text accessibilityRole="header" style={styles.title}>
            {strings.title}
          </Text>
          <Text style={styles.subtitle}>{strings.subtitle}</Text>
        </View>
      </View>

      <ChoiceRow label={strings.languageLabel} onSelect={onLocaleChange} options={localeOptions} selected={locale} />

      <View style={styles.hint}>
        <PixelIcon color={colors.highlight} name="lightbulb" size={18} />
        <Text accessibilityLiveRegion="polite" style={styles.hintText}>
          {strings.hints[index] ?? strings.hints[0]}
        </Text>
      </View>

      <Animated.View entering={FadeInDown.duration(300)} key={question.id}>
        <Card highlight style={styles.questionCard}>
          <Text style={styles.step}>{strings.step(index + 1, questions.length)}</Text>
          <Text style={styles.prompt}>{question.prompt}</Text>
        </Card>
      </Animated.View>

      <View style={styles.options}>
        {question.options.map((option, optionIndex) => (
          <AnswerOption
            accessibilityLabel={strings.optionA11y(optionLetters[optionIndex], option)}
            disabled={isRevealed}
            index={optionIndex}
            key={`${question.id}-${optionIndex}`}
            label={option}
            onPress={() => {
              setSelected(optionIndex);

              if (optionIndex === question.correctIndex) {
                feedback.correct();
              } else {
                feedback.wrong();
              }
            }}
            state={stateFor(optionIndex)}
          />
        ))}
      </View>

      {isRevealed ? (
        <Animated.View accessibilityLiveRegion="polite" entering={FadeIn.duration(240)}>
          <Card style={styles.factCard}>
            <Text style={[styles.verdict, isCorrect ? styles.verdictCorrect : styles.verdictWrong]}>
              {isCorrect ? strings.correct : strings.wrong}
            </Text>
            <Text style={styles.factText}>{question.explanation}</Text>
          </Card>
          <PrimaryButton
            label={isLast ? strings.toProfile : strings.next}
            onPress={() => {
              if (isLast) {
                onDone();
                return;
              }

              setIndex(index + 1);
              setSelected(null);
            }}
            testID="tutorial-next"
          />
        </Animated.View>
      ) : null}

      <Pressable accessibilityRole="button" hitSlop={8} onPress={onDone} style={styles.skip} testID="tutorial-skip">
        <Text style={styles.skipText}>{strings.skip}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  eyebrow: {
    color: colors.accent,
    fontFamily: fonts.display,
    fontSize: typography.overline,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  factCard: {
    gap: spacing.xs,
  },
  factText: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: typography.body,
    lineHeight: 22,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: spacing.xxs,
  },
  hint: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAccent,
    borderColor: colors.borderFocus,
    borderRadius: 12,
    borderWidth: 2,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  hintText: {
    color: colors.textPrimary,
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: typography.body,
    lineHeight: 22,
  },
  options: {
    gap: spacing.sm,
  },
  prompt: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: typography.h3,
    lineHeight: 28,
  },
  questionCard: {
    gap: spacing.sm,
    marginBottom: 0,
  },
  skip: {
    alignSelf: 'center',
    padding: spacing.sm,
  },
  skipText: {
    color: colors.textMuted,
    fontFamily: fonts.bold,
    fontSize: typography.caption,
    textDecorationLine: 'underline',
  },
  step: {
    color: colors.textMuted,
    fontFamily: fonts.display,
    fontSize: typography.overline,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: typography.caption,
    lineHeight: 19,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: typography.h2,
  },
  verdict: {
    fontFamily: fonts.display,
    fontSize: typography.h3,
  },
  verdictCorrect: {
    color: colors.success,
  },
  verdictWrong: {
    color: colors.wrong,
  },
});
