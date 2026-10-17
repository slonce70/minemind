import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card } from '../src/components/ui/card';
import { LoadingScreen } from '../src/components/ui/loading-screen';
import { Screen } from '../src/components/ui/screen';
import { ScreenHeader } from '../src/components/ui/screen-header';
import { ParentsCard } from '../src/features/account/parents-card';
import { syncMusic } from '../src/features/feel/feedback';
import { ChoiceRow, SettingSwitch } from '../src/features/profile/profile-controls';
import { ensureGuestSession } from '../src/features/profile/profile-service';
import { appLocales, type AppLocale } from '../src/lib/locale';
import { useAppStore } from '../src/state/app-store';
import { colors, fonts, typography } from '../src/theme/tokens';

export default function SettingsRoute() {
  const { t } = useTranslation();
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const locale = useAppStore((state) => state.locale);
  const profile = useAppStore((state) => state.profile);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);

  if (!hasHydrated) {
    return <LoadingScreen />;
  }

  const changeLocale = (next: AppLocale) => {
    if (!profile) {
      return;
    }

    const updated = { ...profile, locale: next };

    completeOnboarding(updated);
    // The server keeps the language for translated room rounds; offline play does not need it.
    ensureGuestSession(updated).catch(() => undefined);
  };

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader backLabel={t('common.back')} title={t('settings.title')} />

      <Card>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {t('settings.soundTitle')}
        </Text>
        <SettingSwitch
          description={t('settings.soundHint')}
          icon={settings.sound ? 'sound-on' : 'sound-off'}
          label={t('settings.sound')}
          onChange={(sound) => updateSettings({ sound })}
          value={settings.sound}
        />
        <SettingSwitch
          description={t('settings.musicHint')}
          icon="music"
          label={t('settings.music')}
          onChange={(music) => {
            updateSettings({ music });
            syncMusic(music);
          }}
          value={settings.music}
        />
        <SettingSwitch
          description={t('settings.hapticsHint')}
          icon="vibrate"
          label={t('settings.haptics')}
          onChange={(haptics) => updateSettings({ haptics })}
          value={settings.haptics}
        />
      </Card>

      {profile ? (
        <Card>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            {t('settings.languageTitle')}
          </Text>
          <ChoiceRow
            label={t('settings.languageTitle')}
            onSelect={changeLocale}
            options={appLocales.map((value) => ({ label: t(`languageNames.${value}`), value }))}
            selected={locale}
          />
        </Card>
      ) : null}

      <Card>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {t('settings.accessibilityTitle')}
        </Text>
        <Text style={styles.body}>{t('settings.accessibilityNote')}</Text>
      </Card>

      {profile ? <ParentsCard /> : null}

      <Card tone="utility">
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {t('settings.aboutTitle')}
        </Text>
        <Text style={styles.body}>{t('common.disclaimer')}</Text>
        <Text style={styles.note}>{t('settings.credits')}</Text>
        <Text style={styles.note}>{t('settings.version', { version: Constants.expoConfig?.version ?? '—' })}</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: typography.body,
    lineHeight: 22,
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
});
