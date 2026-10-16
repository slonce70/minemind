import assert from 'node:assert/strict';
import test from 'node:test';

import { colors } from '../src/theme/tokens';

type Rgb = [number, number, number];

function parse(color: string): [number, number, number, number] {
  if (color.startsWith('#')) {
    const hex = color.slice(1);

    return [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16)).concat(1) as [number, number, number, number];
  }

  const [r, g, b, a = 1] = (color.match(/rgba?\(([^)]+)\)/)?.[1] ?? '').split(',').map(Number);

  return [r, g, b, a];
}

/** A translucent colour composited over an opaque one. */
function over(top: string, bottom: Rgb): Rgb {
  const [r, g, b, a] = parse(top);

  return [r * a + bottom[0] * (1 - a), g * a + bottom[1] * (1 - a), b * a + bottom[2] * (1 - a)];
}

function luminance(rgb: Rgb) {
  const [r, g, b] = rgb.map((value) => {
    const channel = value / 255;

    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(text: string, surface: Rgb) {
  const [light, dark] = [luminance(over(text, surface)), luminance(surface)].sort((a, b) => b - a);

  return (light + 0.05) / (dark + 0.05);
}

test('text colours keep WCAG AA contrast (4.5:1) on every card surface', () => {
  const canvas = parse(colors.canvas).slice(0, 3) as Rgb;
  const panel = over(colors.panelSurface, canvas);
  const surfaces: Record<string, Rgb> = {
    accent: over(colors.surfaceAccent, panel),
    canvas,
    inset: over(colors.surfaceInset, panel),
    panel,
    raised: over(colors.surfaceRaised, panel),
    scene: over(colors.sceneSurface, canvas),
  };

  for (const [surfaceName, surface] of Object.entries(surfaces)) {
    for (const [textName, text] of Object.entries({
      highlight: colors.highlight,
      muted: colors.textMuted,
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
    })) {
      const ratio = contrast(text, surface);

      assert.ok(ratio >= 4.5, `${textName} on ${surfaceName}: ${ratio.toFixed(2)}`);
    }
  }

  assert.ok(contrast(colors.canvas, parse(colors.torch).slice(0, 3) as Rgb) >= 4.5, 'primary button label');
});
