import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton, SecondaryButton } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Screen } from '../../components/ui/screen';
import { StatPill } from '../../components/ui/stat-pill';
import { BadgeChip } from '../ui/badge-chip';
import { WorldBackground } from '../ui/world-background';
import { getResultBadgeModel } from './result-badges';
import type { MatchRecord } from './match-record';
import { colors, radii, spacing, typography } from '../../theme/tokens';

type ResultsViewProps = {
  difficultyLabel: string;
  matchRecord: MatchRecord;
  onBackHome: () => void;
  onPlayAgain: () => void;
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
    correctShort: string;
    difficulty: string;
    insights: string;
    learned: string;
    playAgain: string;
    roomCodePrefix: string;
    score: string;
    source: string;
    subtitle: string;
    title: string;
    you: string;
  };
};

export function ResultsView({
  difficultyLabel,
  matchRecord,
  onBackHome,
  onPlayAgain,
  sourceLabel,
  strings,
}: ResultsViewProps) {
  const badge = getResultBadgeModel({
    difficulty: matchRecord.difficulty ?? 'medium',
    perfectRound: matchRecord.correctAnswers === matchRecord.questionCount,
  });
  const badgeLabel = {
    'nether-pro-perfect': strings.badges.netherPerfect,
    'perfect-clear': strings.badges.perfectClear,
    'standard-clear': strings.badges.standardClear,
  }[badge.id] ?? strings.badges.standardClear;

  return (
    <Screen scrollable>
      <Card highlight style={styles.hero}>
        <WorldBackground
          style={styles.worldCard}
          variant={badge.id === 'nether-pro-perfect' ? 'nether' : 'reward'}
        >
          <View style={styles.trophyHeader}>
            <View style={styles.heroHeader}>
              <Text style={styles.kicker}>{strings.subtitle}</Text>
              <Text style={styles.title}>{strings.title}</Text>
            </View>
            <BadgeChip icon={badge.icon} label={badgeLabel} tone={badge.tone} />
          </View>
          <View style={styles.heroSummary}>
            <View style={styles.heroStats}>
              <StatPill label={strings.score} value={String(matchRecord.score)} />
              <StatPill label={strings.bestStreak} value={String(matchRecord.bestStreak)} />
              <StatPill
                label={strings.accuracyLabel}
                value={`${matchRecord.correctAnswers}/${matchRecord.questionCount}`}
              />
              <StatPill label={strings.difficulty} value={difficultyLabel} />
              <StatPill label={strings.source} value={sourceLabel} />
            </View>
            {matchRecord.roomCode ? <Text style={styles.roomCode}>{strings.roomCodePrefix} {matchRecord.roomCode}</Text> : null}
          </View>
        </WorldBackground>
      </Card>

      <View style={styles.podiumStage}>
        {matchRecord.participants.slice(0, 3).map((entry, index) => {
          const isWinner = index === 0;

          return (
            <Card
              highlight={isWinner || entry.isPlayer}
              key={`${entry.name}-${entry.score}`}
              style={isWinner ? styles.podiumCenter : styles.podiumSide}
            >
              <Text style={styles.podiumPlace}>#{index + 1}</Text>
              <Text style={isWinner ? styles.podiumScore : styles.podiumValue}>{entry.score}</Text>
              <Text style={styles.podiumCopy}>{entry.isPlayer ? strings.you : entry.name}</Text>
            </Card>
          );
        })}
      </View>

      <Card style={styles.fieldNotes} tone="panel">
        <Text style={styles.sectionTitle}>{strings.insights}</Text>
        {matchRecord.breakdown.slice(0, 3).map((entry) => (
          <View key={entry.questionId} style={styles.insightRow}>
            <Text style={styles.insightPrompt}>{entry.prompt}</Text>
            <Text style={[styles.insightStatus, entry.isCorrect ? styles.correct : styles.wrong]}>
              {entry.isCorrect ? strings.correctShort : strings.learned}
            </Text>
            <Text style={styles.insightExplanation}>{entry.explanation}</Text>
          </View>
        ))}
      </Card>

      <View style={styles.actionStack}>
        <PrimaryButton label={strings.playAgain} onPress={onPlayAgain} />
        <SecondaryButton label={strings.backHome} onPress={onBackHome} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: 0,
  },
  kicker: {
    color: colors.highlight,
    fontSize: typography.overline,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.display,
    fontWeight: '800',
  },
  trophyHeader: {
    gap: spacing.sm,
  },
  heroStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  worldCard: {
    gap: spacing.sm,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  heroHeader: {
    gap: spacing.sm,
    maxWidth: 720,
  },
  heroSummary: {
    backgroundColor: colors.surfaceInset,
    borderColor: colors.borderStrong,
    borderRadius: radii.xl,
    borderWidth: 2,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  roomCode: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  podiumStage: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  fieldNotes: {
    borderWidth: 2,
  },
  podiumCenter: {
    flexBasis: 220,
    flexGrow: 1.1,
    minHeight: 168,
    minWidth: 180,
  },
  podiumSide: {
    flexBasis: 180,
    flexGrow: 0.9,
    minHeight: 132,
    minWidth: 150,
  },
  podiumPlace: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  podiumScore: {
    color: colors.textPrimary,
    fontSize: 40,
    fontWeight: '900',
  },
  podiumCopy: {
    color: colors.textSecondary,
    flexShrink: 1,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  podiumValue: {
    color: colors.textPrimary,
    fontSize: typography.h2,
    fontWeight: '800',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.h3,
    fontWeight: '800',
  },
  insightRow: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  insightPrompt: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '800',
  },
  insightStatus: {
    fontSize: typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  correct: {
    color: colors.success,
  },
  wrong: {
    color: colors.highlight,
  },
  insightExplanation: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    lineHeight: 20,
  },
  actionStack: {
    gap: spacing.sm,
  },
});
