import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton, SecondaryButton } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { avatarLookup } from '../profile/avatar-presets';
import type { ContentDifficulty } from '../content/types';
import { DifficultySelector } from '../home/difficulty-selector';
import { BadgeChip } from '../ui/badge-chip';
import { WorldBackground } from '../ui/world-background';
import type { ActiveRoom } from './types';
import { colors, spacing, typography } from '../../theme/tokens';
import { deriveRoomLobbyState } from './room-lobby-state';

type RoomLobbyViewProps = {
  activeRoom?: ActiveRoom;
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

  return (
    <View style={styles.container}>
      <Card highlight>
        <WorldBackground style={styles.worldCard} variant="cave">
          <Text style={styles.eyebrow}>{strings.heroEyebrow}</Text>
          <Text style={styles.title}>{strings.title}</Text>
          <Text style={styles.subtitle}>{strings.subtitle}</Text>
          <BadgeChip
            icon="block"
            label={difficultyStrings[activeRoom?.settings.difficulty ?? selectedDifficulty]}
            tone="warning"
          />
          <Text style={styles.helper}>{strings.difficultyHint}</Text>
          <DifficultySelector
            label={strings.difficultyLabel}
            onSelect={onSelectDifficulty}
            selectedDifficulty={activeRoom?.settings.difficulty ?? selectedDifficulty}
            strings={difficultyStrings}
          />
        </WorldBackground>
      </Card>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      {activeRoom ? (
        <>
          <Card>
            <Text style={styles.sectionTitle}>{strings.activeRoom}</Text>
            <Text style={styles.roomCode}>{activeRoom.roomCode}</Text>
            <Text style={styles.copy}>{strings.activeRoomCopy}</Text>
            {lobbyState ? (
              <Text style={styles.readySummary}>
                {strings.readySummary
                  .replace('{{readyCount}}', String(lobbyState.readyCount))
                  .replace('{{participantCount}}', String(lobbyState.participantCount))}
              </Text>
            ) : null}
          </Card>

          <Card>
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

          {isOfflineMode ? <PrimaryButton label={strings.addDemoPlayers} onPress={onAddDemoPlayers} /> : null}
          <SecondaryButton
            label={isBusy ? strings.loading : strings.toggleReady}
            onPress={onToggleReady}
          />
          <PrimaryButton
            label={isBusy ? strings.loading : roomActionLabel}
            onPress={onStartBattle}
          />
          <SecondaryButton label={strings.leaveRoom} onPress={onLeaveRoom} />
        </>
      ) : (
        <>
          <PrimaryButton
            label={isBusy ? strings.loading : strings.createRoom}
            onPress={onCreateRoom}
          />
          <Card>
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
            <PrimaryButton
              label={isBusy ? strings.loading : strings.joinRoomAction}
              onPress={onJoinRoom}
            />
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
    alignItems: 'center',
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
  },
  participantName: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '700',
  },
  participantState: {
    color: colors.textSecondary,
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
