import { Redirect, Stack, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PrimaryButton, SecondaryButton } from '../src/components/ui/button';
import { Card } from '../src/components/ui/card';
import { LoadingScreen } from '../src/components/ui/loading-screen';
import { Screen } from '../src/components/ui/screen';
import { ScreenHeader } from '../src/components/ui/screen-header';
import { StatPill } from '../src/components/ui/stat-pill';
import { CloudSaveCard } from '../src/features/progress/cloud-save-card';
import { avatarPresets } from '../src/features/profile/avatar-presets';
import { validateNickname } from '../src/features/profile/nickname';
import { generateNickname } from '../src/features/profile/nickname-generator';
import { PlayerAvatar } from '../src/features/profile/player-avatar';
import { AvatarPicker, NicknameField } from '../src/features/profile/profile-controls';
import { ensureGuestSession } from '../src/features/profile/profile-service';
import { summarizeMatches } from '../src/features/profile/profile-stats';
import { supabase } from '../src/lib/supabase';
import { useAppStore } from '../src/state/app-store';
import { colors, fonts, spacing, typography } from '../src/theme/tokens';

export default function ProfileRoute() {
  const { t } = useTranslation();
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const profile = useAppStore((state) => state.profile);
  const recentMatches = useAppStore((state) => state.recentMatches);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const resetProfile = useAppStore((state) => state.resetProfile);
  const [nickname, setNickname] = useState(profile?.nickname ?? '');
  const [avatarId, setAvatarId] = useState(profile?.avatarId ?? avatarPresets[0].id);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const stats = useMemo(() => summarizeMatches(recentMatches), [recentMatches]);
  const avatarLabels = useMemo(
    () => Object.fromEntries(avatarPresets.map((preset) => [preset.id, t(`avatars.${preset.id}`)])),
    [t]
  );

  if (!hasHydrated) {
    return <LoadingScreen />;
  }

  if (!profile) {
    return <Redirect href="/onboarding" />;
  }

  const isDirty = nickname.trim() !== profile.nickname || avatarId !== profile.avatarId;

  const handleSave = async () => {
    const validation = validateNickname(nickname);

    if (!validation.valid) {
      setMessage({ error: true, text: t(validation.reasonKey) });
      return;
    }

    const next = { ...profile, avatarId, nickname: validation.sanitizedValue };

    setIsSaving(true);

    try {
      await ensureGuestSession(next);
      completeOnboarding(next);
      setNickname(next.nickname);
      setMessage({ error: false, text: t('profile.saved') });
    } catch {
      setMessage({ error: true, text: t('onboarding.serverError') });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader backLabel={t('common.back')} title={t('profile.title')} />

      <Card highlight style={styles.identity}>
        <PlayerAvatar accessibilityLabel={avatarLabels[profile.avatarId]} avatarId={profile.avatarId} size={88} />
        <View style={styles.identityText}>
          <Text numberOfLines={1} style={styles.name}>
            {profile.nickname}
          </Text>
          <Text style={styles.meta}>
            {avatarLabels[profile.avatarId]} • {t(`languageNames.${profile.locale}`)}
          </Text>
        </View>
      </Card>

      <Card>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {t('profile.statsTitle')}
        </Text>
        {stats.matches > 0 ? (
          <>
            <View style={styles.statGrid}>
              <StatPill label={t('profile.matches')} value={String(stats.matches)} />
              <StatPill label={t('profile.bestScore')} value={String(stats.bestScore)} />
              <StatPill label={t('profile.accuracy')} value={`${stats.accuracy}%`} />
              <StatPill label={t('profile.bestStreak')} value={String(stats.bestStreak)} />
            </View>
            <Text style={styles.note}>{t('profile.statsNote', { count: stats.matches })}</Text>
          </>
        ) : (
          <Text style={styles.note}>{t('profile.noMatches')}</Text>
        )}
      </Card>

      <Card>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {t('profile.editTitle')}
        </Text>
        <NicknameField
          diceLabel={t('onboarding.diceLabel')}
          label={t('onboarding.nicknameLabel')}
          onChange={(value) => {
            setNickname(value);
            setMessage(null);
          }}
          onRoll={() => {
            setNickname(generateNickname(profile.locale, Math.random, nickname));
            setMessage(null);
          }}
          placeholder={t('onboarding.nicknamePlaceholder')}
          value={nickname}
        />
        <Text style={styles.label}>{t('onboarding.avatarLabel')}</Text>
        <AvatarPicker
          labels={avatarLabels}
          onSelect={(value) => {
            setAvatarId(value);
            setMessage(null);
          }}
          selectedId={avatarId}
        />
        {message ? (
          <Text accessibilityLiveRegion="polite" style={[styles.message, message.error && styles.messageError]}>
            {message.text}
          </Text>
        ) : null}
        <PrimaryButton
          disabled={!isDirty || isSaving}
          label={isSaving ? t('common.loading') : t('common.save')}
          onPress={() => void handleSave()}
        />
      </Card>

      <CloudSaveCard />

      <Card tone="utility">
        <Text style={styles.note}>{t('profile.resetHint')}</Text>
        <SecondaryButton
          label={confirmReset ? t('profile.resetConfirm') : t('profile.reset')}
          onPress={() => {
            if (!confirmReset) {
              setConfirmReset(true);
              return;
            }

            // A fresh guest account too, so the old cloud progress does not merge back in.
            void supabase?.auth.signOut();
            resetProfile();
            router.replace('/onboarding');
          }}
          selected={confirmReset}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  identityText: {
    flex: 1,
    gap: spacing.xxs,
    minWidth: 0,
  },
  label: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: typography.body,
  },
  message: {
    color: colors.success,
    fontFamily: fonts.bold,
    fontSize: typography.caption,
  },
  messageError: {
    color: colors.danger,
  },
  meta: {
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
    fontSize: typography.caption,
  },
  name: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: typography.h2,
  },
  note: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: typography.caption,
    lineHeight: 19,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: typography.h3,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
