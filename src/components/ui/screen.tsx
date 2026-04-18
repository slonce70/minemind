import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View, type ViewProps } from 'react-native';

import { appTheme, colors, spacing } from '../../theme/tokens';

type ScreenProps = ViewProps & {
  scrollable?: boolean;
};

export function Screen({ children, scrollable = true, style, ...props }: ScreenProps) {
  const content = (
    <View style={[styles.content, style]} {...props}>
      {children}
    </View>
  );

  return (
    <LinearGradient colors={colors.backgroundGradient} style={styles.gradient}>
      <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={styles.safeArea}>
        {scrollable ? (
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.lg,
  },
  content: {
    flex: 1,
    gap: appTheme.layout.screenGap,
    paddingHorizontal: appTheme.layout.screenPadding,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
});
