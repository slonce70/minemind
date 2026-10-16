import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Screen } from '../../components/ui/screen';
import { colors, fonts, spacing, typography } from '../../theme/tokens';
import { avatarLookup } from '../profile/avatar-presets';
import { PlayerAvatar } from '../profile/player-avatar';
import { AvatarPicker, NicknameField } from '../profile/profile-controls';
import { Mascot } from '../ui/mascot';

type OnboardingViewProps = {
  avatarLabels: Record<string, string>;
  errorMessage?: string | null;
  helperText: string;
  isSaving: boolean;
  nickname: string;
  onChangeNickname: (value: string) => void;
  onRollNickname: () => void;
  onSelectAvatar: (avatarId: string) => void;
  onSubmit: () => void;
  privacyNote: string;
  selectedAvatarId: string;
  selectedLocaleLabel: string;
  strings: {
    avatarLabel: string;
    ctaLabel: string;
    diceLabel: string;
    disclaimer: string;
    eyebrow: string;
    nicknameLabel: string;
    nicknamePlaceholder: string;
    previewEyebrow: string;
    previewFallbackName: string;
    previewLanguageLabel: string;
    previewTitle: string;
    subtitle: string;
    title: string;
  };
};

export function OnboardingView({
  avatarLabels,
  errorMessage,
  helperText,
  isSaving,
  nickname,
  onChangeNickname,
  onRollNickname,
  onSelectAvatar,
  onSubmit,
  privacyNote,
  selectedAvatarId,
  selectedLocaleLabel,
  strings,
}: OnboardingViewProps) {
  const selectedAvatarLabel = avatarLabels[selectedAvatarId] ?? avatarLookup[selectedAvatarId]?.label ?? '';
  const previewName = nickname.trim() || strings.previewFallbackName;

  return (
    <Screen scrollable>
      <View style={styles.heroBlock}>
        <Mascot size={72} />
        <View style={styles.heroText}>
          <Text style={styles.eyebrow}>{strings.eyebrow}</Text>
          <Text accessibilityRole="header" style={styles.title}>
            {strings.title}
          </Text>
          <Text style={styles.subtitle}>{strings.subtitle}</Text>
        </View>
      </View>

      <Card style={styles.profilePlate}>
        <Text style={styles.previewEyebrow}>{strings.previewEyebrow}</Text>
        <View style={styles.previewRow}>
          <PlayerAvatar avatarId={selectedAvatarId} size={72} />
          <View style={styles.previewText}>
            <Text style={styles.previewTitle}>{strings.previewTitle}</Text>
            <Text numberOfLines={1} style={styles.previewName}>
              {previewName}
            </Text>
            <Text style={styles.previewMeta}>
              {selectedAvatarLabel} • {strings.previewLanguageLabel}: {selectedLocaleLabel}
            </Text>
          </View>
        </View>
      </Card>

      <Card style={styles.stepCard}>
        <NicknameField
          diceLabel={strings.diceLabel}
          error={errorMessage}
          helper={helperText}
          label={strings.nicknameLabel}
          onChange={onChangeNickname}
          onRoll={onRollNickname}
          placeholder={strings.nicknamePlaceholder}
          value={nickname}
        />
      </Card>

      <Card style={styles.stepCard}>
        <Text style={styles.sectionTitle}>{strings.avatarLabel}</Text>
        <AvatarPicker labels={avatarLabels} onSelect={onSelectAvatar} selectedId={selectedAvatarId} />
      </Card>

      <PrimaryButton disabled={isSaving} label={strings.ctaLabel} onPress={onSubmit} />
      <Text style={styles.privacyNote}>{privacyNote}</Text>
      <Text style={styles.privacyNote}>{strings.disclaimer}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.accent,
    fontFamily: fonts.display,
    fontSize: typography.overline,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroBlock: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  heroText: {
    flex: 1,
    gap: spacing.xxs,
  },
  previewEyebrow: {
    color: colors.highlight,
    fontFamily: fonts.display,
    fontSize: typography.overline,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  previewMeta: {
    color: colors.textSecondary,
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: typography.caption,
    lineHeight: 20,
  },
  previewName: {
    color: colors.textPrimary,
    flexShrink: 1,
    fontFamily: fonts.extraBold,
    fontSize: typography.h2,
  },
  previewRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  previewText: {
    flex: 1,
    gap: spacing.xxs,
    minWidth: 0,
  },
  previewTitle: {
    color: colors.textMuted,
    fontFamily: fonts.bold,
    fontSize: typography.caption,
  },
  privacyNote: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: typography.caption,
    lineHeight: 20,
    textAlign: 'center',
  },
  profilePlate: {
    backgroundColor: colors.surfaceAccent,
    borderColor: colors.borderFocus,
    borderWidth: 2,
    marginBottom: 0,
    minWidth: 0,
    padding: spacing.lg,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: typography.body,
  },
  stepCard: {
    gap: spacing.sm,
    marginBottom: 0,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: typography.body,
    lineHeight: 22,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: typography.h1,
  },
});
