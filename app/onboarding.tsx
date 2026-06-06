import { Redirect, Stack, router } from 'expo-router';
import { useMemo, useReducer } from 'react';
import { useTranslation } from 'react-i18next';

import { LoadingScreen } from '../src/components/ui/loading-screen';
import { avatarPresets } from '../src/features/profile/avatar-presets';
import { OnboardingView } from '../src/features/onboarding/onboarding-view';
import { validateNickname } from '../src/features/profile/nickname';
import { ensureGuestSession } from '../src/features/profile/profile-service';
import type { AppLocale } from '../src/lib/locale';
import { appLocales } from '../src/lib/locale';
import { useAppStore } from '../src/state/app-store';

type OnboardingFormState = {
  errorKey: string | null;
  isSaving: boolean;
  nickname: string;
  selectedAvatarId: string;
  selectedLocale: AppLocale;
  serverError: string | null;
};

type OnboardingAction =
  | { type: 'avatar'; value: string }
  | { type: 'locale'; value: AppLocale }
  | { type: 'nickname'; value: string }
  | { type: 'saveFailed'; message: string }
  | { type: 'saving'; value: boolean }
  | { type: 'validationError'; reasonKey: string }
  | { type: 'validationPassed' };

function createInitialOnboardingState(currentLocale: AppLocale): OnboardingFormState {
  return {
    errorKey: null,
    isSaving: false,
    nickname: '',
    selectedAvatarId: avatarPresets[0].id,
    selectedLocale: currentLocale,
    serverError: null,
  };
}

function onboardingReducer(
  state: OnboardingFormState,
  action: OnboardingAction
): OnboardingFormState {
  switch (action.type) {
    case 'avatar':
      return { ...state, selectedAvatarId: action.value };
    case 'locale':
      return { ...state, selectedLocale: action.value };
    case 'nickname':
      return { ...state, nickname: action.value };
    case 'saveFailed':
      return { ...state, serverError: action.message };
    case 'saving':
      return { ...state, isSaving: action.value };
    case 'validationError':
      return { ...state, errorKey: action.reasonKey };
    case 'validationPassed':
      return { ...state, errorKey: null, serverError: null };
    default:
      return state;
  }
}

export default function OnboardingRoute() {
  const { t } = useTranslation();
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const currentLocale = useAppStore((state) => state.locale);
  const profile = useAppStore((state) => state.profile);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const [formState, dispatch] = useReducer(
    onboardingReducer,
    currentLocale,
    createInitialOnboardingState
  );
  const { errorKey, isSaving, nickname, selectedAvatarId, selectedLocale, serverError } = formState;
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
      dispatch({ type: 'validationError', reasonKey: validation.reasonKey });
      return;
    }

    dispatch({ type: 'validationPassed' });
    dispatch({ type: 'saving', value: true });

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
      dispatch({ type: 'saveFailed', message: t('onboarding.serverError', translationOptions) });
    } finally {
      dispatch({ type: 'saving', value: false });
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
        onChangeNickname={(value) => dispatch({ type: 'nickname', value })}
        onSelectAvatar={(value) => dispatch({ type: 'avatar', value })}
        onSelectLocale={(value) => dispatch({ type: 'locale', value })}
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
