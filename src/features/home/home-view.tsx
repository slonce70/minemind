import { StyleSheet, Text, View } from 'react-native';

import { Card } from '../../components/ui/card';
import { PrimaryButton, SecondaryButton } from '../../components/ui/button';
import { StatPill } from '../../components/ui/stat-pill';
import type { ContentDifficulty } from '../content/types';
import { DifficultySelector } from './difficulty-selector';
import type { MatchRecord } from '../results/match-record';
import { BadgeChip } from '../ui/badge-chip';
import { WorldBackground } from '../ui/world-background';
import { colors, radii, spacing, typography } from '../../theme/tokens';

type HomeViewProps = {
  difficultyLabel: string;
  difficultyStrings: Record<ContentDifficulty, string>;
  hasActiveRoom: boolean;
  latestMatch?: MatchRecord;
  latestMatchSourceLabel?: string;
  localeLabel: string;
  modeLabel: string;
  nickname: string;
  onOpenClassroom: () => void;
  onOpenResults: () => void;
  onPlaySolo: () => void;
  onResetProfile: () => void;
  onRoomAction: () => void;
  onSelectDifficulty: (difficulty: ContentDifficulty) => void;
  roomActionLabel: string;
  selectedDifficulty: ContentDifficulty;
  strings: {
    activeRoomTitle: string;
    activeRoomCopy: string;
    classroomAction: string;
    classroomCardCopy: string;
    classroomCardTitle: string;
    difficultyHelper: string;
    difficultySelectorLabel: string;
    localeLabel: string;
    modeLabel: string;
    modeSelectorCopy: string;
    primaryCardCopy: string;
    primaryCardTitle: string;
    resultCorrectLabel: string;
    resultScoreLabel: string;
    resultSourceLabel: string;
    resultStreakLabel: string;
    resultTitle: string;
    resultsAction: string;
    roomCardCopy: string;
    roomCardTitle: string;
    switchProfile: string;
    title: string;
  };
};

export function HomeView({
  difficultyLabel,
  difficultyStrings,
  hasActiveRoom,
  latestMatch,
  latestMatchSourceLabel,
  localeLabel,
  modeLabel,
  nickname,
  onOpenClassroom,
  onOpenResults,
  onPlaySolo,
  onResetProfile,
  onRoomAction,
  onSelectDifficulty,
  roomActionLabel,
  selectedDifficulty,
  strings,
}: HomeViewProps) {
  return (
    <View style={styles.container}>
      <Card highlight style={styles.heroCard} tone="scene">
        <WorldBackground style={styles.worldCard} variant="overworld">
          <View style={styles.heroHeader}>
            <Text style={styles.heroEyebrow}>{strings.modeSelectorCopy}</Text>
            <Text style={styles.heroTitle}>{strings.title.replace('{{name}}', nickname)}</Text>
            <Text style={styles.heroSubtitle}>{strings.primaryCardCopy}</Text>
            <BadgeChip icon="pickaxe" label={difficultyLabel} tone="warning" />
          </View>

          <View style={styles.heroControlZone}>
            <View style={styles.heroMetaGrid}>
              <StatPill label={strings.localeLabel} value={localeLabel} />
              <StatPill label={strings.modeLabel} value={modeLabel} />
              <StatPill label={strings.difficultySelectorLabel} value={difficultyLabel} />
            </View>
            <Text style={styles.selectorCopy}>{strings.difficultyHelper}</Text>
            <DifficultySelector
              label={strings.difficultySelectorLabel}
              onSelect={onSelectDifficulty}
              selectedDifficulty={selectedDifficulty}
              strings={difficultyStrings}
            />
          </View>
        </WorldBackground>
      </Card>

      <View style={styles.routeBoard}>
        <Card style={styles.primaryRoute} tone="scene">
          <Text style={styles.routeEyebrow}>{strings.primaryCardTitle}</Text>
          <Text style={styles.routeTitle}>{strings.primaryCardCopy}</Text>
          <PrimaryButton label={strings.primaryCardTitle} onPress={onPlaySolo} />
        </Card>

        <View style={styles.supportRoutes}>
          <Card style={styles.supportRoute} tone="panel">
            <Text style={styles.sectionTitle}>{strings.roomCardTitle}</Text>
            <Text style={styles.copy}>{strings.roomCardCopy}</Text>
            <SecondaryButton label={roomActionLabel} onPress={onRoomAction} />
          </Card>

          <Card style={styles.supportRoute} tone="panel">
            <Text style={styles.sectionTitle}>{strings.classroomCardTitle}</Text>
            <Text style={styles.copy}>{strings.classroomCardCopy}</Text>
            <SecondaryButton label={strings.classroomAction} onPress={onOpenClassroom} />
          </Card>
        </View>
      </View>

      {hasActiveRoom ? (
        <Card tone="panel">
          <Text style={styles.sectionTitle}>{strings.activeRoomTitle}</Text>
          <Text style={styles.copy}>{strings.activeRoomCopy}</Text>
          <PrimaryButton label={roomActionLabel} onPress={onRoomAction} />
        </Card>
      ) : null}

      {latestMatch ? (
        <Card style={styles.expeditionLog} tone="utility">
          <Text style={styles.sectionTitle}>{strings.resultTitle}</Text>
          <View style={styles.resultGrid}>
            <StatPill label={strings.resultScoreLabel} value={String(latestMatch.score)} />
            <StatPill
              label={strings.resultCorrectLabel}
              value={`${latestMatch.correctAnswers}/${latestMatch.questionCount}`}
            />
            <StatPill label={strings.resultStreakLabel} value={String(latestMatch.bestStreak)} />
            {latestMatchSourceLabel ? (
              <StatPill label={strings.resultSourceLabel} value={latestMatchSourceLabel} />
            ) : null}
          </View>
          <PrimaryButton label={strings.resultsAction} onPress={onOpenResults} />
        </Card>
      ) : null}

      <SecondaryButton label={strings.switchProfile} onPress={onResetProfile} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  routeBoard: {
    gap: spacing.sm,
  },
  primaryRoute: {
    padding: spacing.lg,
  },
  supportRoutes: {
    gap: spacing.sm,
  },
  supportRoute: {
    flexBasis: 0,
  },
  expeditionLog: {
    borderWidth: 2,
  },
  heroControlZone: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  heroHeader: {
    gap: spacing.xs,
  },
  heroCard: {
    padding: 0,
  },
  routeEyebrow: {
    color: colors.torch,
    fontSize: typography.overline,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  routeTitle: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 24,
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
  heroMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  worldCard: {
    gap: spacing.sm,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  selectorCopy: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 20,
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
});
