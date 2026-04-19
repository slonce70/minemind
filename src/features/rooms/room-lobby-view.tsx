import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton, SecondaryButton } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { StatPill } from '../../components/ui/stat-pill';
import { avatarLookup } from '../profile/avatar-presets';
import type { ContentDifficulty } from '../content/types';
import { DifficultySelector } from '../home/difficulty-selector';
import { BadgeChip } from '../ui/badge-chip';
import { WorldBackground } from '../ui/world-background';
import type { ActiveRoom } from './types';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { deriveRoomLobbyState } from './room-lobby-state';

type RoomLobbyViewProps = {
  activeRoom?: ActiveRoom;
  canResumeRound: boolean;
  difficultyStrings: Record<ContentDifficulty, string>;
  selectedDifficulty: ContentDifficulty;
  errorMessage?: string | null;
  isBusy: boolean;
  isOfflineMode: boolean;
  joinCode: string;
  onAddDemoPlayers: () => void;
  onChangeJoinCode: (value: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onLeaveRoom: () => void;
  onSelectDifficulty: (difficulty: ContentDifficulty) => void;
  onStartBattle: () => void;
  onToggleReady: () => void;
  roomActionLabel: string;
  strings: {
    activeRoom: string;
    activeRoomCopy: string;
    addDemoPlayers: string;
    createRoom: string;
    difficultyHint: string;
    difficultyLabel: string;
    heroEyebrow: string;
    joinRoomAction: string;
    joinRoomPlaceholder: string;
    joinRoomTitle: string;
    leaveRoom: string;
    lobbyTitle: string;
    loading: string;
    notReady: string;
    ready: string;
    readySummary: string;
    startBattle: string;
    subtitle: string;
    title: string;
    toggleReady: string;
  };
};

export function RoomLobbyView({
  activeRoom,
  canResumeRound,
  difficultyStrings,
  selectedDifficulty,
  errorMessage,
  isBusy,
  isOfflineMode,
  joinCode,
  onAddDemoPlayers,
  onChangeJoinCode,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onSelectDifficulty,
  onStartBattle,
  onToggleReady,
  roomActionLabel,
  strings,
}: RoomLobbyViewProps) {
  const lobbyState = activeRoom ? deriveRoomLobbyState(activeRoom) : null;
  const isStartDisabled = isBusy || (!canResumeRound && !lobbyState?.canStart);
  const displayedDifficulty = activeRoom?.status === 'active' ? activeRoom.settings.difficulty : selectedDifficulty;

  return (
    <View style={styles.container}>
      <Card highlight tone="scene">
        <WorldBackground style={styles.worldCard} variant="cave">
          <View style={styles.heroHeader}>
            <Text style={styles.eyebrow}>{strings.heroEyebrow}</Text>
            <Text style={styles.title}>{strings.title}</Text>
            <Text style={styles.subtitle}>{strings.subtitle}</Text>
            <BadgeChip label={difficultyStrings[displayedDifficulty]} tone="warning" />
          </View>
          <View style={styles.heroControlZone}>
            <Text style={styles.helper}>{strings.difficultyHint}</Text>
            <DifficultySelector
              label={strings.difficultyLabel}
              onSelect={onSelectDifficulty}
              selectedDifficulty={displayedDifficulty}
              strings={difficultyStrings}
            />
          </View>
        </WorldBackground>
      </Card>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      {activeRoom ? (
        <>
          <Card style={styles.commandSurface} tone="scene">
            <Text style={styles.sectionTitle}>{strings.activeRoom}</Text>
            <Text style={styles.roomCode}>{activeRoom.roomCode}</Text>
            <Text style={styles.copy}>{strings.activeRoomCopy}</Text>
            <View style={styles.commandMetaGrid}>
              <StatPill
                label={strings.difficultyLabel}
                value={difficultyStrings[displayedDifficulty]}
              />
              <StatPill
                label={strings.lobbyTitle}
                value={String(activeRoom.participants.length)}
              />
              {lobbyState ? (
                <StatPill
                  label={strings.ready}
                  value={`${lobbyState.readyCount}/${lobbyState.participantCount}`}
                />
              ) : null}
            </View>
            {lobbyState ? (
              <Text style={styles.readySummary}>
                {strings.readySummary
                  .replace('{{readyCount}}', String(lobbyState.readyCount))
                  .replace('{{participantCount}}', String(lobbyState.participantCount))}
              </Text>
            ) : null}
            <View style={styles.commandActionRail}>
              {isOfflineMode ? <PrimaryButton label={strings.addDemoPlayers} onPress={onAddDemoPlayers} /> : null}
              <SecondaryButton
                label={isBusy ? strings.loading : strings.toggleReady}
                onPress={onToggleReady}
              />
              <PrimaryButton
                disabled={isStartDisabled}
                label={isBusy ? strings.loading : roomActionLabel}
                onPress={onStartBattle}
              />
              <SecondaryButton label={strings.leaveRoom} onPress={onLeaveRoom} />
            </View>
          </Card>

          <Card style={styles.rosterSurface} tone="panel">
            <Text style={styles.sectionTitle}>{strings.lobbyTitle}</Text>
            <View style={styles.participantList}>
              {activeRoom.participants.map((participant) => {
                const avatar = avatarLookup[participant.avatarId];

                return (
                  <View key={participant.id} style={styles.participantRow}>
                    <View style={[styles.participantBadge, { backgroundColor: avatar?.color ?? colors.highlight }]}>
                      <Text style={styles.participantInitial}>{participant.name[0]}</Text>
                    </View>
                    <View style={styles.participantMeta}>
                      <Text style={styles.participantName}>{participant.name}</Text>
                      <Text style={styles.participantState}>
                        {participant.ready ? strings.ready : strings.notReady}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>
        </>
      ) : (
        <>
          <Card style={styles.commandSurface} tone="scene">
            <Text style={styles.sectionTitle}>{strings.createRoom}</Text>
            <Text style={styles.copy}>{strings.subtitle}</Text>
            <View style={styles.commandActionRail}>
              <PrimaryButton
                label={isBusy ? strings.loading : strings.createRoom}
                onPress={onCreateRoom}
              />
            </View>
          </Card>

          <Card style={styles.rosterSurface} tone="panel">
            <Text style={styles.sectionTitle}>{strings.joinRoomTitle}</Text>
            <TextInput
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
              onChangeText={onChangeJoinCode}
              placeholder={strings.joinRoomPlaceholder}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              value={joinCode}
            />
            <View style={styles.commandActionRail}>
              <PrimaryButton
                label={isBusy ? strings.loading : strings.joinRoomAction}
                onPress={onJoinRoom}
              />
            </View>
          </Card>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  commandSurface: {
    borderWidth: 2,
  },
  rosterSurface: {
    borderWidth: 2,
  },
  commandMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  commandActionRail: {
    gap: spacing.sm,
  },
  eyebrow: {
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
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 24,
  },
  helper: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 20,
  },
  worldCard: {
    gap: spacing.sm,
    padding: spacing.lg,
  },
  heroHeader: {
    gap: spacing.sm,
    maxWidth: 720,
  },
  heroControlZone: {
    backgroundColor: colors.surfaceInset,
    borderColor: colors.borderStrong,
    borderRadius: radii.xl,
    borderWidth: 2,
    gap: spacing.sm,
    padding: spacing.lg,
    width: '100%',
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
  readySummary: {
    color: colors.highlight,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  roomCode: {
    color: colors.highlight,
    fontSize: typography.display,
    fontWeight: '900',
    letterSpacing: 4,
  },
  participantList: {
    gap: spacing.sm,
  },
  participantRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  participantBadge: {
    alignItems: 'center',
    borderRadius: 18,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  participantInitial: {
    color: colors.canvas,
    fontSize: typography.caption,
    fontWeight: '900',
  },
  participantMeta: {
    flex: 1,
    minWidth: 0,
  },
  participantName: {
    color: colors.textPrimary,
    flexShrink: 1,
    fontSize: typography.body,
    fontWeight: '700',
  },
  participantState: {
    color: colors.textSecondary,
    flexShrink: 1,
    fontSize: typography.caption,
  },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: 18,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: typography.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
});
