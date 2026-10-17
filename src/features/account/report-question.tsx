import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { questionReportReasons, type QuestionReportReason } from '../../../supabase/functions/_shared/question-reports';
import type { AppLocale } from '../../lib/locale';
import { colors, fonts, radii, spacing, typography } from '../../theme/tokens';
import { canReportQuestions, reportQuestion } from './account-service';

/** "Something wrong?" under the answer: pick a reason from the list (no free text), sent once. */
export function ReportQuestion({ locale, questionId }: { locale: AppLocale; questionId: string }) {
  const { t } = useTranslation();
  const [stage, setStage] = useState<'closed' | 'open' | 'sending' | 'sent' | 'failed'>('closed');

  if (!canReportQuestions) {
    return null;
  }

  const send = async (reason: QuestionReportReason) => {
    setStage('sending');

    try {
      await reportQuestion({ locale, questionId, reason });
      setStage('sent');
    } catch {
      setStage('failed');
    }
  };

  if (stage === 'sent' || stage === 'failed') {
    return (
      <Text accessibilityLiveRegion="polite" style={styles.note}>
        {t(stage === 'sent' ? 'report.sent' : 'report.failed')}
      </Text>
    );
  }

  if (stage === 'closed') {
    return (
      <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setStage('open')} style={styles.link}>
        <Text style={styles.linkText}>{t('report.button')}</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.panel}>
      <Text accessibilityRole="header" style={styles.title}>
        {t('report.title')}
      </Text>
      {questionReportReasons.map((reason) => (
        <Pressable
          accessibilityRole="button"
          disabled={stage === 'sending'}
          key={reason}
          onPress={() => void send(reason)}
          style={styles.reason}
        >
          <Text style={styles.reasonText}>{t(`report.reasons.${reason}`)}</Text>
        </Pressable>
      ))}
      <Pressable accessibilityRole="button" onPress={() => setStage('closed')} style={styles.link}>
        <Text style={styles.linkText}>{t('report.cancel')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  link: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
  },
  linkText: {
    color: colors.textMuted,
    fontFamily: fonts.bold,
    fontSize: typography.caption,
    textDecorationLine: 'underline',
  },
  note: {
    color: colors.textSecondary,
    fontFamily: fonts.bold,
    fontSize: typography.caption,
  },
  panel: {
    gap: spacing.xs,
  },
  reason: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    borderWidth: 2,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  reasonText: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: typography.body,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: typography.body,
  },
});
