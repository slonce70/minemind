import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card } from '../../components/ui/card';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import type { RoundStanding } from '../rooms/types';
import type { TimelinePhase } from './round/timeline';

type RoomTimelinePanelProps = {
  answeredCount: number;
  localPlayerId?: string;
  phase: TimelinePhase | null;
  playerCount: number;
  questionCount: number;
  standings: RoundStanding[];
  standingsQuestionCount: number;
};

/** Live room status under the question: who answered, the standings and the next question. */
export function RoomTimelinePanel({
  answeredCount,
  localPlayerId,
  phase,
  playerCount,
  questionCount,
  standings,
  standingsQuestionCount,
}: RoomTimelinePanelProps) {
  const { t } = useTranslation();
  const isBetween = phase?.kind === 'between';

  return (
    <Card style={styles.panel}>
      {phase?.kind === 'question' ? (
        <Text style={styles.status}>
          {t('solo.timelineAnswered', { answered: Math.min(answeredCount, playerCount), total: playerCount })}
        </Text>
      ) : null}

      {isBetween && standingsQuestionCount > 0 && standings.length > 0 ? (
        <View style={styles.standings}>
          <Text style={styles.eyebrow}>{t('solo.timelineStandings', { count: standingsQuestionCount })}</Text>
          {standings.slice(0, 8).map((entry) => (
            <View
              key={entry.playerId}
              style={[styles.standingRow, entry.playerId === localPlayerId && styles.standingRowLocal]}
            >
              <Text style={styles.standingRank}>#{entry.rank}</Text>
              <Text numberOfLines={1} style={styles.standingName}>
                {entry.name}
              </Text>
              <Text style={styles.standingScore}>{entry.score}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {isBetween ? (
        <Text style={styles.status}>
          {phase.index === questionCount - 1
            ? t('solo.timelineResultsSoon')
            : t('solo.timelineNextIn', { seconds: phase.secondsLeft })}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.accent,
    fontSize: typography.overline,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  panel: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  standingName: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: typography.body,
    fontWeight: '700',
  },
  standingRank: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '800',
    width: 32,
  },
  standingRow: {
    alignItems: 'center',
    borderRadius: radii.lg,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  standingRowLocal: {
    backgroundColor: colors.surfaceRaised,
  },
  standingScore: {
    color: colors.highlight,
    fontSize: typography.body,
    fontWeight: '800',
  },
  standings: {
    gap: spacing.xs,
  },
  status: {
    color: colors.textSecondary,
    fontSize: typography.body,
    fontWeight: '700',
  },
});
