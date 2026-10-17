import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { SecondaryButton } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { isSupabaseConfigured } from '../../lib/supabase';
import { colors, fonts, radii, spacing, typography } from '../../theme/tokens';
import { PixelIcon } from '../ui/pixel-icon';
import { isValidEmail, linkEmail, readAccountState, sendRestoreLink, type AccountState } from './account-link';

/** Profile card: link the guest account to an email, or restore progress from one. */
export function CloudSaveCard() {
  const { t } = useTranslation();
  const [account, setAccount] = useState<AccountState | null>(null);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void readAccountState().then(setAccount);
  }, []);

  const run = async (action: (value: string) => Promise<{ confirmed: boolean }>, sentKey: string) => {
    if (!isValidEmail(email)) {
      setMessage({ error: true, text: t('cloud.invalidEmail') });
      return;
    }

    setBusy(true);

    try {
      const { confirmed } = await action(email);

      if (confirmed) {
        setAccount(await readAccountState());
      } else {
        setMessage({ error: false, text: t(sentKey, { email: email.trim() }) });
      }
    } catch (error) {
      setMessage({ error: true, text: t('cloud.failed', { reason: error instanceof Error ? error.message : String(error) }) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <View style={styles.header}>
        <PixelIcon color={colors.highlight} name="cloud" size={22} />
        <Text accessibilityRole="header" style={styles.title}>
          {t('cloud.title')}
        </Text>
      </View>
      {!isSupabaseConfigured ? (
        <Text style={styles.note}>{t('cloud.offline')}</Text>
      ) : account?.email && !account.isAnonymous ? (
        <Text style={styles.note}>{t('cloud.linked', { email: account.email })}</Text>
      ) : (
        <>
          <Text style={styles.note}>{t('cloud.status')}</Text>
          <Text nativeID="cloud-email-label" style={styles.label}>
            {t('cloud.emailLabel')}
          </Text>
          <TextInput
            accessibilityLabel={t('cloud.emailLabel')}
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            inputMode="email"
            onChangeText={(value) => {
              setEmail(value);
              setMessage(null);
            }}
            placeholder={t('cloud.emailPlaceholder')}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={email}
          />
          <SecondaryButton disabled={busy} label={t('cloud.link')} onPress={() => void run(linkEmail, 'cloud.linkSent')} />
          <Text style={styles.note}>{t('cloud.restoreHint')}</Text>
          <SecondaryButton disabled={busy} label={t('cloud.restore')} onPress={() => void run(sendRestoreLink, 'cloud.restoreSent')} />
          {message ? (
            <Text accessibilityLiveRegion="polite" style={[styles.message, message.error && styles.messageError]}>
              {message.text}
            </Text>
          ) : null}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    borderWidth: 2,
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: typography.body,
    minHeight: 48,
    paddingHorizontal: spacing.md,
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
  note: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: typography.body,
    lineHeight: 22,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: typography.h3,
  },
});
