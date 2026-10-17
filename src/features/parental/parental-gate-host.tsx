import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton, SecondaryButton } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { colors, fonts, radii, spacing, typography } from '../../theme/tokens';
import { answerParentalGate, cancelParentalGate, useParentalGateState } from './parental-gate';

/** The parental gate dialog; mounted once in the root layout. */
export function ParentalGateHost() {
  const { t } = useTranslation();
  const gate = useParentalGateState();
  const [answer, setAnswer] = useState('');

  useEffect(() => setAnswer(''), [gate?.challenge]);

  if (!gate) {
    return null;
  }

  const words = t('parents.numbers', { returnObjects: true }) as string[];
  const question = t('parents.question', { a: words[gate.challenge.a], b: words[gate.challenge.b] });

  return (
    <Modal animationType="fade" onRequestClose={cancelParentalGate} transparent visible>
      <View style={styles.backdrop}>
        <Card highlight style={styles.card}>
          <Text accessibilityRole="header" style={styles.title}>
            {t('parents.title')}
          </Text>
          <Text style={styles.hint}>{t('parents.hint')}</Text>
          <Text nativeID="parental-gate-question" style={styles.question}>
            {question}
          </Text>
          <TextInput
            accessibilityLabel={question}
            autoFocus
            inputMode="numeric"
            keyboardType="number-pad"
            maxLength={3}
            onChangeText={setAnswer}
            onSubmitEditing={() => answerParentalGate(answer)}
            placeholder={t('parents.placeholder')}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={answer}
          />
          {gate.failed ? (
            <Text accessibilityLiveRegion="polite" style={styles.error}>
              {t('parents.wrong')}
            </Text>
          ) : null}
          <PrimaryButton disabled={!answer.trim()} label={t('parents.continue')} onPress={() => answerParentalGate(answer)} />
          <SecondaryButton label={t('parents.cancel')} onPress={cancelParentalGate} />
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    // The highlight tone is translucent; the dialog must hide the screen behind it.
    backgroundColor: colors.canvas,
    gap: spacing.md,
    maxWidth: 420,
    width: '100%',
  },
  error: {
    color: colors.danger,
    fontFamily: fonts.bold,
    fontSize: typography.caption,
  },
  hint: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: typography.body,
    lineHeight: 22,
  },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    borderWidth: 2,
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: typography.h3,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  question: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: typography.h3,
    lineHeight: 28,
  },
  title: {
    color: colors.highlight,
    fontFamily: fonts.display,
    fontSize: typography.h2,
  },
});
