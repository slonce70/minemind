import * as Linking from 'expo-linking';
import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '../src/components/ui/button';
import { Card } from '../src/components/ui/card';
import { Screen } from '../src/components/ui/screen';
import { completeSignInFromUrl } from '../src/features/progress/account-link';
import { syncProgressNow } from '../src/features/progress/use-progress-sync';
import { Mascot } from '../src/features/ui/mascot';
import { supabase } from '../src/lib/supabase';
import { normalizeLocale } from '../src/lib/locale';
import { useAppStore } from '../src/state/app-store';
import { colors, fonts, typography } from '../src/theme/tokens';

/** Landing screen of an email magic link: signs in, adopts the account's player and merges progress. */
export default function AuthRoute() {
  const { t } = useTranslation();
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const [status, setStatus] = useState<{ error?: string; state: 'working' | 'done' | 'failed' }>({ state: 'working' });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const url = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.href : await Linking.getInitialURL();
        await completeSignInFromUrl(url ?? '');

        const user = supabase ? (await supabase.auth.getSession()).data.session?.user : undefined;
        const { data: row } = user
          ? await supabase!.from('guest_profiles').select('nickname, avatar_id, locale').eq('id', user.id).maybeSingle()
          : { data: null };

        if (row) {
          completeOnboarding({ avatarId: row.avatar_id, locale: normalizeLocale(row.locale), nickname: row.nickname });
        }

        await syncProgressNow();

        if (!cancelled) {
          setStatus({ state: 'done' });
        }
      } catch (error) {
        if (!cancelled) {
          setStatus({ error: error instanceof Error ? error.message : String(error), state: 'failed' });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [completeOnboarding]);

  return (
    <Screen scrollable={false}>
      <Stack.Screen options={{ headerShown: false }} />
      <Card highlight style={styles.card}>
        <View style={styles.center}>
          <Mascot mood={status.state === 'failed' ? 'sad' : 'happy'} size={88} />
        </View>
        <Text accessibilityLiveRegion="polite" style={styles.text}>
          {status.state === 'working'
            ? t('cloud.signingIn')
            : status.state === 'done'
              ? t('cloud.done')
              : t('cloud.failed', { reason: status.error })}
        </Text>
        {status.state !== 'working' ? <PrimaryButton label={t('common.back')} onPress={() => router.replace('/home')} /> : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 16,
  },
  center: {
    alignItems: 'center',
  },
  text: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: typography.body,
    textAlign: 'center',
  },
});
