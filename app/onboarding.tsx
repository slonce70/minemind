import { Redirect, Stack, router } from 'expo-router';
import { useMemo, useReducer } from 'react';
import { useTranslation } from 'react-i18next';

import { LoadingScreen } from '../src/components/ui/loading-screen';
import { Screen } from '../src/components/ui/screen';
import { avatarPresets } from '../src/features/profile/avatar-presets';
import { OnboardingView } from '../src/features/onboarding/onboarding-view';
import { pathAfterOnboarding } from '../src/features/rooms/room-join-link';
import { TutorialRound } from '../src/features/onboarding/tutorial-round';
import { validateNickname } from '../src/features/profile/nickname';
import { generateNickname } from '../src/features/profile/nickname-generator';
import { ensureGuestSession } from '../src/features/profile/profile-service';
import type { AppLocale } from '../src/lib/locale';
import { appLocales } from '../src/lib/locale';
import { useAppStore } from '../src/state/app-store';

type OnboardingFormState = {
  errorKey: string | null;
  isSaving: boolean;
  nickname: string;
  /** The player typed their own nickname: stop replacing it with suggestions. */
  nicknameTouched: boolean;
  selectedAvatarId: string;
  selectedLocale: AppLocale;
  serverError: string | null;
  step: 'tutorial' | 'profile';
};

type OnboardingAction =
  | { type: 'avatar'; value: string }
  | { type: 'locale'; value: AppLocale }
  | { type: 'nickname'; value: string }
  | { type: 'roll' }
  | { type: 'tutorialDone' }
  | { type: 'saveFailed'; message: string }
  | { type: 'saving'; value: boolean }
  | { type: 'validationError'; reasonKey: string }
  | { type: 'validationPassed' };

function createInitialOnboardingState(currentLocale: AppLocale): OnboardingFormState {
  return {
    errorKey: null,
    isSaving: false,
    nickname: generateNickname(currentLocale),
    nicknameTouched: false,
    selectedAvatarId: avatarPresets[0].id,
    selectedLocale: currentLocale,
    serverError: null,
    step: 'tutorial',
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
      return {
        ...state,
        nickname: state.nicknameTouched ? state.nickname : generateNickname(action.value),
        selectedLocale: action.value,
      };
    case 'nickname':
      return { ...state, errorKey: null, nickname: action.value, nicknameTouched: true };
    case 'roll':
      return {
        ...state,
        errorKey: null,
        nickname: generateNickname(state.selectedLocale, Math.random, state.nickname),
        nicknameTouched: false,
      };
    case 'tutorialDone':
      return { ...state, step: 'profile' };
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
  const { errorKey, isSaving, nickname, selectedAvatarId, selectedLocale, serverError, step } = formState;
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
      const { pendingRoomCode, setPendingRoomCode } = useAppStore.getState();
      completeOnboarding(profile);
      setPendingRoomCode(undefined);
      router.replace(pathAfterOnboarding(pendingRoomCode));
    } catch {
      dispatch({ type: 'saveFailed', message: t('onboarding.serverError', translationOptions) });
    } finally {
      dispatch({ type: 'saving', value: false });
    }
  };

  if (step === 'tutorial') {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ headerShown: false }} />
        <TutorialRound
          locale={selectedLocale}
          localeOptions={localeOptions}
          onDone={() => dispatch({ type: 'tutorialDone' })}
          onLocaleChange={(value) => dispatch({ type: 'locale', value })}
          strings={{
            correct: t('solo.toastCorrect', translationOptions),
            eyebrow: t('onboarding.tutorialEyebrow', translationOptions),
            factEyebrow: t('solo.factEyebrow', translationOptions),
            hints: [
              t('onboarding.tutorialHint1', translationOptions),
              t('onboarding.tutorialHint2', translationOptions),
              t('onboarding.tutorialHint3', translationOptions),
            ],
            languageLabel: t('onboarding.languageLabel', translationOptions),
            next: t('onboarding.tutorialNext', translationOptions),
            optionA11y: (letter, text) => t('solo.optionA11y', { ...translationOptions, letter, text }),
            skip: t('onboarding.tutorialSkip', translationOptions),
            step: (current, total) => t('onboarding.tutorialStep', { ...translationOptions, current, total }),
            subtitle: t('onboarding.tutorialSubtitle', translationOptions),
            title: t('onboarding.tutorialTitle', translationOptions),
            toProfile: t('onboarding.tutorialToProfile', translationOptions),
            wrong: t('solo.toastWrong', translationOptions),
          }}
        />
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OnboardingView
        avatarLabels={avatarLabels}
        errorMessage={errorKey ? t(errorKey, translationOptions) : serverError}
        helperText={t('onboarding.nicknameHint', translationOptions)}
        isSaving={isSaving}
        nickname={nickname}
        onChangeNickname={(value) => dispatch({ type: 'nickname', value })}
        onRollNickname={() => dispatch({ type: 'roll' })}
        onSelectAvatar={(value) => dispatch({ type: 'avatar', value })}
        onSubmit={() => void handleContinue()}
        privacyNote={t('onboarding.privacyNote', translationOptions)}
        selectedAvatarId={selectedAvatarId}
        selectedLocaleLabel={t(`languageNames.${selectedLocale}`, translationOptions)}
        strings={{
          avatarLabel: t('onboarding.avatarLabel', translationOptions),
          ctaLabel: t(isSaving ? 'common.loading' : 'onboarding.cta', translationOptions),
          diceLabel: t('onboarding.diceLabel', translationOptions),
          disclaimer: t('common.disclaimer', translationOptions),
          eyebrow: t('onboarding.eyebrow', translationOptions),
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
