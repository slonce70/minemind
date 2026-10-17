import { Redirect, Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { PrimaryButton, SecondaryButton } from '../src/components/ui/button';
import { ReportQuestion } from '../src/features/account/report-question';
import { Card } from '../src/components/ui/card';
import { LoadingScreen } from '../src/components/ui/loading-screen';
import { Screen } from '../src/components/ui/screen';
import { difficultyConfig } from '../src/features/content/difficulty-config';
import { minecraftTopicConfig } from '../src/features/content/topic-config';
import { feedback } from '../src/features/feel/feedback';
import { stopReadAloud, toggleReadAloud } from '../src/features/feel/read-aloud';
import { BigScreenView } from '../src/features/quiz/big-screen-view';
import { QuestionMediaView } from '../src/features/quiz/question-media';
import { AnswerOption, ProgressPips, TimerBar, optionLetters, type OptionState } from '../src/features/quiz/question-parts';
import { RoomTimelinePanel } from '../src/features/quiz/room-timeline-panel';
import { extraTimeSeconds } from '../src/features/quiz/round/round-machine';
import { parseChallenge, type SoloRoundSpec } from '../src/features/quiz/solo-round-builder';
import type { QuizAnswerMap, QuizQuestion } from '../src/features/quiz/types';
import { useSoloRound } from '../src/features/quiz/use-solo-round';
import { Mascot } from '../src/features/ui/mascot';
import { PixelIcon } from '../src/features/ui/pixel-icon';
import { useAppStore } from '../src/state/app-store';
import { appTheme, colors, fonts, radii, spacing, typography } from '../src/theme/tokens';
import { contentTopics, type ContentTopicId } from '../src/features/content/types';
import type { ContentDifficulty } from '../src/features/content/types';

type SoloParams = Record<string, string | undefined>;

/** Which solo round the link asks for; classic at the chosen difficulty by default. */
function soloSpecFromParams(params: SoloParams, difficulty: ContentDifficulty, mistakes: string[]): SoloRoundSpec {
  switch (params.variant) {
    case 'topic':
      return contentTopics.includes(params.topic as ContentTopicId)
        ? { difficulty, topicId: params.topic as ContentTopicId, variant: 'topic' }
        : { difficulty, variant: 'classic' };
    case 'adaptive':
      return { variant: 'adaptive' };
    case 'mistakes':
      return { questionIds: mistakes, variant: 'mistakes' };
    case 'challenge': {
      const challenge = parseChallenge(params);

      return challenge ? { challenge, variant: 'challenge' } : { difficulty, variant: 'classic' };
    }
    default:
      return { difficulty, variant: 'classic' };
  }
}

type Verdict = 'correct' | 'wrong' | 'pending';

/** Right or wrong once known; 'pending' while a live room or classroom host still has to answer. */
function verdictFor(question: QuizQuestion | undefined, answers: QuizAnswerMap): Verdict {
  const answer = question ? answers[question.id] : undefined;
  const correctIndex = answer?.correctIndex ?? question?.correctIndex;

  if (!answer) {
    return 'pending';
  }

  if (typeof answer.isCorrect === 'boolean') {
    return answer.isCorrect ? 'correct' : 'wrong';
  }

  if (typeof correctIndex !== 'number') {
    return 'pending';
  }

  return answer.selectedIndex === correctIndex ? 'correct' : 'wrong';
}

export default function SoloRoute() {
  const { t } = useTranslation();
  const params = useLocalSearchParams() as SoloParams;
  const { mode } = params;
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const selectedDifficulty = useAppStore((state) => state.selectedDifficulty);
  // Fixed when the screen opens: finishing the round updates mistakes and must not rebuild it.
  const [mistakesAtStart] = useState(() => useAppStore.getState().progress.mistakes);
  const spec = useMemo(
    () => soloSpecFromParams(params, selectedDifficulty, mistakesAtStart),
    [params.variant, params.topic, params.seed, hasHydrated]
  );
  const locale = useAppStore((state) => state.locale);
  const { width } = useWindowDimensions();
  const isWide = width >= appTheme.layout.wideBreakpoint;
  const [isReading, setIsReading] = useState(false);
  const round = useSoloRound({
    locale,
    messages: {
      factPending: t('solo.factPending'),
      loadError: t('solo.loadError'),
    },
    mode,
    spec,
  });
  const question = round.question;
  const verdict = round.isRevealed ? verdictFor(question, round.answerMap) : 'pending';
  const isLastQuestion = round.currentIndex >= round.questionTotal - 1;
  const hasOpenQuestion = Boolean(question) && !round.isRevealed;
  const announcedQuestion = useRef<string | null>(null);

  // Sound and vibration once per question, when the verdict is known.
  useEffect(() => {
    if (!question || verdict === 'pending' || announcedQuestion.current === question.id) {
      return;
    }

    announcedQuestion.current = question.id;

    if (verdict === 'correct') {
      feedback.correct();
    } else {
      feedback.wrong();
    }
  }, [question, verdict]);

  // The last five seconds tick.
  useEffect(() => {
    if (hasOpenQuestion && round.timeLeft > 0 && round.timeLeft <= 5) {
      feedback.tick();
    }
  }, [hasOpenQuestion, round.timeLeft]);

  // Reading stops when the question changes or the screen closes.
  useEffect(() => {
    setIsReading(false);
    stopReadAloud();

    return stopReadAloud;
  }, [question?.id]);

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

  // Live room before its first question: everyone waits for the same start.
  if (round.roomTimeline && !question) {
    const phase = round.roomTimeline.phase;

    return (
      <Screen scrollable={false}>
        <Card highlight style={styles.leadIn}>
          <Mascot size={88} />
          <Text style={styles.pendingTitle}>{t('solo.timelineGetReady')}</Text>
          <Text accessibilityLiveRegion="polite" style={styles.pendingCopy}>
            {phase?.kind === 'lead-in' ? t('solo.timelineStartsIn', { seconds: phase.secondsLeft }) : t('common.loading')}
          </Text>
        </Card>
      </Screen>
    );
  }

  if (!question) {
    return <Redirect href={round.isRoomMode ? '/rooms' : round.isClassroomMode ? '/classroom' : '/home'} />;
  }

  // Big-screen room: the host's device shows the question large and does not play.
  if (round.roomTimeline?.isScreen) {
    return (
      <Screen>
        <Stack.Screen options={{ headerShown: false }} />
        <BigScreenView
          answeredCount={round.roomTimeline.answeredCount}
          correctIndex={round.roomTimeline.revealed[question.id]}
          index={round.currentIndex}
          phase={round.roomTimeline.phase}
          playerCount={round.roomTimeline.playerCount}
          question={question}
          standings={round.roomTimeline.standings}
          standingsQuestionCount={round.roomTimeline.standingsQuestionCount}
          timeLeft={round.timeLeft}
          total={round.questionTotal}
        />
      </Screen>
    );
  }

  const answer = round.answerMap[question.id];
  const correctIndex = answer?.correctIndex ?? question.correctIndex;
  const topic = question.topicId ? minecraftTopicConfig[question.topicId] : undefined;
  const pipResults = round.questions.map((item) =>
    round.answerMap[item.id] ? verdictFor(item, round.answerMap) : 'pending'
  );
  const variant = round.variant;
  const modeLabel = round.isRoomMode
    ? t('solo.roomModeLabel')
    : round.isClassroomMode
      ? t('solo.classroomModeLabel')
      : variant?.soloMode === 'challenge' && variant.challenge
        ? t('modes.challengeFrom', { name: variant.challenge.from })
        : variant?.soloMode === 'topic' && variant.topicId
          ? t(minecraftTopicConfig[variant.topicId].translationKey)
          : variant?.soloMode === 'adaptive'
            ? t('modes.adaptive')
            : variant?.soloMode === 'mistakes'
              ? t('modes.mistakes')
              : t('solo.modeLabel');
  const canUseHints = !round.isRoomMode && !round.isClassroomMode && hasOpenQuestion;
  const isMissed = round.isRevealed && answer?.selectedIndex === -1;

  const optionState = (optionIndex: number): OptionState => {
    if (!round.isRevealed) {
      return round.hiddenOptions.includes(optionIndex) ? 'dimmed' : 'idle';
    }

    if (verdict !== 'pending' && optionIndex === correctIndex) {
      return 'correct';
    }

    if (optionIndex === round.selectedIndex) {
      return verdict === 'wrong' ? 'wrong' : 'selected';
    }

    return verdict === 'pending' ? 'idle' : 'dimmed';
  };

  const optionA11y = (optionIndex: number, option: string) => {
    const state = optionState(optionIndex);
    const base = t('solo.optionA11y', { letter: optionLetters[optionIndex], text: option });
    const notes = [
      state === 'correct' && optionIndex === round.selectedIndex ? t('solo.answerYoursRight') : null,
      state === 'correct' && optionIndex !== round.selectedIndex ? t('solo.answerCorrect') : null,
      state === 'wrong' ? t('solo.answerYoursWrong') : null,
    ].filter(Boolean);

    return [base, ...notes].join(', ');
  };

  const handleReadAloud = async () => {
    const text = [
      question.prompt,
      ...question.options.map((option, index) => `${optionLetters[index]}. ${option}`),
    ].join('. ');

    setIsReading(await toggleReadAloud(text, locale));
  };

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel={t('solo.exit')}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => {
            feedback.tap();
            router.replace('/home');
          }}
          style={styles.iconButton}
        >
          <PixelIcon color={colors.textPrimary} name="arrow-left" size={18} />
        </Pressable>
        <View style={styles.titleBlock}>
          <Text style={styles.kicker}>
            {modeLabel} · {t(difficultyConfig[round.difficulty].translationKey)}
          </Text>
          <Text accessibilityRole="header" style={styles.progressTitle}>
            {t('solo.progress', { current: round.currentIndex + 1, total: round.questionTotal })}
          </Text>
        </View>
      </View>

      <ProgressPips current={round.currentIndex} results={pipResults} total={round.questionTotal} />

      <TimerBar
        accessibilityLabel={t('solo.secondsLeft', { count: round.timeLeft })}
        isRunning={hasOpenQuestion}
        timeLeft={round.timeLeft}
        timeLimit={round.timeLimit}
      />

      {canUseHints ? (
        <View style={styles.hintRow}>
          <HintButton
            accessibilityLabel={t('modes.fiftyA11y', { count: round.lifelines.fifty })}
            disabled={round.lifelines.fifty <= 0 || round.lifelinesUsed.includes('fifty') || question.options.length < 4}
            icon="half"
            label={t('modes.fiftyLabel')}
            left={round.lifelines.fifty}
            onPress={() => round.spendLifeline('fifty')}
          />
          <HintButton
            accessibilityLabel={t('modes.timeA11y', { count: round.lifelines.time, seconds: extraTimeSeconds })}
            disabled={round.lifelines.time <= 0 || round.lifelinesUsed.includes('time')}
            icon="time-plus"
            label={t('modes.timeLabel', { seconds: extraTimeSeconds })}
            left={round.lifelines.time}
            onPress={() => round.spendLifeline('time')}
          />
        </View>
      ) : null}

      {round.loadError ? <Text style={styles.errorText}>{round.loadError}</Text> : null}

      <Animated.View entering={FadeInDown.duration(320)} key={question.id}>
        <Card highlight style={styles.questionCard}>
          <View style={styles.questionMeta}>
            {topic ? (
              <View
                accessibilityLabel={t('solo.topicA11y', { topic: t(topic.translationKey) })}
                accessible
                style={styles.topicChip}
              >
                <PixelIcon color={colors.highlight} name={topic.icon} size={16} />
                <Text style={styles.topicLabel}>{t(topic.translationKey)}</Text>
              </View>
            ) : (
              <View />
            )}
            <Pressable
              accessibilityLabel={isReading ? t('solo.stopReading') : t('solo.readAloud')}
              accessibilityRole="button"
              accessibilityState={{ selected: isReading }}
              hitSlop={8}
              onPress={() => void handleReadAloud()}
              style={[styles.iconButton, isReading && styles.iconButtonActive]}
            >
              <PixelIcon color={isReading ? colors.canvas : colors.textPrimary} name="sound-on" size={18} />
            </Pressable>
          </View>
          <Text style={styles.questionPrompt}>{question.prompt}</Text>
          {question.media ? (
            <QuestionMediaView labels={{ picture: t('questionMedia.picture'), recipe: t('questionMedia.recipe') }} media={question.media} />
          ) : null}
        </Card>
      </Animated.View>

      <View style={[styles.optionList, isWide && styles.optionGrid]}>
        {question.options.map((option, optionIndex) => (
          <Animated.View
            entering={FadeInDown.delay(80 + optionIndex * 60).duration(260)}
            key={`${question.id}-${optionIndex}`}
            style={isWide ? styles.optionCell : undefined}
          >
            <AnswerOption
              accessibilityLabel={optionA11y(optionIndex, option)}
              disabled={round.isRevealed || round.hiddenOptions.includes(optionIndex)}
              icon={question.optionIcons?.[optionIndex]}
              index={optionIndex}
              label={option}
              onPress={() => {
                feedback.tap();
                round.handleAnswer(optionIndex);
              }}
              state={optionState(optionIndex)}
            />
          </Animated.View>
        ))}
      </View>

      {round.isRevealed ? (
        <Animated.View accessibilityLiveRegion="polite" entering={FadeIn.duration(260)}>
          <Card style={styles.factCard}>
            <View style={styles.factHeader}>
              <Mascot animated={false} mood={verdict === 'correct' ? 'happy' : verdict === 'wrong' ? 'sad' : 'wow'} size={52} />
              <View style={styles.factHeading}>
                {verdict !== 'pending' ? (
                  <Text style={[styles.verdict, verdict === 'correct' ? styles.verdictCorrect : styles.verdictWrong]}>
                    {verdict === 'correct' ? t('solo.toastCorrect') : isMissed ? t('solo.answerMissed') : t('solo.toastWrong')}
                  </Text>
                ) : null}
                <View style={styles.factEyebrowRow}>
                  <PixelIcon color={colors.accent} name="lightbulb" size={14} />
                  <Text style={styles.factEyebrow}>{t('solo.factEyebrow')}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.factText}>
              {answer?.explanation ?? question.explanation ?? t('solo.factPending')}
            </Text>
            <ReportQuestion key={question.id} locale={locale} questionId={question.id} />
          </Card>
        </Animated.View>
      ) : null}

      {round.roomTimeline ? (
        <RoomTimelinePanel
          answeredCount={round.roomTimeline.answeredCount}
          localPlayerId={round.currentRoom?.participants.find((participant) => participant.isLocalPlayer)?.id}
          phase={round.roomTimeline.phase}
          playerCount={round.roomTimeline.playerCount}
          questionCount={round.questionTotal}
          standings={round.roomTimeline.standings}
          standingsQuestionCount={round.roomTimeline.standingsQuestionCount}
        />
      ) : null}

      {round.roomTimeline && round.isRevealed ? null : round.isRevealed ? (
        <PrimaryButton
          label={round.isSubmittingAnswer ? t('common.loading') : isLastQuestion ? t('solo.finish') : t('solo.next')}
          onPress={() => void round.goNext()}
          testID="round-next"
        />
      ) : (
        <SecondaryButton
          label={round.isSubmittingAnswer ? t('common.loading') : t('solo.skip')}
          onPress={() => round.handleAnswer(-1, 0)}
        />
      )}
    </Screen>
  );
}

function HintButton(props: {
  accessibilityLabel: string;
  disabled: boolean;
  icon: 'half' | 'time-plus';
  label: string;
  left: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={props.accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: props.disabled }}
      disabled={props.disabled}
      onPress={() => {
        feedback.tap();
        props.onPress();
      }}
      style={[styles.hintButton, props.disabled && styles.hintButtonOff]}
    >
      <PixelIcon color={props.disabled ? colors.textMuted : colors.highlight} name={props.icon} size={18} />
      <Text style={[styles.hintLabel, props.disabled && styles.hintLabelOff]}>{props.label}</Text>
      <Text style={styles.hintLeft}>×{props.left}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hintButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    borderWidth: 2,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  hintButtonOff: {
    opacity: 0.55,
  },
  hintLabel: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: typography.caption,
  },
  hintLabelOff: {
    color: colors.textMuted,
  },
  hintLeft: {
    color: colors.textMuted,
    fontFamily: fonts.bold,
    fontSize: typography.micro,
  },
  hintRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  errorText: {
    color: colors.danger,
    fontFamily: fonts.bold,
    fontSize: typography.caption,
  },
  factCard: {
    marginBottom: 0,
  },
  factEyebrow: {
    color: colors.accent,
    fontFamily: fonts.display,
    fontSize: typography.overline,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  factEyebrowRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  factHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  factHeading: {
    flex: 1,
    gap: spacing.xxs,
  },
  factText: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: typography.body,
    lineHeight: 23,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    borderWidth: 2,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  iconButtonActive: {
    backgroundColor: colors.highlight,
    borderColor: colors.highlight,
  },
  kicker: {
    color: colors.accent,
    fontFamily: fonts.display,
    fontSize: typography.overline,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  leadIn: {
    alignItems: 'center',
  },
  optionCell: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionList: {
    gap: spacing.sm,
  },
  pendingCopy: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: typography.body,
    lineHeight: 22,
    textAlign: 'center',
  },
  pendingTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: typography.h2,
    marginBottom: spacing.sm,
  },
  progressTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.black,
    fontSize: typography.h2,
  },
  questionCard: {
    gap: spacing.md,
    marginBottom: 0,
  },
  questionMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  questionPrompt: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: typography.h3,
    lineHeight: 28,
  },
  titleBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  topicChip: {
    alignItems: 'center',
    backgroundColor: colors.surfaceInset,
    borderRadius: radii.sm,
    flexDirection: 'row',
    flexShrink: 1,
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  topicLabel: {
    color: colors.textSecondary,
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: typography.caption,
  },
  verdict: {
    fontFamily: fonts.display,
    fontSize: typography.h2,
  },
  verdictCorrect: {
    color: colors.success,
  },
  verdictWrong: {
    color: colors.wrong,
  },
});
