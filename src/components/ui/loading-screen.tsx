import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { appTheme, colors, typography } from '../../theme/tokens';

export function LoadingScreen() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.highlight} size="large" />
      <Text style={styles.label}>MineMind</Text>
      <Text style={styles.subtle}>{t('common.loadingMatch')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.canvas,
    flex: 1,
    gap: appTheme.layout.screenGap,
    justifyContent: 'center',
    paddingHorizontal: appTheme.layout.screenPadding,
  },
  label: {
    color: colors.textPrimary,
    fontSize: typography.h3,
    fontWeight: '800',
  },
  subtle: {
    color: colors.textMuted,
    fontSize: typography.caption,
    textAlign: 'center',
  },
});
