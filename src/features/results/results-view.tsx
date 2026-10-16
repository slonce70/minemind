import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { PrimaryButton, SecondaryButton } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Screen } from '../../components/ui/screen';
import { StatPill } from '../../components/ui/stat-pill';
import { colors, fonts, radii, spacing, typography } from '../../theme/tokens';
import { feedback } from '../feel/feedback';
import { useCountUp } from '../feel/use-count-up';
import { RewardsPanel } from '../progress/progress-parts';
import type { MatchRewards } from '../progress/progression';
import { optionLetters } from '../quiz/question-parts';
import { BadgeChip } from '../ui/badge-chip';
import { Mascot } from '../ui/mascot';
import { PixelIcon } from '../ui/pixel-icon';
import { WorldBackground } from '../ui/world-background';
import type { MatchRecord } from './match-record';
import { getResultBadgeModel } from './result-badges';

type ResultsViewProps = {
  difficultyLabel: string;
  matchRecord: MatchRecord;
  onBackHome: () => void;
  onPlayAgain: () => void;
  /** Shown only when they belong to this match. */
  rewards?: MatchRewards;
  sourceLabel: string;
  strings: {
    accuracyLabel: string;
    backHome: string;
    badges: {
      netherPerfect: string;
      perfectClear: string;
      standardClear: string;
    };
    bestStreak: string;
    correctAnswer: string;
    difficulty: string;
    noAnswer: string;
    playAgain: string;
    questionNumber: (number: number) => string;
    review: string;
    roomCodePrefix: string;
    score: string;
    scoreA11y: (score: number) => string;
    source: string;
    standings: string;
    subtitle: string;
    title: string;
    you: string;
    yourAnswer: string;
  };
};

export function ResultsView({
  difficultyLabel,
  matchRecord,
  onBackHome,
  onPlayAgain,
  rewards,
  sourceLabel,
  strings,
}: ResultsViewProps) {
  const isPerfect = matchRecord.questionCount > 0 && matchRecord.correctAnswers === matchRecord.questionCount;
  const badge = getResultBadgeModel({ difficulty: matchRecord.difficulty ?? 'medium', perfectRound: isPerfect });
  const badgeLabel =
    {
      'nether-pro-perfect': strings.badges.netherPerfect,
      'perfect-clear': strings.badges.perfectClear,
      'standard-clear': strings.badges.standardClear,
    }[badge.id] ?? strings.badges.standardClear;
  const accuracy = matchRecord.questionCount > 0 ? matchRecord.correctAnswers / matchRecord.questionCount : 0;
  const shownScore = useCountUp(matchRecord.score);
  const standings = matchRecord.participants.length > 1 ? matchRecord.participants : [];

  useEffect(() => {
    feedback.roundEnd();
  }, []);

  return (
    <Screen scrollable>
      <Card highlight style={styles.hero}>
        <WorldBackground showTerrain={false} style={styles.worldCard} variant={badge.id === 'nether-pro-perfect' ? 'nether' : 'reward'}>
          <View style={styles.heroTop}>
            <Animated.View entering={ZoomIn.duration(360)}>
              <Mascot mood={accuracy >= 0.75 ? 'happy' : accuracy >= 0.4 ? 'wow' : 'sad'} size={92} />
            </Animated.View>
            <View style={styles.heroHeader}>
              <Text style={styles.kicker}>{strings.subtitle}</Text>
              <Text accessibilityRole="header" style={styles.title}>
                {strings.title}
              </Text>
              <BadgeChip icon={badge.icon} label={badgeLabel} tone={badge.tone} />
            </View>
          </View>

          <View accessibilityLabel={strings.scoreA11y(matchRecord.score)} accessible style={styles.scoreBlock}>
            <Text style={styles.scoreLabel}>{strings.score}</Text>
            <Text style={styles.scoreValue}>{shownScore}</Text>
          </View>

          <View style={styles.heroStats}>
            <StatPill label={strings.accuracyLabel} value={`${matchRecord.correctAnswers}/${matchRecord.questionCount}`} />
            <StatPill label={strings.bestStreak} value={String(matchRecord.bestStreak)} />
            <StatPill label={strings.difficulty} value={difficultyLabel} />
            <StatPill label={strings.source} value={matchRecord.roomCode ? `${sourceLabel} · ${matchRecord.roomCode}` : sourceLabel} />
          </View>
        </WorldBackground>
      </Card>

      {rewards?.matchId === matchRecord.id ? (
        <Card tone="panel">
          <RewardsPanel rewards={rewards} />
        </Card>
      ) : null}

      {standings.length > 0 ? (
        <Card tone="panel">
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            {strings.standings}
          </Text>
          {standings.map((entry, index) => (
            <Animated.View
              entering={FadeInDown.delay(120 + index * 80).duration(260)}
              key={entry.id ?? `${entry.name}-${index}`}
              style={[styles.standingRow, entry.isPlayer && styles.standingRowPlayer]}
            >
              <View style={styles.rank}>
                {index === 0 ? <PixelIcon color={colors.highlight} name="crown" size={18} /> : <Text style={styles.rankText}>{index + 1}</Text>}
              </View>
              <Text numberOfLines={1} style={styles.standingName}>
                {entry.isPlayer ? `${entry.name} (${strings.you})` : entry.name}
              </Text>
              <Text style={styles.standingScore}>{entry.score}</Text>
            </Animated.View>
          ))}
        </Card>
      ) : null}

      <Card tone="panel">
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {strings.review}
        </Text>
        {matchRecord.breakdown.map((entry, index) => {
          const yourAnswer =
            entry.selectedIndex >= 0
              ? entry.options?.[entry.selectedIndex]
                ? `${optionLetters[entry.selectedIndex]}. ${entry.options[entry.selectedIndex]}`
                : undefined
              : strings.noAnswer;
          const correctAnswer =
            typeof entry.correctIndex === 'number' && entry.options?.[entry.correctIndex]
              ? `${optionLetters[entry.correctIndex]}. ${entry.options[entry.correctIndex]}`
              : undefined;

          return (
            <View key={entry.questionId} style={styles.reviewRow}>
              <View style={styles.reviewHeader}>
                <View style={[styles.reviewMark, entry.isCorrect ? styles.reviewMarkCorrect : styles.reviewMarkWrong]}>
                  <PixelIcon color={colors.canvas} name={entry.isCorrect ? 'check' : 'cross'} size={14} />
                </View>
                <Text style={styles.reviewNumber}>{strings.questionNumber(index + 1)}</Text>
              </View>
              <Text style={styles.reviewPrompt}>{entry.prompt}</Text>
              {yourAnswer && !entry.isCorrect ? (
                <Text style={styles.reviewLine}>
                  <Text style={styles.reviewLabelWrong}>{strings.yourAnswer}: </Text>
                  {yourAnswer}
                </Text>
              ) : null}
              {correctAnswer ? (
                <Text style={styles.reviewLine}>
                  <Text style={styles.reviewLabelCorrect}>{strings.correctAnswer}: </Text>
                  {correctAnswer}
                </Text>
              ) : null}
              {entry.explanation ? <Text style={styles.reviewExplanation}>{entry.explanation}</Text> : null}
            </View>
          );
        })}
      </Card>

      <View style={styles.actionStack}>
        <PrimaryButton label={strings.playAgain} onPress={onPlayAgain} />
        <SecondaryButton label={strings.backHome} onPress={onBackHome} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionStack: {
    gap: spacing.sm,
  },
  hero: {
    padding: 0,
  },
  heroHeader: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 180,
  },
  heroStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  kicker: {
    color: colors.highlight,
    fontFamily: fonts.display,
    fontSize: typography.overline,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  rank: {
    alignItems: 'center',
    width: 28,
  },
  rankText: {
    color: colors.textMuted,
    fontFamily: fonts.black,
    fontSize: typography.h3,
  },
  reviewExplanation: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: typography.caption,
    lineHeight: 20,
  },
  reviewHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  reviewLabelCorrect: {
    color: colors.success,
    fontFamily: fonts.extraBold,
  },
  reviewLabelWrong: {
    color: colors.wrong,
    fontFamily: fonts.extraBold,
  },
  reviewLine: {
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
    fontSize: typography.caption,
    lineHeight: 20,
  },
  reviewMark: {
    alignItems: 'center',
    borderRadius: radii.sm,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  reviewMarkCorrect: {
    backgroundColor: colors.success,
  },
  reviewMarkWrong: {
    backgroundColor: colors.danger,
  },
  reviewNumber: {
    color: colors.textMuted,
    fontFamily: fonts.display,
    fontSize: typography.overline,
    textTransform: 'uppercase',
  },
  reviewPrompt: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: typography.body,
    lineHeight: 22,
  },
  reviewRow: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.xs,
    paddingTop: spacing.md,
  },
  scoreBlock: {
    alignItems: 'center',
    backgroundColor: colors.surfaceInset,
    borderColor: colors.borderStrong,
    borderRadius: radii.xl,
    borderWidth: 2,
    paddingVertical: spacing.md,
  },
  scoreLabel: {
    color: colors.textMuted,
    fontFamily: fonts.display,
    fontSize: typography.overline,
    textTransform: 'uppercase',
  },
  scoreValue: {
    color: colors.highlight,
    fontFamily: fonts.black,
    fontSize: 56,
    fontVariant: ['tabular-nums'],
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: typography.h2,
  },
  standingName: {
    color: colors.textPrimary,
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: typography.body,
  },
  standingRow: {
    alignItems: 'center',
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  standingRowPlayer: {
    backgroundColor: colors.surfaceAccent,
  },
  standingScore: {
    color: colors.highlight,
    fontFamily: fonts.black,
    fontSize: typography.h3,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: typography.h1,
  },
  worldCard: {
    gap: spacing.md,
    padding: spacing.lg,
  },
});
