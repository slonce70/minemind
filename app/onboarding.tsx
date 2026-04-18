import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { avatarPresets } from '../src/features/profile/avatar-presets';
import { OnboardingView } from '../src/features/onboarding/onboarding-view';
import { validateNickname } from '../src/features/profile/nickname';
import { ensureGuestSession } from '../src/features/profile/profile-service';
import type { AppLocale } from '../src/lib/locale';
import { appLocales } from '../src/lib/locale';
import { useAppStore } from '../src/state/app-store';

export default function OnboardingRoute() {
  const { t } = useTranslation();
  const currentLocale = useAppStore((state) => state.locale);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const [nickname, setNickname] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(avatarPresets[0].id);
  const [selectedLocale, setSelectedLocale] = useState<AppLocale>(currentLocale);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const localeOptions = useMemo(
    () => appLocales.map((locale) => ({ value: locale, label: t(`languageNames.${locale}`) })),
    [t]
  );

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
      completeOnboarding(profile);
      await ensureGuestSession(profile);
      router.replace('/home');
    } catch {
      setServerError(t('onboarding.serverError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <OnboardingView
      errorMessage={errorKey ? t(errorKey) : serverError}
      helperText={t('onboarding.nicknameHint')}
      isSaving={isSaving}
      localeOptions={localeOptions}
      nickname={nickname}
      onChangeNickname={setNickname}
      onSelectAvatar={setSelectedAvatarId}
      onSelectLocale={setSelectedLocale}
      onSubmit={() => void handleContinue()}
      privacyNote={t('onboarding.privacyNote')}
      selectedAvatarId={selectedAvatarId}
      selectedLocale={selectedLocale}
      strings={{
        avatarLabel: t('onboarding.avatarLabel'),
        ctaLabel: t(isSaving ? 'common.loading' : 'onboarding.cta'),
        eyebrow: t('onboarding.eyebrow'),
        languageLabel: t('onboarding.languageLabel'),
        nicknameLabel: t('onboarding.nicknameLabel'),
        nicknamePlaceholder: t('onboarding.nicknamePlaceholder'),
        previewEyebrow: t('onboarding.previewEyebrow'),
        previewFallbackName: t('onboarding.previewFallbackName'),
        previewLanguageLabel: t('onboarding.previewLanguageLabel'),
        previewTitle: t('onboarding.previewTitle'),
        subtitle: t('onboarding.subtitle'),
        title: t('onboarding.title'),
      }}
    />
  );
}
