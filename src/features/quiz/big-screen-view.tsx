import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { colors, fonts, radii, spacing } from '../../theme/tokens';
import type { RoundStanding } from '../rooms/types';
import { PixelIcon } from '../ui/pixel-icon';
import { ItemIcon, QuestionMediaView } from './question-media';
import { optionLetters } from './question-parts';
import { RoomTimelinePanel } from './room-timeline-panel';
import type { TimelinePhase } from './round/timeline';
import type { QuizQuestion } from './types';

type BigScreenViewProps = {
  answeredCount: number;
  correctIndex?: number;
  index: number;
  phase: TimelinePhase | null;
  playerCount: number;
  question: QuizQuestion;
  standings: RoundStanding[];
  standingsQuestionCount: number;
  timeLeft: number;
  total: number;
};

/**
 * The host's TV or projector in a big-screen room: the question large for the whole room, the
 * answers come from the players' phones. Text scales with the screen width.
 */
export function BigScreenView(props: BigScreenViewProps) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const scale = Math.min(2, Math.max(1, width / 700));
  const isOpen = props.phase?.kind === 'question';
  const revealed = typeof props.correctIndex === 'number';

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={[styles.counter, { fontSize: 20 * scale }]}>
          {t('solo.progress', { current: props.index + 1, total: props.total })}
        </Text>
        <View accessibilityLabel={t('solo.secondsLeft', { count: props.timeLeft })} accessible style={styles.timer}>
          <PixelIcon color={props.timeLeft <= 5 && isOpen ? colors.danger : colors.highlight} name="hourglass" size={22 * scale} />
          <Text style={[styles.timerText, { fontSize: 32 * scale }, props.timeLeft <= 5 && isOpen && styles.timerLow]}>
            {isOpen ? props.timeLeft : '–'}
          </Text>
        </View>
      </View>

      <Animated.View entering={FadeInDown.duration(320)} key={props.question.id} style={styles.questionCard}>
        <Text accessibilityRole="header" style={[styles.prompt, { fontSize: 30 * scale, lineHeight: 40 * scale }]}>
          {props.question.prompt}
        </Text>
        {props.question.media ? (
          <QuestionMediaView labels={{ picture: t('questionMedia.picture'), recipe: t('questionMedia.recipe') }} media={props.question.media} />
        ) : null}
      </Animated.View>

      <View style={styles.options}>
        {props.question.options.map((option, optionIndex) => {
          const isCorrect = revealed && optionIndex === props.correctIndex;

          return (
            <Animated.View
              entering={isCorrect ? ZoomIn.duration(300) : FadeInDown.delay(optionIndex * 60).duration(260)}
              key={`${props.question.id}-${optionIndex}-${isCorrect}`}
              style={[styles.option, isCorrect && styles.optionCorrect, revealed && !isCorrect && styles.optionDimmed]}
            >
              <View style={[styles.letter, isCorrect && styles.letterCorrect]}>
                <Text style={[styles.letterText, { fontSize: 22 * scale }]}>{optionLetters[optionIndex]}</Text>
              </View>
              {props.question.optionIcons?.[optionIndex] ? <ItemIcon id={props.question.optionIcons[optionIndex]} size={36 * scale} /> : null}
              <Text style={[styles.optionText, { fontSize: 22 * scale }]}>{option}</Text>
              {isCorrect ? <PixelIcon color={colors.success} name="check" size={26 * scale} /> : null}
            </Animated.View>
          );
        })}
      </View>

      <RoomTimelinePanel
        answeredCount={props.answeredCount}
        phase={props.phase}
        playerCount={props.playerCount}
        questionCount={props.total}
        standings={props.standings}
        standingsQuestionCount={props.standingsQuestionCount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  counter: {
    color: colors.textSecondary,
    fontFamily: fonts.display,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  letter: {
    alignItems: 'center',
    backgroundColor: colors.borderStrong,
    borderRadius: radii.md,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  letterCorrect: {
    backgroundColor: colors.success,
  },
  letterText: {
    color: colors.textPrimary,
    fontFamily: fonts.black,
  },
  option: {
    alignItems: 'center',
    backgroundColor: colors.panelSurface,
    borderColor: colors.borderStrong,
    borderRadius: radii.lg,
    borderWidth: 3,
    flexBasis: '48%',
    flexDirection: 'row',
    flexGrow: 1,
    gap: spacing.md,
    minHeight: 80,
    padding: spacing.md,
  },
  optionCorrect: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  optionDimmed: {
    opacity: 0.45,
  },
  optionText: {
    color: colors.textPrimary,
    flex: 1,
    fontFamily: fonts.extraBold,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  prompt: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    textAlign: 'center',
  },
  questionCard: {
    backgroundColor: colors.sceneSurface,
    borderColor: colors.highlight,
    borderRadius: radii.xl,
    borderWidth: 3,
    gap: spacing.lg,
    padding: spacing.xl,
  },
  screen: {
    gap: spacing.lg,
  },
  timer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timerLow: {
    color: colors.danger,
  },
  timerText: {
    color: colors.highlight,
    fontFamily: fonts.black,
  },
});
