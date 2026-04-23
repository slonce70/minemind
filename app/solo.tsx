import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { Image, type ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PrimaryButton } from '../src/components/ui/button';
import { Card } from '../src/components/ui/card';
import { LoadingScreen } from '../src/components/ui/loading-screen';
import { Screen } from '../src/components/ui/screen';
import { difficultyConfig } from '../src/features/content/difficulty-config';
import { createQuizFeedbackState } from '../src/features/quiz/quiz-feedback';
import { useSoloRound } from '../src/features/quiz/use-solo-round';
import { useAppStore } from '../src/state/app-store';
import { colors, radii, spacing, typography } from '../src/theme/tokens';

const questionIllustrationSourceById: Record<string, ImageSourcePropType> = {
  'badlands-has-terracotta': require('../assets/question-illustrations/badlands-has-terracotta.png'),
  'bamboo-jungle-has-bamboo': require('../assets/question-illustrations/bamboo-jungle-has-bamboo.png'),
  'bee-pollinates-crops': require('../assets/question-illustrations/bee-pollinates-crops.png'),
  'creeper-explodes': require('../assets/question-illustrations/creeper-explodes.png'),
  'igloo-in-snowy-biomes': require('../assets/question-illustrations/igloo-in-snowy-biomes.png'),
  'ocean-monument-guardians': require('../assets/question-illustrations/ocean-monument-guardians.png'),
  'obsidian-from-water-and-lava': require('../assets/question-illustrations/obsidian-from-water-and-lava.png'),
  'skeleton-uses-bow': require('../assets/question-illustrations/skeleton-uses-bow.png'),
  'village-has-villagers': require('../assets/question-illustrations/village-has-villagers.png'),
};

export default function SoloRoute() {
  const { t } = useTranslation();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const locale = useAppStore((state) => state.locale);
  const round = useSoloRound({
    locale,
    messages: {
      factPending: t('solo.factPending'),
      loadError: t('solo.loadError'),
    },
    mode,
  });
  const difficultyLabel = t(difficultyConfig[round.difficulty].translationKey);

  if (!hasHydrated) {
    return <LoadingScreen />;
  }

  if (round.isRoomMode && !round.isLoading && (!round.currentRoom || !round.currentRoomRound)) {
    return <Redirect href="/rooms" />;
  }

  if (round.isClassroomMode && !round.isLoading && !round.currentClassroomSession) {
    return <Redirect href="/classroom" />;
  }

  if (round.isLoading) {
    return <LoadingScreen />;
  }

  if (round.isAwaitingResults) {
    return (
      <Screen scrollable={false}>
        <Card highlight>
          <Text style={styles.pendingTitle}>{t('solo.resultsPendingTitle')}</Text>
          <Text style={styles.pendingCopy}>
            {round.resultsPending ? t('solo.resultsPendingBody') : t('common.loading')}
          </Text>
          {round.loadError ? <Text style={styles.errorText}>{round.loadError}</Text> : null}
        </Card>

        {round.resultsPending ? (
          <PrimaryButton label={t('common.retry')} onPress={round.retryFinalize} />
        ) : null}
      </Screen>
    );
  }

  if (!round.question) {
    return <Redirect href={round.isRoomMode ? '/rooms' : round.isClassroomMode ? '/classroom' : '/home'} />;
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Text style={styles.kicker}>
          {round.isRoomMode
            ? t('solo.roomModeLabel')
            : round.isClassroomMode
              ? t('solo.classroomModeLabel')
              : t('solo.modeLabel')}
        </Text>
        <Text style={styles.difficultyLabel}>{difficultyLabel}</Text>
        <Text style={styles.progressTitle}>
          {t('solo.progress', { current: round.currentIndex + 1, total: round.questions.length })}
        </Text>
      </View>

      {round.loadError ? <Text style={styles.errorText}>{round.loadError}</Text> : null}

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${round.progress}%` }]} />
      </View>

      <Card highlight style={styles.questionCard}>
        <View style={styles.timerRow}>
          <Text style={styles.timerLabel}>{t('solo.timer')}</Text>
          <Text style={styles.timerValue}>
            {round.timeLeft}s / {round.timeLimit}s
          </Text>
        </View>
        {round.question.illustration ? (
          <View style={styles.questionIllustrationFrame}>
            <Image
              accessibilityIgnoresInvertColors
              accessibilityLabel={round.question.illustration.alt}
              resizeMode="cover"
              source={
                questionIllustrationSourceById[round.question.illustration.id] ?? {
                  uri: round.question.illustration.imageUri,
                }
              }
              style={styles.questionIllustration}
            />
          </View>
        ) : null}
        <Text style={styles.questionPrompt}>{round.question.prompt}</Text>
      </Card>

      <View style={styles.optionList}>
        {round.question.options.map((option, optionIndex) => {
          const revealedAnswer = round.answerMap[round.question.id];
          const feedbackState = createQuizFeedbackState({
            correctIndex: revealedAnswer?.correctIndex ?? round.question?.correctIndex,
            isRevealed: round.isRevealed,
            selectedIndex: round.selectedIndex,
          });
          const isCorrect = optionIndex === feedbackState.correctIndex;
          const isSelected = optionIndex === round.selectedIndex;
          const showCorrectState = round.isRevealed && isCorrect;
          const showWrongState = round.isRevealed && isSelected && feedbackState.selectedState === 'wrong';

          return (
            <Pressable
              disabled={round.isRevealed}
              key={`${round.question.id}-${optionIndex}`}
              onPress={() => round.handleAnswer(optionIndex)}
              style={[
                styles.optionButton,
                isSelected && styles.optionButtonSelected,
                showCorrectState && styles.optionButtonCorrect,
                showWrongState && styles.optionButtonWrong,
              ]}
            >
              <Text style={styles.optionLabel}>{option}</Text>
            </Pressable>
          );
        })}
      </View>

      <Card style={styles.factCard}>
        <Text style={styles.factEyebrow}>{t('solo.factEyebrow')}</Text>
        <Text style={styles.factText}>
          {round.isRevealed
            ? round.answerMap[round.question.id]?.explanation ?? round.question.explanation ?? t('solo.factPending')
            : t('solo.factLocked')}
        </Text>
      </Card>

      {round.isRevealed ? (
        <PrimaryButton
          label={round.isSubmittingAnswer ? t('common.loading') : t('solo.next')}
          onPress={() => void round.goNext()}
        />
      ) : (
        <PrimaryButton
          label={round.isSubmittingAnswer ? t('common.loading') : t('solo.skip')}
          onPress={() => round.handleAnswer(-1, 0)}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  kicker: {
    color: colors.accent,
    fontSize: typography.overline,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  progressTitle: {
    color: colors.textPrimary,
    fontSize: typography.h2,
    fontWeight: '800',
  },
  difficultyLabel: {
    color: colors.highlight,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  progressTrack: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.full,
    height: 10,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: colors.highlight,
    borderRadius: radii.full,
    flex: 1,
  },
  questionCard: {
    marginBottom: spacing.md,
  },
  questionIllustrationFrame: {
    aspectRatio: 16 / 9,
    backgroundColor: colors.surfaceInset,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  questionIllustration: {
    height: '100%',
    width: '100%',
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  timerLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  timerValue: {
    color: colors.highlight,
    fontSize: typography.h3,
    fontWeight: '800',
  },
  questionPrompt: {
    color: colors.textPrimary,
    fontSize: typography.h2,
    fontWeight: '800',
    lineHeight: 34,
  },
  optionList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  pendingCopy: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 22,
  },
  pendingTitle: {
    color: colors.textPrimary,
    fontSize: typography.h2,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  optionButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  optionButtonSelected: {
    borderColor: colors.highlight,
    transform: [{ translateY: -2 }],
  },
  optionButtonCorrect: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  optionButtonWrong: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  optionLabel: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '700',
    lineHeight: 22,
  },
  factCard: {
    marginBottom: spacing.md,
  },
  factEyebrow: {
    color: colors.accent,
    fontSize: typography.overline,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  factText: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 22,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.caption,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
});
