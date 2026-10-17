import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';

import { SecondaryButton } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { colors, fonts, typography } from '../../theme/tokens';
import { requestParentalGate } from '../parental/parental-gate';
import { collectMyData, deleteMyAccount, deliverMyData } from './account-service';

/** Settings card for parents: legal pages, data export and account deletion (behind the gate). */
export function ParentsCard() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);

  const guarded = async (action: () => Promise<void>) => {
    if (!(await requestParentalGate())) {
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      await action();
    } catch (error) {
      setMessage({ error: true, text: t('account.failed', { reason: error instanceof Error ? error.message : String(error) }) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card tone="utility">
      <Text accessibilityRole="header" style={styles.title}>
        {t('account.title')}
      </Text>
      <SecondaryButton label={t('account.privacy')} onPress={() => router.push('/privacy')} />
      <SecondaryButton label={t('account.terms')} onPress={() => router.push('/terms')} />
      <Text style={styles.note}>{t('account.exportHint')}</Text>
      <SecondaryButton
        disabled={busy}
        label={t('account.export')}
        onPress={() =>
          void guarded(async () => {
            await deliverMyData(await collectMyData());
            setMessage({ error: false, text: t('account.exported') });
          })
        }
      />
      <Text style={styles.note}>{t('account.deleteHint')}</Text>
      <SecondaryButton
        disabled={busy}
        label={busy && confirmDelete ? t('account.deleting') : confirmDelete ? t('account.deleteConfirm') : t('account.delete')}
        onPress={() => {
          if (!confirmDelete) {
            setConfirmDelete(true);
            return;
          }

          void guarded(async () => {
            await deleteMyAccount();
            router.replace('/onboarding');
          });
        }}
        selected={confirmDelete}
      />
      {message ? (
        <Text accessibilityLiveRegion="polite" style={[styles.message, message.error && styles.error]}>
          {message.text}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  error: {
    color: colors.danger,
  },
  message: {
    color: colors.success,
    fontFamily: fonts.bold,
    fontSize: typography.caption,
  },
  note: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: typography.caption,
    lineHeight: 19,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: typography.h3,
  },
});
