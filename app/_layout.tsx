import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import '../src/i18n';

import { appTheme, colors } from '../src/theme/tokens';
import { setI18nLanguage } from '../src/i18n';
import { useAppStore } from '../src/state/app-store';

export default function RootLayout() {
  const locale = useAppStore((state) => state.locale);
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    void setI18nLanguage(locale);
  }, [locale]);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerShown: true,
          headerTintColor: appTheme.text.primary,
          headerTitleStyle: {
            color: appTheme.text.primary,
            fontWeight: '800',
          },
          headerTransparent: true,
          contentStyle: { backgroundColor: colors.canvas },
          animation: 'slide_from_right',
        }}
      />
    </QueryClientProvider>
  );
}
