import { StyleSheet, Text, View } from 'react-native';

import { Card } from '../../components/ui/card';
import { PrimaryButton, SecondaryButton } from '../../components/ui/button';
import { StatPill } from '../../components/ui/stat-pill';
import type { QuizResultSummary } from '../quiz/types';
import { colors, spacing, typography } from '../../theme/tokens';

type HomeViewProps = {
  hasActiveRoom: boolean;
  lastResult?: QuizResultSummary;
  leaderboardEntries: Array<{ name: string; score: number }>;
  localeLabel: string;
  modeLabel: string;
  nickname: string;
  onOpenResults: () => void;
  onPlaySolo: () => void;
  onResetProfile: () => void;
  onRoomAction: () => void;
  roomActionLabel: string;
  strings: {
    activeRoomTitle: string;
    activeRoomCopy: string;
    leaderboardTitle: string;
    localeLabel: string;
    modeLabel: string;
    modeSelectorCopy: string;
    primaryCardCopy: string;
    primaryCardTitle: string;
    resultTitle: string;
    resultsAction: string;
    roomCardCopy: string;
    roomCardTitle: string;
    switchProfile: string;
    title: string;
  };
};

export function HomeView({
  hasActiveRoom,
  lastResult,
  leaderboardEntries,
  localeLabel,
  modeLabel,
  nickname,
  onOpenResults,
  onPlaySolo,
  onResetProfile,
  onRoomAction,
  roomActionLabel,
  strings,
}: HomeViewProps) {
  return (
    <View style={styles.container}>
      <Card highlight style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>{strings.modeSelectorCopy}</Text>
        <Text style={styles.heroTitle}>{strings.title.replace('{{name}}', nickname)}</Text>
        <Text style={styles.heroSubtitle}>{strings.primaryCardCopy}</Text>
        <View style={styles.heroStats}>
          <StatPill label={strings.localeLabel} value={localeLabel} />
          <StatPill label={strings.modeLabel} value={modeLabel} />
        </View>
        <PrimaryButton label={strings.primaryCardTitle} onPress={onPlaySolo} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>{strings.roomCardTitle}</Text>
        <Text style={styles.copy}>{strings.roomCardCopy}</Text>
        <SecondaryButton label={roomActionLabel} onPress={onRoomAction} />
      </Card>

      {hasActiveRoom ? (
        <Card>
          <Text style={styles.sectionTitle}>{strings.activeRoomTitle}</Text>
          <Text style={styles.copy}>{strings.activeRoomCopy}</Text>
          <PrimaryButton label={roomActionLabel} onPress={onRoomAction} />
        </Card>
      ) : null}

      {lastResult ? (
        <Card>
          <Text style={styles.sectionTitle}>{strings.resultTitle}</Text>
          <View style={styles.resultGrid}>
            <StatPill label="Score" value={String(lastResult.score)} />
            <StatPill label="Correct" value={`${lastResult.correctAnswers}/${lastResult.questionCount}`} />
            <StatPill label="Streak" value={String(lastResult.bestStreak)} />
          </View>
          <PrimaryButton label={strings.resultsAction} onPress={onOpenResults} />
        </Card>
      ) : null}

      <Card>
        <Text style={styles.sectionTitle}>{strings.leaderboardTitle}</Text>
        {leaderboardEntries.map((entry, index) => (
          <View key={entry.name} style={styles.leaderboardRow}>
            <Text style={styles.rank}>#{index + 1}</Text>
            <Text style={styles.name}>{entry.name}</Text>
            <Text style={styles.score}>{entry.score}</Text>
          </View>
        ))}
      </Card>

      <SecondaryButton label={strings.switchProfile} onPress={onResetProfile} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  heroCard: {
    paddingTop: spacing.xl,
  },
  heroEyebrow: {
    color: colors.highlight,
    fontSize: typography.overline,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: typography.display,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 24,
  },
  heroStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.h3,
    fontWeight: '800',
  },
  copy: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 22,
  },
  resultGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  leaderboardRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: spacing.sm,
  },
  rank: {
    color: colors.highlight,
    fontSize: typography.caption,
    fontWeight: '800',
    width: 42,
  },
  name: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: typography.body,
    fontWeight: '700',
  },
  score: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: '700',
  },
});
