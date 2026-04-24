import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton, SecondaryButton } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { StatPill } from '../../components/ui/stat-pill';
import { avatarLookup } from '../profile/avatar-presets';
import { WorldBackground } from '../ui/world-background';
import { ClassroomInviteQr } from './classroom-invite-qr';
import type { ClassroomSession } from './types';
import { colors, radii, spacing, typography } from '../../theme/tokens';

type ClassroomLobbyViewProps = {
  classroomSession?: ClassroomSession;
  errorMessage?: string | null;
  hostAddress: string;
  inviteToken?: string | null;
  isBusy: boolean;
  joinCode: string;
  lobbyState?: {
    canStart: boolean;
    participantCount: number;
    readyCount: number;
  } | null;
  onChangeHostAddress: (value: string) => void;
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
    notReady: string;
    participantCount: string;
    participantCountLabel: string;
    ready: string;
    readySummary: string;
    roleLabel: string;
    roomCode: string;
    shareInvite: string;
    sessionStatusFinished: string;
    sessionStatusLobby: string;
    sessionStatusPlaying: string;
    startMatch: string;
    subtitle: string;
    title: string;
    toggleReady: string;
  };
};

export function ClassroomLobbyView({
  classroomSession,
  errorMessage,
  hostAddress,
  inviteToken,
  isBusy,
  joinCode,
  lobbyState,
  onChangeHostAddress,
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

  return (
    <View style={styles.container}>
      <Card highlight tone="scene">
        <WorldBackground style={styles.worldCard} variant="classroom-hub">
          <Text style={styles.title}>{strings.title}</Text>
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
            <SecondaryButton label={strings.clearSession} onPress={onClearSession} />
          </Card>
        </>
      ) : (
        <>
          <Card style={styles.classroomHub} tone="panel">
            <Text style={styles.sectionTitle}>{strings.hostSession}</Text>
            <Text style={styles.copy}>{strings.hostSessionHint}</Text>
            <Text style={styles.inputLabel}>{strings.hostAddressLabel}</Text>
            <TextInput
              onChangeText={onChangeHostAddress}
              placeholder={strings.hostAddressPlaceholder}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              value={hostAddress}
            />
            <View style={styles.commandActionRail}>
              <PrimaryButton
                label={isBusy ? strings.loading : strings.hostSession}
                onPress={onHostSession}
              />
            </View>
          </Card>

          <Card style={styles.rosterSurface} tone="panel">
            <Text style={styles.sectionTitle}>{strings.joinSession}</Text>
            <Text style={styles.copy}>{strings.joinSessionHint}</Text>
            <Text style={styles.inputLabel}>{strings.inviteTokenLabel}</Text>
            <TextInput
              onChangeText={onChangeHostAddress}
              placeholder={strings.inviteTokenPlaceholder}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              value={hostAddress}
            />
            <TextInput
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
  title: {
    color: colors.textPrimary,
    fontSize: typography.display,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 22,
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
  roomCode: {
    color: colors.highlight,
    fontSize: typography.display,
    fontWeight: '900',
    letterSpacing: 3,
  },
  inputLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: radii.xl,
    borderWidth: 1,
    color: colors.textPrimary,
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
    fontSize: typography.caption,
    lineHeight: 20,
    padding: spacing.md,
  },
  sessionStatus: {
    color: colors.highlight,
    fontSize: typography.caption,
    fontWeight: '800',
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
  participantBadge: {
    alignItems: 'center',
    borderRadius: radii.xl,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  participantInitial: {
    color: colors.canvas,
    fontSize: typography.body,
    fontWeight: '900',
  },
  participantMeta: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  participantName: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '700',
  },
  participantState: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.caption,
    fontWeight: '700',
  },
});
