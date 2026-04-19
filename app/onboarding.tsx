import { Stack, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LoadingScreen } from '../src/components/ui/loading-screen';
import { avatarPresets } from '../src/features/profile/avatar-presets';
import { OnboardingView } from '../src/features/onboarding/onboarding-view';
import { validateNickname } from '../src/features/profile/nickname';
import { ensureGuestSession } from '../src/features/profile/profile-service';
import type { AppLocale } from '../src/lib/locale';
import { appLocales } from '../src/lib/locale';
import { useAppStore } from '../src/state/app-store';
import { Redirect } from 'expo-router';

export default function OnboardingRoute() {
  const { t } = useTranslation();
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const currentLocale = useAppStore((state) => state.locale);
  const profile = useAppStore((state) => state.profile);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const [nickname, setNickname] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(avatarPresets[0].id);
  const [selectedLocale, setSelectedLocale] = useState<AppLocale>(currentLocale);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const translationOptions = useMemo(() => ({ lng: selectedLocale }), [selectedLocale]);

  const localeOptions = useMemo(
    () =>
      appLocales.map((locale) => ({
        value: locale,
        label: t(`languageNames.${locale}`, translationOptions),
      })),
    [t, translationOptions]
  );
  const avatarLabels = useMemo(
    () =>
      Object.fromEntries(
        avatarPresets.map((avatar) => [avatar.id, t(`avatars.${avatar.id}`, translationOptions)])
      ) as Record<string, string>,
    [t, translationOptions]
  );

  if (!hasHydrated) {
    return <LoadingScreen />;
  }

  if (profile) {
    return <Redirect href="/home" />;
  }

  const handleContinue = async () => {
    const validation = validateNickname(nickname);

    if (!validation.valid) {
      setErrorKey(validation.reasonKey);
      return;
    }

    setErrorKey(null);
    setServerError(null);
    setIsSaving(true);

    const profile = {
      nickname: validation.sanitizedValue,
      avatarId: selectedAvatarId,
      locale: selectedLocale,
    };

    try {
      await ensureGuestSession(profile);
      completeOnboarding(profile);
      router.replace('/home');
    } catch {
      setServerError(t('onboarding.serverError', translationOptions));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OnboardingView
        errorMessage={errorKey ? t(errorKey, translationOptions) : serverError}
        helperText={t('onboarding.nicknameHint', translationOptions)}
        isSaving={isSaving}
        localeOptions={localeOptions}
        nickname={nickname}
        onChangeNickname={setNickname}
        onSelectAvatar={setSelectedAvatarId}
        onSelectLocale={setSelectedLocale}
        onSubmit={() => void handleContinue()}
        privacyNote={t('onboarding.privacyNote', translationOptions)}
        avatarLabels={avatarLabels}
        selectedAvatarId={selectedAvatarId}
        selectedLocale={selectedLocale}
        strings={{
          avatarLabel: t('onboarding.avatarLabel', translationOptions),
          ctaLabel: t(isSaving ? 'common.loading' : 'onboarding.cta', translationOptions),
          eyebrow: t('onboarding.eyebrow', translationOptions),
          languageLabel: t('onboarding.languageLabel', translationOptions),
          nicknameLabel: t('onboarding.nicknameLabel', translationOptions),
          nicknamePlaceholder: t('onboarding.nicknamePlaceholder', translationOptions),
          previewEyebrow: t('onboarding.previewEyebrow', translationOptions),
          previewFallbackName: t('onboarding.previewFallbackName', translationOptions),
          previewLanguageLabel: t('onboarding.previewLanguageLabel', translationOptions),
          previewTitle: t('onboarding.previewTitle', translationOptions),
          subtitle: t('onboarding.subtitle', translationOptions),
          title: t('onboarding.title', translationOptions),
        }}
      />
    </>
  );
}
