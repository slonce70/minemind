import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { PrimaryButton, SecondaryButton } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { StatPill } from '../../components/ui/stat-pill';
import { appTheme, colors, fonts, radii, spacing, typography } from '../../theme/tokens';
import type { ContentDifficulty } from '../content/types';
import { feedback } from '../feel/feedback';
import { PlayerAvatar } from '../profile/player-avatar';
import type { MatchRecord } from '../results/match-record';
import { Mascot } from '../ui/mascot';
import { PixelIcon } from '../ui/pixel-icon';
import { WorldBackground } from '../ui/world-background';
import { DifficultySelector } from './difficulty-selector';
import { getHomeRoomPanelModel } from './home-room-panel';

type HomeViewProps = {
  avatarId: string;
  difficultyStrings: Record<ContentDifficulty, string>;
  hasActiveRoom: boolean;
  latestMatch?: MatchRecord;
  modeLabel: string;
  nickname: string;
  onOpenClassroom: () => void;
  onOpenProfile: () => void;
  onOpenResults: () => void;
  onOpenSettings: () => void;
  onPlaySolo: () => void;
  onRoomAction: () => void;
  onSelectDifficulty: (difficulty: ContentDifficulty) => void;
  roomActionLabel: string;
  selectedDifficulty: ContentDifficulty;
  strings: {
    activeRoomCopy: string;
    activeRoomTitle: string;
    classroomAction: string;
    classroomCardCopy: string;
    classroomCardTitle: string;
    difficultyHelper: string;
    difficultySelectorLabel: string;
    primaryCardCopy: string;
    primaryCardTitle: string;
    profileA11y: string;
    resultCorrectLabel: string;
    resultScoreLabel: string;
    resultStreakLabel: string;
    resultTitle: string;
    resultsAction: string;
    roomCardCopy: string;
    roomCardTitle: string;
    settingsA11y: string;
    timerA11y: string;
    title: string;
  };
};

export function HomeView({
  avatarId,
  difficultyStrings,
  hasActiveRoom,
  latestMatch,
  modeLabel,
  nickname,
  onOpenClassroom,
  onOpenProfile,
  onOpenResults,
  onOpenSettings,
  onPlaySolo,
  onRoomAction,
  onSelectDifficulty,
  roomActionLabel,
  selectedDifficulty,
  strings,
}: HomeViewProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= appTheme.layout.wideBreakpoint;
  const roomPanel = getHomeRoomPanelModel({ hasActiveRoom, strings });
  const RoomButton = roomPanel.actionVariant === 'primary' ? PrimaryButton : SecondaryButton;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel={strings.profileA11y}
          accessibilityRole="button"
          onPress={() => {
            feedback.tap();
            onOpenProfile();
          }}
          style={styles.profileButton}
        >
          <PlayerAvatar avatarId={avatarId} size={44} />
          <View style={styles.profileText}>
            <Text numberOfLines={1} style={styles.profileName}>
              {nickname}
            </Text>
            <Text numberOfLines={1} style={styles.profileMeta}>
              {modeLabel}
            </Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityLabel={strings.settingsA11y}
          accessibilityRole="button"
          hitSlop={6}
          onPress={() => {
            feedback.tap();
            onOpenSettings();
          }}
          style={styles.iconButton}
        >
          <PixelIcon color={colors.textPrimary} name="gear" size={22} />
        </Pressable>
      </View>

      <Card highlight style={styles.heroCard} tone="scene">
        <WorldBackground style={styles.worldCard} variant="overworld">
          <View style={styles.heroHeader}>
            <Mascot size={isWide ? 104 : 80} />
            <View style={styles.heroText}>
              <Text accessibilityRole="header" style={styles.heroTitle}>
                {strings.title}
              </Text>
              <Text style={styles.heroSubtitle}>{strings.primaryCardCopy}</Text>
            </View>
          </View>

          <View style={styles.heroControlZone}>
            <DifficultySelector
              label={strings.difficultySelectorLabel}
              onSelect={onSelectDifficulty}
              selectedDifficulty={selectedDifficulty}
              strings={difficultyStrings}
              timerLabel={(seconds) => strings.timerA11y.replace('{{seconds}}', String(seconds))}
            />
            <Text style={styles.selectorCopy}>{strings.difficultyHelper}</Text>
            <PrimaryButton label={strings.primaryCardTitle} onPress={onPlaySolo} testID="play-solo" />
          </View>
        </WorldBackground>
      </Card>

      <View style={styles.routeBoard}>
        <View style={[styles.supportRoutes, isWide && styles.supportRoutesWide]}>
          <Card style={[styles.supportRoute, isWide && styles.supportRouteWide]} tone="panel">
            <View style={styles.routeHeader}>
              <PixelIcon color={colors.highlight} name="people" size={24} />
              <Text style={styles.sectionTitle}>{roomPanel.title}</Text>
            </View>
            <Text style={styles.copy}>{roomPanel.copy}</Text>
            <RoomButton label={roomActionLabel} onPress={onRoomAction} />
          </Card>

          <Card style={[styles.supportRoute, isWide && styles.supportRouteWide]} tone="panel">
            <View style={styles.routeHeader}>
              <PixelIcon color={colors.highlight} name="classroom" size={24} />
              <Text style={styles.sectionTitle}>{strings.classroomCardTitle}</Text>
            </View>
            <Text style={styles.copy}>{strings.classroomCardCopy}</Text>
            <SecondaryButton label={strings.classroomAction} onPress={onOpenClassroom} />
          </Card>
        </View>
      </View>

      {latestMatch ? (
        <Card style={styles.expeditionLog} tone="utility">
          <View style={styles.routeHeader}>
            <PixelIcon color={colors.highlight} name="trophy" size={22} />
            <Text style={styles.sectionTitle}>{strings.resultTitle}</Text>
          </View>
          <View style={styles.resultGrid}>
            <StatPill label={strings.resultScoreLabel} value={String(latestMatch.score)} />
            <StatPill label={strings.resultCorrectLabel} value={`${latestMatch.correctAnswers}/${latestMatch.questionCount}`} />
            <StatPill label={strings.resultStreakLabel} value={String(latestMatch.bestStreak)} />
          </View>
          <SecondaryButton label={strings.resultsAction} onPress={onOpenResults} />
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  copy: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: typography.body,
    lineHeight: 22,
  },
  expeditionLog: {
    borderWidth: 2,
    marginBottom: 0,
  },
  heroCard: {
    marginBottom: 0,
    padding: 0,
  },
  heroControlZone: {
    backgroundColor: colors.panelSurface,
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  heroHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: typography.body,
    lineHeight: 22,
  },
  heroText: {
    flex: 1,
    gap: spacing.xs,
  },
  heroTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: typography.h1,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    borderWidth: 2,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  profileButton: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 48,
  },
  profileMeta: {
    color: colors.textMuted,
    fontFamily: fonts.semiBold,
    fontSize: typography.caption,
  },
  profileName: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: typography.body,
  },
  profileText: {
    flex: 1,
    minWidth: 0,
  },
  resultGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  routeBoard: {
    gap: spacing.sm,
  },
  routeHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.textPrimary,
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: typography.h3,
  },
  selectorCopy: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: typography.caption,
    lineHeight: 20,
  },
  supportRoute: {
    marginBottom: 0,
    minWidth: 0,
  },
  supportRouteWide: {
    flex: 1,
  },
  supportRoutes: {
    gap: spacing.md,
  },
  supportRoutesWide: {
    flexDirection: 'row',
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  worldCard: {
    gap: spacing.md,
    padding: spacing.md,
    paddingTop: spacing.lg,
  },
});
