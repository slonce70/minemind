import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '../../theme/tokens';
import { buildClassroomInviteQrMatrix } from './classroom-invite';

type ClassroomInviteQrProps = {
  accessibilityLabel: string;
  value: string;
};

export const ClassroomInviteQr = memo(function ClassroomInviteQr({
  accessibilityLabel,
  value,
}: ClassroomInviteQrProps) {
  const matrix = useMemo(() => buildClassroomInviteQrMatrix(value), [value]);

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
      style={styles.frame}
    >
      {matrix.cells.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((isDark, columnIndex) => (
            <View
              key={`${rowIndex}-${columnIndex}`}
              style={[styles.module, isDark ? styles.darkModule : styles.lightModule]}
            />
          ))}
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  frame: {
    alignSelf: 'center',
    aspectRatio: 1,
    backgroundColor: colors.textPrimary,
    borderColor: colors.borderStrong,
    borderRadius: 6,
    borderWidth: 2,
    maxWidth: 260,
    padding: spacing.sm,
    width: '100%',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  module: {
    flex: 1,
  },
  darkModule: {
    backgroundColor: colors.canvas,
  },
  lightModule: {
    backgroundColor: colors.textPrimary,
  },
});
