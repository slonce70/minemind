import 'expo-dev-client';

import { Nunito_400Regular } from '@expo-google-fonts/nunito/400Regular';
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';
import { Nunito_900Black } from '@expo-google-fonts/nunito/900Black';
import { Tiny5_400Regular } from '@expo-google-fonts/tiny5/400Regular';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import '../src/i18n';

import { appTheme, colors, fonts } from '../src/theme/tokens';
import { setI18nLanguage } from '../src/i18n';
import { isQuestionBankLoaded, preloadQuestionBank } from '../src/features/content/content-loader';
import { syncMusic } from '../src/features/feel/feedback';
import { ParentalGateHost } from '../src/features/parental/parental-gate-host';
import { useProgressSync } from '../src/features/progress/use-progress-sync';
import { initMonitoring } from '../src/lib/monitoring';
import { useAppStore } from '../src/state/app-store';

initMonitoring();

export default function RootLayout() {
  const locale = useAppStore((state) => state.locale);
  const musicEnabled = useAppStore((state) => state.settings.music);
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const reduceMotion = useReducedMotion();
  useProgressSync();
  const [queryClient] = useState(() => new QueryClient());
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
    Tiny5_400Regular,
  });

  const [bankLoaded, setBankLoaded] = useState(isQuestionBankLoaded);

  useEffect(() => {
    let retry: ReturnType<typeof setTimeout> | undefined;
    const load = () =>
      preloadQuestionBank().then(
        () => setBankLoaded(true),
        // A dropped connection: try again shortly.
        () => {
          retry = setTimeout(load, 2000);
        }
      );

    if (!isQuestionBankLoaded()) {
      void load();
    }

    return () => clearTimeout(retry);
  }, []);

  useEffect(() => {
    void setI18nLanguage(locale);

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  // Browsers only allow audio after the first tap, so on the web the loop starts with it.
  useEffect(() => {
    if (!hasHydrated) {
      return undefined;
    }

    if (Platform.OS !== 'web' || !musicEnabled) {
      syncMusic(musicEnabled);
      return undefined;
    }

    const start = () => syncMusic(useAppStore.getState().settings.music);

    window.addEventListener('pointerdown', start, { once: true });

    return () => window.removeEventListener('pointerdown', start);
  }, [hasHydrated, musicEnabled]);

  // A missing font falls back to the system one rather than blocking the app.
  if ((!fontsLoaded && !fontError) || !bankLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          // Every screen draws its own top bar.
          headerShown: false,
          headerTintColor: appTheme.text.primary,
          headerTitleStyle: {
            fontFamily: fonts.extraBold,
            color: appTheme.text.primary,
          },
          headerTransparent: true,
          contentStyle: { backgroundColor: colors.canvas },
          animation: reduceMotion ? 'none' : 'slide_from_right',
        }}
      />
      <ParentalGateHost />
    </QueryClientProvider>
  );
}
