import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '../../components/ui/card';
import { Screen } from '../../components/ui/screen';
import { ScreenHeader } from '../../components/ui/screen-header';
import { appLocales, type AppLocale } from '../../lib/locale';
import { useAppStore } from '../../state/app-store';
import { colors, fonts, spacing, typography } from '../../theme/tokens';
import { ChoiceRow } from '../profile/profile-controls';
import { legalDocuments, type LegalDocumentId } from './legal-content';

/**
 * Fills the operator's details from the build environment. The fallbacks only serve development:
 * release builds must set them (scripts/check-release-env.mjs, docs/release/checklist.md).
 */
export function fillLegalPlaceholders(text: string, fallbackContact: string) {
  const values: Record<string, string> = {
    developer: process.env.EXPO_PUBLIC_LEGAL_DEVELOPER?.trim() || 'MineMind',
    email: process.env.EXPO_PUBLIC_CONTACT_EMAIL?.trim() || fallbackContact,
    region: process.env.EXPO_PUBLIC_DATA_REGION?.trim() || 'EU',
  };

  return text.replace(/\{\{(developer|email|region)\}\}/g, (_, key: string) => values[key]);
}

/**
 * Privacy policy or terms. Opens without a profile, so the web export serves it as a plain page:
 * /privacy?lang=uk, /terms?lang=en. Without `lang` it follows the app language.
 */
export function LegalDocumentView({ id }: { id: LegalDocumentId }) {
  const { t, i18n } = useTranslation();
  const appLocale = useAppStore((state) => state.locale);
  const params = useLocalSearchParams<{ lang?: string }>();
  const locale: AppLocale = appLocales.find((value) => value === params.lang) ?? appLocale;
  const document = legalDocuments[id][locale];
  const fill = (text: string) => fillLegalPlaceholders(text, i18n.getFixedT(locale)('legal.contactFallback'));

  return (
    <Screen scrollable>
      <Stack.Screen options={{ headerShown: false, title: `${document.title} · MineMind` }} />
      <ScreenHeader backLabel={t('legal.back')} title={document.title} />
      <ChoiceRow
        label={t('settings.languageTitle')}
        onSelect={(lang) => router.setParams({ lang })}
        options={appLocales.map((value) => ({ label: t(`languageNames.${value}`), value }))}
        selected={locale}
      />
      <Card>
        <Text style={styles.updated}>{document.updated}</Text>
        <Text style={styles.paragraph}>{fill(document.intro)}</Text>
      </Card>
      {document.sections.map((section) => (
        <Card key={section.heading}>
          <Text accessibilityRole="header" style={styles.heading}>
            {section.heading}
          </Text>
          <View style={styles.section}>
            {section.paragraphs.map((paragraph) => (
              <Text key={paragraph} style={styles.paragraph}>
                {fill(paragraph)}
              </Text>
            ))}
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: typography.h3,
  },
  paragraph: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: typography.body,
    lineHeight: 23,
  },
  section: {
    gap: spacing.sm,
  },
  updated: {
    color: colors.textMuted,
    fontFamily: fonts.bold,
    fontSize: typography.caption,
  },
});
