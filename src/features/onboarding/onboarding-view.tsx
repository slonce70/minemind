import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card } from '../../components/ui/card';
import { PrimaryButton } from '../../components/ui/button';
import { Screen } from '../../components/ui/screen';
import { avatarPresets, avatarLookup } from '../profile/avatar-presets';
import type { AppLocale } from '../../lib/locale';
import { colors, radii, spacing, typography } from '../../theme/tokens';

type LocaleOption = {
  label: string;
  value: AppLocale;
};

type OnboardingViewProps = {
  errorMessage?: string | null;
  helperText: string;
  isSaving: boolean;
  localeOptions: LocaleOption[];
  nickname: string;
  onChangeNickname: (value: string) => void;
  onSelectAvatar: (avatarId: string) => void;
  onSelectLocale: (locale: AppLocale) => void;
  onSubmit: () => void;
  privacyNote: string;
  selectedAvatarId: string;
  selectedLocale: AppLocale;
  strings: {
    avatarLabel: string;
    ctaLabel: string;
    eyebrow: string;
    languageLabel: string;
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
  errorMessage,
  helperText,
  isSaving,
  localeOptions,
  nickname,
  onChangeNickname,
  onSelectAvatar,
  onSelectLocale,
  onSubmit,
  privacyNote,
  selectedAvatarId,
  selectedLocale,
  strings,
}: OnboardingViewProps) {
  const selectedAvatar = avatarLookup[selectedAvatarId];
  const selectedLocaleLabel =
    localeOptions.find((option) => option.value === selectedLocale)?.label ?? selectedLocale;
  const previewName = nickname.trim() || strings.previewFallbackName;

  return (
    <Screen scrollable>
      <View style={styles.heroBlock}>
        <Text style={styles.eyebrow}>{strings.eyebrow}</Text>
        <Text style={styles.title}>{strings.title}</Text>
        <Text style={styles.subtitle}>{strings.subtitle}</Text>
      </View>

      <Card highlight>
        <Text style={styles.previewEyebrow}>{strings.previewEyebrow}</Text>
        <View style={styles.previewRow}>
          <View style={[styles.previewBadge, { backgroundColor: selectedAvatar.color }]}>
            <Text style={styles.previewInitial}>{selectedAvatar.label[0]}</Text>
          </View>
          <View style={styles.previewText}>
            <Text style={styles.previewTitle}>{strings.previewTitle}</Text>
            <Text style={styles.previewName}>{previewName}</Text>
            <Text style={styles.previewMeta}>
              {selectedAvatar.label} • {strings.previewLanguageLabel}: {selectedLocaleLabel}
            </Text>
          </View>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>{strings.nicknameLabel}</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={16}
          onChangeText={onChangeNickname}
          placeholder={strings.nicknamePlaceholder}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={nickname}
        />
        <Text style={styles.helperText}>{helperText}</Text>
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>{strings.languageLabel}</Text>
        <View style={styles.choiceGrid}>
          {localeOptions.map((option) => {
            const isActive = selectedLocale === option.value;

            return (
              <Pressable
                key={option.value}
                onPress={() => onSelectLocale(option.value)}
                style={[styles.choiceChip, isActive && styles.choiceChipActive]}
              >
                <Text style={[styles.choiceChipText, isActive && styles.choiceChipTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>{strings.avatarLabel}</Text>
        <View style={styles.avatarGrid}>
          {avatarPresets.map((avatar) => {
            const isActive = selectedAvatarId === avatar.id;

            return (
              <Pressable
                key={avatar.id}
                onPress={() => onSelectAvatar(avatar.id)}
                style={[styles.avatarCard, isActive && styles.avatarCardActive]}
              >
                <View style={[styles.avatarBadge, { backgroundColor: avatar.color }]}>
                  <Text style={styles.avatarInitial}>{avatar.label[0]}</Text>
                </View>
                <Text style={styles.avatarLabel}>{avatar.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <PrimaryButton
        label={isSaving ? '...' : strings.ctaLabel}
        onPress={onSubmit}
      />
      <Text style={styles.privacyNote}>{privacyNote}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroBlock: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: typography.overline,
    fontWeight: '800',
    letterSpacing: 1.6,
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
  previewEyebrow: {
    color: colors.highlight,
    fontSize: typography.overline,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  previewRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  previewBadge: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  previewInitial: {
    color: colors.canvas,
    fontSize: typography.display,
    fontWeight: '900',
  },
  previewText: {
    flex: 1,
    gap: spacing.xs,
  },
  previewTitle: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  previewName: {
    color: colors.textPrimary,
    fontSize: typography.h2,
    fontWeight: '800',
  },
  previewMeta: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    lineHeight: 20,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.h3,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: radii.lg,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: typography.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  helperText: {
    color: colors.textMuted,
    fontSize: typography.caption,
    marginTop: spacing.sm,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.caption,
    marginTop: spacing.sm,
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  choiceChip: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: radii.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  choiceChipActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  choiceChipText: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  choiceChipTextActive: {
    color: colors.textPrimary,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  avatarCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    minWidth: '46%',
    padding: spacing.md,
  },
  avatarCardActive: {
    borderColor: colors.accent,
    transform: [{ translateY: -2 }],
  },
  avatarBadge: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 56,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 56,
  },
  avatarInitial: {
    color: colors.canvas,
    fontSize: typography.h2,
    fontWeight: '800',
  },
  avatarLabel: {
    color: colors.textPrimary,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  privacyNote: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 20,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
