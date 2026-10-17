import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton, SecondaryButton } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { StatPill } from '../../components/ui/stat-pill';
import { avatarLookup } from '../profile/avatar-presets';
import { PlayerAvatar } from '../profile/player-avatar';
import type { ContentDifficulty } from '../content/types';
import { DifficultySelector } from '../home/difficulty-selector';
import { ClassroomInviteQr } from '../classroom/classroom-invite-qr';
import { SettingSwitch } from '../profile/profile-controls';
import { BadgeChip } from '../ui/badge-chip';
import { WorldBackground } from '../ui/world-background';
import type { ActiveRoom } from './types';
import { colors, fonts, radii, spacing, typography } from '../../theme/tokens';
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
  /** Only provided in development builds. */
  onAddDemoPlayers?: () => void;
  onChangeJoinCode: (value: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onLeaveRoom: () => void;
  onSelectDifficulty: (difficulty: ContentDifficulty) => void;
  onStartBattle: () => void;
  onToggleReady: () => void;
  /** Opens the camera to read a room QR code; only where a camera can be used. */
  onScanCode?: () => void;
  /** Link that joins the active room; shown as a QR code to the host while players gather. */
  joinUrl?: string;
  /** Host only, live rooms: this device becomes the big screen and does not play. */
  onToggleScreenMode?: (screenMode: boolean) => void;
  /** Players connected to the live room channel; undefined while realtime is unavailable. */
  onlinePlayerIds?: string[];
  roomActionLabel: string;
  strings: {
    activeRoom: string;
    activeRoomCopy: string;
    addDemoPlayers: string;
    createRoom: string;
    createRoomCopy: string;
    difficultyHint: string;
    difficultyLabel: string;
    joinRoomAction: string;
    joinRoomPlaceholder: string;
    joinRoomTitle: string;
    leaveRoom: string;
    lobbyTitle: string;
    loading: string;
    notReady: string;
    offline: string;
    ready: string;
    readySummary: string;
    joinQrA11y: string;
    joinQrHint: string;
    scanQr: string;
    screenMode: string;
    screenModeCopy: string;
    startBattle: string;
    subtitle: string;
    timerA11y: string;
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
  onToggleScreenMode,
  onScanCode,
  joinUrl,
  onlinePlayerIds,
  roomActionLabel,
  strings,
}: RoomLobbyViewProps) {
  const lobbyState = activeRoom ? deriveRoomLobbyState(activeRoom) : null;
  const isStartDisabled = isBusy || (!canResumeRound && !lobbyState?.canStart);
  const displayedDifficulty = activeRoom?.status === 'active' ? activeRoom.settings.difficulty : selectedDifficulty;
  const canToggleScreenMode =
    Boolean(onToggleScreenMode) &&
    activeRoom?.status === 'lobby' &&
    activeRoom.participants.some((participant) => participant.isLocalPlayer && participant.isHost);

  return (
    <View style={styles.container}>
      <Card highlight tone="scene">
        <WorldBackground style={styles.worldCard} variant="cave">
          <View style={styles.heroHeader}>
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
              timerLabel={(seconds) => strings.timerA11y.replace('{{seconds}}', String(seconds))}
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
            {joinUrl && activeRoom.status === 'lobby' && activeRoom.participants.some((entry) => entry.isLocalPlayer && entry.isHost) ? (
              <View style={styles.joinQr}>
                <ClassroomInviteQr accessibilityLabel={strings.joinQrA11y} value={joinUrl} />
                <Text style={styles.copy}>{strings.joinQrHint}</Text>
              </View>
            ) : null}
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
            {canToggleScreenMode && onToggleScreenMode ? (
              <SettingSwitch
                description={strings.screenModeCopy}
                icon="tv"
                label={strings.screenMode}
                onChange={onToggleScreenMode}
                value={activeRoom.settings.screenMode}
              />
            ) : null}
            <View style={styles.commandActionRail}>
              {isOfflineMode && onAddDemoPlayers ? <PrimaryButton label={strings.addDemoPlayers} onPress={onAddDemoPlayers} /> : null}
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
                const isOffline =
                  onlinePlayerIds !== undefined && !participant.isLocalPlayer && !onlinePlayerIds.includes(participant.id);

                return (
                  <View key={participant.id} style={styles.participantRow}>
                    <PlayerAvatar avatarId={avatar?.id} size={40} />
                    <View style={styles.participantMeta}>
                      <Text style={styles.participantName}>{participant.name}</Text>
                      <Text style={styles.participantState}>
                        {isOffline ? strings.offline : participant.ready ? strings.ready : strings.notReady}
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
            <Text style={styles.copy}>{strings.createRoomCopy}</Text>
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
              accessibilityLabel={strings.joinRoomTitle}
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
              {onScanCode ? <SecondaryButton label={strings.scanQr} onPress={onScanCode} /> : null}
            </View>
          </Card>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  joinQr: {
    alignItems: 'center',
    gap: spacing.xs,
    maxWidth: 240,
    alignSelf: 'center',
    width: '100%',
  },
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
  subtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: typography.body,
    lineHeight: 24,
  },
  helper: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
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
    fontFamily: fonts.extraBold,
    fontSize: typography.h3,
  },
  copy: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: typography.body,
    lineHeight: 22,
  },
  readySummary: {
    color: colors.highlight,
    fontFamily: fonts.bold,
    fontSize: typography.caption,
  },
  errorText: {
    color: colors.danger,
    fontFamily: fonts.bold,
    fontSize: typography.caption,
  },
  roomCode: {
    color: colors.highlight,
    fontFamily: fonts.display,
    fontSize: typography.display,
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
  participantMeta: {
    flex: 1,
    minWidth: 0,
  },
  participantName: {
    color: colors.textPrimary,
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: typography.body,
  },
  participantState: {
    color: colors.textSecondary,
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: typography.caption,
  },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: 18,
    borderWidth: 1,
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    fontSize: typography.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
});
