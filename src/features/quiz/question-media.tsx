import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radii, spacing, typography } from '../../theme/tokens';
import type { QuestionMedia } from '../content/types';
import { isItemSpriteId, itemSprites } from '../ui/item-sprites';
import { PixelSprite } from '../ui/pixel-sprite';

export function ItemIcon({ id, size }: { id: string; size: number }) {
  return isItemSpriteId(id) ? <PixelSprite size={size} sprite={itemSprites[id]} /> : null;
}

/** The picture or crafting grid of a question. Labels describe it without giving the answer away. */
export function QuestionMediaView({ labels, media }: { labels: { picture: string; recipe: string }; media: QuestionMedia }) {
  if (media.type === 'picture') {
    return (
      <View accessibilityLabel={labels.picture} accessibilityRole="image" accessible style={styles.picture}>
        <ItemIcon id={media.sprite} size={112} />
      </View>
    );
  }

  return (
    <View accessibilityLabel={labels.recipe} accessibilityRole="image" accessible style={styles.grid}>
      {media.grid.map((cell, index) => (
        <View key={index} style={[styles.cell, index === media.missingSlot && styles.cellMissing]}>
          {index === media.missingSlot ? <Text style={styles.missing}>?</Text> : cell ? <ItemIcon id={cell} size={36} /> : null}
        </View>
      ))}
    </View>
  );
}

const cellSize = 52;

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    backgroundColor: colors.surfaceInset,
    borderColor: colors.borderStrong,
    borderRadius: radii.sm,
    borderWidth: 2,
    height: cellSize,
    justifyContent: 'center',
    width: cellSize,
  },
  cellMissing: {
    borderColor: colors.highlight,
    borderStyle: 'dashed',
  },
  grid: {
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xxs,
    width: cellSize * 3 + spacing.xxs * 2,
  },
  missing: {
    color: colors.highlight,
    fontFamily: fonts.display,
    fontSize: typography.h2,
  },
  picture: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.surfaceInset,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
});
