import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton, SecondaryButton } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Screen } from '../../components/ui/screen';
import { StatPill } from '../../components/ui/stat-pill';
import { BadgeChip } from '../ui/badge-chip';
import { WorldBackground } from '../ui/world-background';
import { getResultBadgeModel } from './result-badges';
import type { QuizResultSummary } from '../quiz/types';
import { colors, spacing, typography } from '../../theme/tokens';

type ResultsViewProps = {
  difficultyLabel: string;
  onBackHome: () => void;
  onPlayAgain: () => void;
  result: QuizResultSummary;
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
    subtitle: string;
    title: string;
    you: string;
  };
};

export function ResultsView({ difficultyLabel, onBackHome, onPlayAgain, result, strings }: ResultsViewProps) {
  const badge = getResultBadgeModel({
    difficulty: result.difficulty ?? 'medium',
    perfectRound: result.correctAnswers === result.questionCount,
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
          variant={badge.id === 'nether-pro-perfect' ? 'nether' : 'overworld'}
        >
          <Text style={styles.kicker}>{strings.subtitle}</Text>
          <Text style={styles.title}>{strings.title}</Text>
          <BadgeChip icon={badge.icon} label={badgeLabel} tone={badge.tone} />
          <View style={styles.heroStats}>
            <StatPill label={strings.score} value={String(result.score)} />
            <StatPill label={strings.bestStreak} value={String(result.bestStreak)} />
            <StatPill
              label={strings.accuracyLabel}
              value={`${result.correctAnswers}/${result.questionCount}`}
            />
            <StatPill label={strings.difficulty} value={difficultyLabel} />
          </View>
          {result.roomCode ? <Text style={styles.roomCode}>{strings.roomCodePrefix} {result.roomCode}</Text> : null}
        </WorldBackground>
      </Card>

      <View style={styles.podiumRow}>
        {result.standings.slice(0, 3).map((entry, index) => {
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

      <Card>
        <Text style={styles.sectionTitle}>{strings.insights}</Text>
        {result.breakdown.slice(0, 3).map((entry) => (
          <View key={entry.questionId} style={styles.insightRow}>
            <Text style={styles.insightPrompt}>{entry.prompt}</Text>
            <Text style={[styles.insightStatus, entry.isCorrect ? styles.correct : styles.wrong]}>
              {entry.isCorrect ? strings.correctShort : strings.learned}
            </Text>
            <Text style={styles.insightExplanation}>{entry.explanation}</Text>
          </View>
        ))}
      </Card>

      <PrimaryButton label={strings.playAgain} onPress={onPlayAgain} />
      <SecondaryButton label={strings.backHome} onPress={onBackHome} />
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
  roomCode: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  podiumRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  podiumCenter: {
    flex: 1.1,
    minHeight: 168,
  },
  podiumSide: {
    flex: 0.9,
    minHeight: 132,
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
});
