import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton, SecondaryButton } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { StatPill } from '../../components/ui/stat-pill';
import { avatarLookup } from '../profile/avatar-presets';
import { PlayerAvatar } from '../profile/player-avatar';
import { PixelIcon } from '../ui/pixel-icon';
import { WorldBackground } from '../ui/world-background';
import { ClassroomInviteQr } from './classroom-invite-qr';
import type { ClassroomSession } from './types';
import { colors, fonts, radii, spacing, typography } from '../../theme/tokens';

type ClassroomLobbyViewProps = {
  classroomSession?: ClassroomSession;
  errorMessage?: string | null;
  hostAddress: string;
  inviteToken?: string | null;
  isBusy: boolean;
  joinInviteInput: string;
  joinCode: string;
  lobbyState?: {
    canStart: boolean;
    participantCount: number;
    readyCount: number;
  } | null;
  onChangeHostAddress: (value: string) => void;
  onChangeJoinInviteInput: (value: string) => void;
  onChangeJoinCode: (value: string) => void;
  onClearSession: () => void;
  onHostSession: () => void;
  onJoinSession: () => void;
  onShareInvite: () => void;
  onStartMatch: () => void;
  onToggleReady: () => void;
  strings: {
    clearSession: string;
    hostAddressLabel: string;
    hostAddressPlaceholder: string;
    hostSession: string;
    hostSessionHint: string;
    inviteQrAccessibilityLabel: string;
    inviteQrHint: string;
    inviteQrTitle: string;
    inviteTokenLabel: string;
    inviteTokenPlaceholder: string;
    joinSession: string;
    joinSessionHint: string;
    joinSessionPlaceholder: string;
    loading: string;
    manualHostToggle: string;
    manualJoinToggle: string;
    notReady: string;
    participantCount: string;
    participantCountLabel: string;
    ready: string;
    readySummary: string;
    roleLabel: string;
    roomCode: string;
    scanHint: string;
    scanTitle: string;
    shareInvite: string;
    sessionStatusFinished: string;
    sessionStatusLobby: string;
    sessionStatusPlaying: string;
    startMatch: string;
    subtitle: string;
    toggleReady: string;
  };
};

export function ClassroomLobbyView({
  classroomSession,
  errorMessage,
  hostAddress,
  inviteToken,
  isBusy,
  joinInviteInput,
  joinCode,
  lobbyState,
  onChangeHostAddress,
  onChangeJoinInviteInput,
  onChangeJoinCode,
  onClearSession,
  onHostSession,
  onJoinSession,
  onShareInvite,
  onStartMatch,
  onToggleReady,
  strings,
}: ClassroomLobbyViewProps) {
  const sessionStatusLabel = classroomSession
    ? {
        active: strings.sessionStatusPlaying,
        finished: strings.sessionStatusFinished,
        lobby: strings.sessionStatusLobby,
      }[classroomSession.status]
    : undefined;
  const isStartDisabled = isBusy || !lobbyState?.canStart;
  // The host address is detected and invites travel by QR code, so typing either is a fallback.
  const [showManualHost, setShowManualHost] = useState(Boolean(hostAddress));
  const [showManualJoin, setShowManualJoin] = useState(Boolean(joinInviteInput));

  return (
    <View style={styles.container}>
      <Card highlight tone="scene">
        <WorldBackground style={styles.worldCard} variant="classroom-hub">
          <Text style={styles.subtitle}>{strings.subtitle}</Text>
        </WorldBackground>
      </Card>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      {classroomSession ? (
        <>
          <Card style={styles.classroomHub} tone="scene">
            <Text style={styles.sectionTitle}>{strings.roomCode}</Text>
            <Text style={styles.roomCode}>{classroomSession.roomCode}</Text>
            <Text style={styles.copy}>{strings.participantCount}</Text>
            {sessionStatusLabel ? (
              <View style={styles.sessionBanner}>
                <Text style={styles.sessionStatus}>{sessionStatusLabel}</Text>
                <Text style={styles.copy}>
                  {strings.roleLabel}: {classroomSession.role === 'host' ? strings.hostSession : strings.joinSession}
                </Text>
              </View>
            ) : null}
            <View style={styles.commandMetaGrid}>
              <StatPill
                label={strings.participantCountLabel}
                value={String(classroomSession.participants.length)}
              />
              {lobbyState ? (
                <StatPill
                  label={strings.ready}
                  value={`${lobbyState.readyCount}/${lobbyState.participantCount}`}
                />
              ) : null}
              <StatPill
                label={strings.roleLabel}
                value={classroomSession.role === 'host' ? strings.hostSession : strings.joinSession}
              />
            </View>
            {lobbyState ? (
              <Text style={styles.readySummary}>
                {strings.readySummary
                  .replace('{{readyCount}}', String(lobbyState.readyCount))
                  .replace('{{participantCount}}', String(lobbyState.participantCount))}
              </Text>
            ) : null}
            {classroomSession.hostAddress ? (
              <Text style={styles.copy}>
                {strings.hostAddressLabel}: {classroomSession.hostAddress}
              </Text>
            ) : null}
            {inviteToken ? (
              <>
                <View style={styles.qrSurface}>
                  <Text style={styles.sectionTitle}>{strings.inviteQrTitle}</Text>
                  <Text style={styles.copy}>{strings.inviteQrHint}</Text>
                  <ClassroomInviteQr
                    accessibilityLabel={strings.inviteQrAccessibilityLabel}
                    value={inviteToken}
                  />
                </View>
                <Text style={styles.inputLabel}>{strings.inviteTokenLabel}</Text>
                <Text selectable style={styles.inviteToken}>
                  {inviteToken}
                </Text>
              </>
            ) : null}
            <View style={styles.commandActionRail}>
              {inviteToken ? <SecondaryButton label={strings.shareInvite} onPress={onShareInvite} /> : null}
              {classroomSession.role === 'host' ? (
                <PrimaryButton disabled={isStartDisabled} label={strings.startMatch} onPress={onStartMatch} />
              ) : (
                <SecondaryButton label={strings.toggleReady} onPress={onToggleReady} />
              )}
            </View>
          </Card>

          <Card style={styles.rosterSurface} tone="panel">
            <View style={styles.participantList}>
              {classroomSession.participants.map((participant) => {
                const avatar = avatarLookup[participant.avatarId];

                return (
                  <View key={participant.id} style={styles.participantRow}>
                    <PlayerAvatar avatarId={avatar?.id} size={40} />
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
            <SecondaryButton label={strings.clearSession} onPress={onClearSession} />
          </Card>
        </>
      ) : (
        <>
          <Card style={styles.classroomHub} tone="panel">
            <Text style={styles.sectionTitle}>{strings.hostSession}</Text>
            <Text style={styles.copy}>{strings.hostSessionHint}</Text>
            {showManualHost ? (
              <>
                <Text style={styles.inputLabel}>{strings.hostAddressLabel}</Text>
                <TextInput
                  accessibilityLabel={strings.hostAddressLabel}
                  onChangeText={onChangeHostAddress}
                  placeholder={strings.hostAddressPlaceholder}
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  value={hostAddress}
                />
              </>
            ) : (
              <Pressable accessibilityRole="button" onPress={() => setShowManualHost(true)} style={styles.disclosure}>
                <Text style={styles.disclosureText}>{strings.manualHostToggle}</Text>
              </Pressable>
            )}
            <View style={styles.commandActionRail}>
              <PrimaryButton
                label={isBusy ? strings.loading : strings.hostSession}
                onPress={onHostSession}
              />
            </View>
          </Card>

          <Card style={styles.rosterSurface} tone="panel">
            <Text style={styles.sectionTitle}>{strings.joinSession}</Text>
            <View style={styles.scanRow}>
              <PixelIcon color={colors.highlight} name="qr" size={34} />
              <View style={styles.scanText}>
                <Text style={styles.scanTitle}>{strings.scanTitle}</Text>
                <Text style={styles.copy}>{strings.scanHint}</Text>
              </View>
            </View>
            {showManualJoin ? (
              <>
                <Text style={styles.copy}>{strings.joinSessionHint}</Text>
                <Text style={styles.inputLabel}>{strings.inviteTokenLabel}</Text>
                <TextInput
                  accessibilityLabel={strings.inviteTokenLabel}
                  onChangeText={onChangeJoinInviteInput}
                  placeholder={strings.inviteTokenPlaceholder}
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  value={joinInviteInput}
                />
                <TextInput
                  accessibilityLabel={strings.joinSessionPlaceholder}
                  autoCapitalize="characters"
                  onChangeText={onChangeJoinCode}
                  placeholder={strings.joinSessionPlaceholder}
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  value={joinCode}
                />
                <View style={styles.commandActionRail}>
                  <PrimaryButton
                    label={isBusy ? strings.loading : strings.joinSession}
                    onPress={onJoinSession}
                  />
                </View>
              </>
            ) : (
              <Pressable accessibilityRole="button" onPress={() => setShowManualJoin(true)} style={styles.disclosure}>
                <Text style={styles.disclosureText}>{strings.manualJoinToggle}</Text>
              </Pressable>
            )}
          </Card>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  disclosure: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
  },
  disclosureText: {
    color: colors.highlight,
    fontFamily: fonts.bold,
    fontSize: typography.caption,
    textDecorationLine: 'underline',
  },
  scanRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceInset,
    borderColor: colors.borderStrong,
    borderRadius: radii.xl,
    borderWidth: 2,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  scanText: {
    flex: 1,
    gap: spacing.xxs,
  },
  scanTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: typography.body,
  },
  container: {
    gap: spacing.sm,
  },
  classroomHub: {
    borderWidth: 2,
  },
  rosterSurface: {
    borderWidth: 2,
  },
  sessionBanner: {
    backgroundColor: colors.surfaceInset,
    borderColor: colors.borderStrong,
    borderRadius: radii.xl,
    borderWidth: 2,
    gap: spacing.xs,
    padding: spacing.md,
  },
  commandMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  commandActionRail: {
    gap: spacing.sm,
  },
  qrSurface: {
    backgroundColor: colors.surfaceInset,
    borderColor: colors.borderStrong,
    borderRadius: radii.xl,
    borderWidth: 2,
    gap: spacing.sm,
    padding: spacing.md,
  },
  worldCard: {
    gap: spacing.sm,
    padding: spacing.lg,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: typography.body,
    lineHeight: 22,
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
  roomCode: {
    color: colors.highlight,
    fontFamily: fonts.display,
    fontSize: typography.display,
    letterSpacing: 3,
  },
  inputLabel: {
    color: colors.textMuted,
    fontFamily: fonts.bold,
    fontSize: typography.caption,
  },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: radii.xl,
    borderWidth: 1,
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    fontSize: typography.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  inviteToken: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: radii.xl,
    borderWidth: 1,
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    fontSize: typography.caption,
    lineHeight: 20,
    padding: spacing.md,
  },
  sessionStatus: {
    color: colors.highlight,
    fontFamily: fonts.display,
    fontSize: typography.caption,
    textTransform: 'uppercase',
  },
  participantList: {
    gap: spacing.sm,
  },
  participantRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  participantMeta: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  participantName: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: typography.body,
  },
  participantState: {
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
    fontSize: typography.caption,
  },
  errorText: {
    color: colors.danger,
    fontFamily: fonts.bold,
    fontSize: typography.caption,
  },
});
