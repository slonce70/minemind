# Minecraft-Inspired UI Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh MineMind into a Minecraft-inspired UI system with blocky terrain materials, chunkier HUD controls, and a shared fix for the overlapping hero layout.

**Architecture:** Update shared design tokens and primitives first so the style change propagates system-wide, then move hero-heavy screens onto a two-zone composition backed by a safer `WorldBackground` layer model. Keep routes, state, and data flows intact; limit the work to presentational components plus regression tests that lock in the new visual system and responsive behavior.

**Tech Stack:** Expo Router, React Native, react-native-web, TypeScript, i18next, Node test runner via `tsx --test`, StyleSheet-based theming

---

## File Structure

### Shared UI Foundation

- Modify: `src/theme/tokens.ts`
  - Expand the palette from generic green glass to terrain/block materials and block shadows.
- Modify: `src/features/ui/theme-art.ts`
  - Replace banded background tokens with layered terrain tokens for `overworld`, `cave`, and `nether`.
- Modify: `src/components/ui/card.tsx`
  - Turn cards into block slabs with inner relief instead of soft glass panels.
- Modify: `src/components/ui/button.tsx`
  - Turn buttons into chunky HUD plates with a visible face and lip.
- Modify: `src/components/ui/stat-pill.tsx`
  - Turn stat chips into inset HUD plaques.
- Modify: `src/features/ui/badge-chip.tsx`
  - Restyle badge chips to match the same block plate language.

### Hero Layer And Screen Composition

- Modify: `src/features/ui/world-background.tsx`
  - Move terrain decoration into a behind-content layer model so it cannot slice through content.
- Modify: `src/features/home/home-view.tsx`
  - Split the hero into `header` and `control zone` slabs.
- Modify: `src/features/home/difficulty-selector.tsx`
  - Keep the selector blocky while preserving safe wrapping on smaller widths.
- Modify: `src/features/rooms/room-lobby-view.tsx`
  - Apply the same hero/control split and stack action buttons into a stable slab cluster.
- Modify: `src/features/results/results-view.tsx`
  - Turn the results hero into a reward slab with a separate summary zone and stable CTA stack.
- Modify: `src/features/onboarding/onboarding-view.tsx`
  - Convert onboarding preview and options into a block-profile layout instead of soft settings cards.

### Tests

- Create: `tests/ui-refresh.test.ts`
  - Lock in the terrain palette, block primitive styling markers, and per-screen hero layout structure.
- Modify: `tests/localization-layout.test.ts`
  - Keep the existing overlap regression checks aligned with the new component structure where needed.

### Existing References Worth Checking While Implementing

- Read: `docs/superpowers/specs/2026-04-19-minecraft-inspired-ui-refresh-design.md`
- Read: `docs/superpowers/specs/2026-04-18-minemind-v1-redesign-design.md`

### Task 1: Lock In Terrain Tokens And Block Primitives

**Files:**
- Create: `tests/ui-refresh.test.ts`
- Modify: `src/theme/tokens.ts`
- Modify: `src/features/ui/theme-art.ts`
- Modify: `src/components/ui/card.tsx`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/stat-pill.tsx`
- Modify: `src/features/ui/badge-chip.tsx`
- Test: `tests/ui-refresh.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { themeArt } from '../src/features/ui/theme-art';
import { appTheme, colors } from '../src/theme/tokens';

test('terrain palette exposes layered block materials for every world variant', () => {
  assert.ok(colors.surfaceInset);
  assert.ok(colors.surfaceAccent);
  assert.ok(colors.borderFocus);
  assert.equal(appTheme.layout.cardRadius, 14);
  assert.ok(themeArt.overworld.terrainTop);
  assert.ok(themeArt.cave.terrainMid);
  assert.ok(themeArt.nether.terrainBottom);
  assert.ok(themeArt.overworld.detail);
});

test('shared primitives use block relief instead of glass-only panels', () => {
  const cardSource = readFileSync(new URL('../src/components/ui/card.tsx', import.meta.url), 'utf8');
  const buttonSource = readFileSync(new URL('../src/components/ui/button.tsx', import.meta.url), 'utf8');
  const statPillSource = readFileSync(new URL('../src/components/ui/stat-pill.tsx', import.meta.url), 'utf8');
  const badgeSource = readFileSync(new URL('../src/features/ui/badge-chip.tsx', import.meta.url), 'utf8');

  assert.match(cardSource, /styles\\.innerStroke/);
  assert.match(buttonSource, /styles\\.buttonFace/);
  assert.match(buttonSource, /styles\\.buttonLip/);
  assert.match(statPillSource, /styles\\.inset/);
  assert.match(badgeSource, /styles\\.plate/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/ui-refresh.test.ts`

Expected: FAIL with missing `surfaceInset`/`surfaceAccent`/`borderFocus` keys and missing style markers like `styles.innerStroke` or `styles.buttonFace`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/theme/tokens.ts
export const appTheme = {
  accent: {
    primary: '#79B24A',
    soft: '#24311D',
    warm: '#D8A73E',
  },
  feedback: {
    correct: '#90D05F',
    danger: '#D96C54',
    wrong: '#D98B4E',
    waiting: '#D8A73E',
  },
  layout: {
    cardRadius: 14,
    chipRadius: 10,
    controlHeight: 60,
    screenGap: 16,
    screenPadding: 20,
  },
  shadow: {
    block: '0 8px 0 rgba(9, 12, 8, 0.42)',
    panel: '0 16px 30px rgba(0, 0, 0, 0.32)',
  },
  surface: {
    base: '#171D14',
    border: 'rgba(92, 112, 73, 0.65)',
    borderStrong: 'rgba(141, 172, 109, 0.72)',
    borderFocus: '#D8A73E',
    canvas: '#0B0F0A',
    gradient: ['#0B0F0A', '#1A2316', '#2A2014'] as const,
    raised: '#263121',
    inset: '#1D2519',
    accent: '#34452A',
    successSoft: 'rgba(144, 208, 95, 0.16)',
    warningSoft: 'rgba(216, 167, 62, 0.18)',
  },
  text: {
    inverse: '#0B0F0A',
    muted: '#A7B59C',
    primary: '#F2F0E6',
    secondary: '#D1D4C7',
  },
  typography: {
    body: 16,
    caption: 14,
    display: 34,
    h1: 28,
    h2: 24,
    h3: 20,
    micro: 11,
    overline: 12,
  },
} as const;

export const colors = {
  accent: appTheme.accent.primary,
  accentSoft: appTheme.accent.soft,
  backgroundGradient: appTheme.surface.gradient,
  border: appTheme.surface.border,
  borderStrong: appTheme.surface.borderStrong,
  borderFocus: appTheme.surface.borderFocus,
  canvas: appTheme.surface.canvas,
  danger: appTheme.feedback.danger,
  dangerSoft: 'rgba(217, 108, 84, 0.14)',
  highlight: appTheme.accent.warm,
  success: appTheme.feedback.correct,
  successSoft: appTheme.surface.successSoft,
  surface: appTheme.surface.base,
  surfaceAccent: appTheme.surface.accent,
  surfaceInset: appTheme.surface.inset,
  surfaceRaised: appTheme.surface.raised,
  textMuted: appTheme.text.muted,
  textPrimary: appTheme.text.primary,
  textSecondary: appTheme.text.secondary,
} as const;

export const radii = {
  lg: 10,
  xl: appTheme.layout.cardRadius,
  full: appTheme.layout.chipRadius,
} as const;

export const shadows = {
  soft: { boxShadow: appTheme.shadow.panel },
  block: { boxShadow: appTheme.shadow.block },
} as const;
```

```ts
// src/features/ui/theme-art.ts
export const themeArt = {
  cave: {
    backdrop: '#161A1E',
    mist: 'rgba(105, 145, 184, 0.08)',
    detail: 'rgba(181, 208, 230, 0.08)',
    terrainTop: '#4F5D67',
    terrainMid: '#353F47',
    terrainBottom: '#222A30',
  },
  nether: {
    backdrop: '#25110F',
    mist: 'rgba(214, 98, 72, 0.08)',
    detail: 'rgba(255, 170, 98, 0.08)',
    terrainTop: '#7A3E2D',
    terrainMid: '#4F221D',
    terrainBottom: '#311413',
  },
  overworld: {
    backdrop: '#172016',
    mist: 'rgba(145, 191, 94, 0.08)',
    detail: 'rgba(240, 239, 180, 0.07)',
    terrainTop: '#6F9F3C',
    terrainMid: '#4D6D2D',
    terrainBottom: '#3A2A1E',
  },
} as const;
```

```tsx
// src/components/ui/card.tsx
export function Card({ children, highlight = false, style, ...props }: CardProps) {
  return (
    <View style={[styles.base, highlight && styles.highlight, style]} {...props}>
      <View pointerEvents="none" style={[styles.innerStroke, highlight && styles.innerStrokeHighlight]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: radii.xl,
    borderWidth: 2,
    gap: appTheme.layout.screenGap,
    marginBottom: spacing.md,
    overflow: 'hidden',
    padding: spacing.lg,
    ...shadows.soft,
  },
  innerStroke: {
    bottom: 4,
    left: 4,
    position: 'absolute',
    right: 4,
    top: 4,
    borderColor: colors.surfaceAccent,
    borderRadius: radii.xl - 4,
    borderWidth: 1,
  },
  highlight: {
    backgroundColor: colors.surfaceAccent,
    borderColor: colors.borderFocus,
  },
  innerStrokeHighlight: {
    borderColor: 'rgba(255, 241, 176, 0.18)',
  },
});
```

```tsx
// src/components/ui/button.tsx
function BaseButton({ label, selected = false, style, variant, ...props }: ButtonProps & { variant: 'primary' | 'secondary' }) {
  const { disabled } = props;
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        styles.buttonFace,
        isPrimary ? styles.primary : styles.secondary,
        selected && styles.selected,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
      {...props}
    >
      <View pointerEvents="none" style={[styles.buttonLip, isPrimary ? styles.primaryLip : styles.secondaryLip]} />
      <Text
        numberOfLines={2}
        style={[
          styles.label,
          isPrimary ? styles.primaryLabel : styles.secondaryLabel,
          disabled && styles.disabledLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function PrimaryButton(props: ButtonProps) {
  return <BaseButton {...props} variant="primary" />;
}

export function SecondaryButton(props: ButtonProps) {
  return <BaseButton {...props} variant="secondary" />;
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 2,
    justifyContent: 'center',
    minHeight: appTheme.layout.controlHeight,
    minWidth: 0,
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    position: 'relative',
    ...shadows.block,
  },
  buttonFace: {
    borderColor: colors.borderStrong,
  },
  buttonLip: {
    bottom: 0,
    height: 8,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  primary: {
    backgroundColor: colors.highlight,
    borderColor: colors.borderFocus,
  },
  primaryLip: {
    backgroundColor: '#A27A24',
  },
  secondary: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
  },
  secondaryLip: {
    backgroundColor: colors.surfaceInset,
  },
  selected: {
    backgroundColor: colors.surfaceAccent,
    borderColor: colors.borderFocus,
  },
  pressed: {
    transform: [{ translateY: 2 }],
  },
  disabled: {
    borderColor: colors.border,
    boxShadow: 'none',
    opacity: 0.56,
  },
  disabledLabel: {
    color: colors.textMuted,
  },
  label: {
    flexShrink: 1,
    fontSize: typography.body,
    fontWeight: '800',
    letterSpacing: 0.2,
    lineHeight: 20,
    textAlign: 'center',
  },
  primaryLabel: {
    color: colors.canvas,
  },
  secondaryLabel: {
    color: colors.textPrimary,
  },
});
```

```tsx
// src/components/ui/stat-pill.tsx
export function StatPill({ label, value }: StatPillProps) {
  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.inset} />
      <Text numberOfLines={2} style={styles.label}>
        {label}
      </Text>
      <Text numberOfLines={2} style={styles.value}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceAccent,
    borderColor: colors.borderStrong,
    borderRadius: radii.lg,
    borderWidth: 2,
    flexShrink: 1,
    maxWidth: '100%',
    minWidth: 96,
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    position: 'relative',
  },
  inset: {
    bottom: 4,
    left: 4,
    position: 'absolute',
    right: 4,
    top: 4,
    borderColor: colors.surfaceInset,
    borderRadius: radii.lg - 4,
    borderWidth: 1,
  },
  label: {
    color: colors.textMuted,
    flexShrink: 1,
    fontSize: typography.micro,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  value: {
    color: colors.textPrimary,
    flexShrink: 1,
    fontSize: typography.caption,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    marginTop: 2,
  },
});
```

```tsx
// src/features/ui/badge-chip.tsx
return (
  <View style={[styles.container, styles.plate, { backgroundColor: style.backgroundColor, borderColor: style.borderColor }]}>
    {icon ? <Text style={[styles.icon, { color: style.color }]}>{iconMap[icon]}</Text> : null}
    <Text numberOfLines={2} style={[styles.label, { color: style.color }]}>
      {label}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    maxWidth: '100%',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  plate: {
    backgroundColor: colors.surfaceAccent,
    borderColor: colors.borderStrong,
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/ui-refresh.test.ts`

Expected: PASS with `2` passing tests and `0` failures.

- [ ] **Step 5: Commit**

```bash
git add tests/ui-refresh.test.ts src/theme/tokens.ts src/features/ui/theme-art.ts src/components/ui/card.tsx src/components/ui/button.tsx src/components/ui/stat-pill.tsx src/features/ui/badge-chip.tsx
git commit -m "feat: add blocky terrain visual primitives"
```

### Task 2: Rebuild World Background And Home Hero Composition

**Files:**
- Modify: `tests/ui-refresh.test.ts`
- Modify: `src/features/ui/world-background.tsx`
- Modify: `src/features/home/home-view.tsx`
- Modify: `src/features/home/difficulty-selector.tsx`
- Test: `tests/ui-refresh.test.ts`

- [ ] **Step 1: Write the failing test**

Append these tests to `tests/ui-refresh.test.ts`:

```ts
test('world background keeps terrain decoration behind a dedicated content shell', () => {
  const source = readFileSync(new URL('../src/features/ui/world-background.tsx', import.meta.url), 'utf8');

  assert.match(source, /pointerEvents="none"/);
  assert.match(source, /styles\\.layers/);
  assert.match(source, /styles\\.terrainTop/);
  assert.match(source, /styles\\.terrainMid/);
  assert.match(source, /styles\\.terrainBottom/);
  assert.match(source, /styles\\.contentShell/);
  assert.doesNotMatch(source, /styles\\.horizon/);
  assert.doesNotMatch(source, /styles\\.stripe/);
});

test('home hero separates summary copy from the control slab', () => {
  const source = readFileSync(new URL('../src/features/home/home-view.tsx', import.meta.url), 'utf8');

  assert.match(source, /styles\\.heroHeader/);
  assert.match(source, /styles\\.heroControlZone/);
  assert.match(source, /styles\\.heroMetaGrid/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/ui-refresh.test.ts`

Expected: FAIL because `world-background.tsx` still uses `horizon`/`stripe` and `home-view.tsx` does not yet define `heroHeader`, `heroControlZone`, or `heroMetaGrid`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/features/ui/world-background.tsx
export function WorldBackground({ children, style, variant, ...props }: WorldBackgroundProps) {
  const art = themeArt[variant];

  return (
    <View style={[styles.shell, { backgroundColor: art.backdrop }, style]} {...props}>
      <View pointerEvents="none" style={styles.layers}>
        <View style={[styles.mist, { backgroundColor: art.mist }]} />
        <View style={[styles.terrainTop, { backgroundColor: art.terrainTop }]} />
        <View style={[styles.terrainMid, { backgroundColor: art.terrainMid }]} />
        <View style={[styles.terrainBottom, { backgroundColor: art.terrainBottom }]} />
        <View style={[styles.detail, { backgroundColor: art.detail }]} />
      </View>
      <View style={styles.contentShell}>
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  layers: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  mist: {
    height: 120,
    opacity: 1,
    position: 'absolute',
    right: -30,
    top: -20,
    width: 140,
  },
  terrainTop: {
    bottom: 132,
    height: 22,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  terrainMid: {
    bottom: 72,
    height: 72,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  terrainBottom: {
    bottom: 0,
    height: 88,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  detail: {
    bottom: 104,
    height: 8,
    left: 0,
    opacity: 0.8,
    position: 'absolute',
    right: 0,
  },
  contentShell: {
    padding: 0,
    position: 'relative',
    zIndex: 1,
  },
  content: {
    gap: 0,
  },
});
```

```tsx
// src/features/home/home-view.tsx
<Card highlight style={styles.heroCard}>
  <WorldBackground style={styles.worldCard} variant="overworld">
    <View style={styles.heroHeader}>
      <Text style={styles.heroEyebrow}>{strings.modeSelectorCopy}</Text>
      <Text style={styles.heroTitle}>{strings.title.replace('{{name}}', nickname)}</Text>
      <Text style={styles.heroSubtitle}>{strings.primaryCardCopy}</Text>
      <BadgeChip icon="pickaxe" label={difficultyLabel} tone="warning" />
    </View>

    <View style={styles.heroControlZone}>
      <View style={styles.heroMetaGrid}>
        <StatPill label={strings.localeLabel} value={localeLabel} />
        <StatPill label={strings.modeLabel} value={modeLabel} />
        <StatPill label={strings.difficultySelectorLabel} value={difficultyLabel} />
      </View>
      <Text style={styles.selectorCopy}>{strings.difficultyHelper}</Text>
      <DifficultySelector
        label={strings.difficultySelectorLabel}
        onSelect={onSelectDifficulty}
        selectedDifficulty={selectedDifficulty}
        strings={difficultyStrings}
      />
      <PrimaryButton label={strings.primaryCardTitle} onPress={onPlaySolo} />
    </View>
  </WorldBackground>
</Card>

const styles = StyleSheet.create({
  heroHeader: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
    maxWidth: 720,
  },
  heroControlZone: {
    backgroundColor: colors.surfaceInset,
    borderColor: colors.borderStrong,
    borderRadius: radii.xl,
    borderWidth: 2,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  heroMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
```

```tsx
// src/features/home/difficulty-selector.tsx
const styles = StyleSheet.create({
  button: {
    flexBasis: 160,
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 52,
    minWidth: 0,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/ui-refresh.test.ts`

Expected: PASS with `4` passing tests and `0` failures.

- [ ] **Step 5: Commit**

```bash
git add tests/ui-refresh.test.ts src/features/ui/world-background.tsx src/features/home/home-view.tsx src/features/home/difficulty-selector.tsx
git commit -m "feat: split home hero into blocky terrain sections"
```

### Task 3: Apply The Same Slab Layout To Rooms And Results

**Files:**
- Modify: `tests/ui-refresh.test.ts`
- Modify: `src/features/rooms/room-lobby-view.tsx`
- Modify: `src/features/results/results-view.tsx`
- Test: `tests/ui-refresh.test.ts`

- [ ] **Step 1: Write the failing test**

Append these tests to `tests/ui-refresh.test.ts`:

```ts
test('room lobby and results screens use wrapped slabs for controls and rewards', () => {
  const roomSource = readFileSync(new URL('../src/features/rooms/room-lobby-view.tsx', import.meta.url), 'utf8');
  const resultsSource = readFileSync(new URL('../src/features/results/results-view.tsx', import.meta.url), 'utf8');

  assert.match(roomSource, /styles\\.heroHeader/);
  assert.match(roomSource, /styles\\.heroControlZone/);
  assert.match(roomSource, /styles\\.actionStack/);
  assert.match(resultsSource, /styles\\.heroSummary/);
  assert.match(resultsSource, /styles\\.actionStack/);
  assert.match(resultsSource, /styles\\.podiumRow/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/ui-refresh.test.ts`

Expected: FAIL because `room-lobby-view.tsx` and `results-view.tsx` do not yet expose `heroHeader`, `heroControlZone`, `heroSummary`, or `actionStack`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/features/rooms/room-lobby-view.tsx
<Card highlight>
  <WorldBackground style={styles.worldCard} variant="cave">
    <View style={styles.heroHeader}>
      <Text style={styles.eyebrow}>{strings.heroEyebrow}</Text>
      <Text style={styles.title}>{strings.title}</Text>
      <Text style={styles.subtitle}>{strings.subtitle}</Text>
      <BadgeChip icon="block" label={difficultyStrings[displayedDifficulty]} tone="warning" />
    </View>

    <View style={styles.heroControlZone}>
      <Text style={styles.helper}>{strings.difficultyHint}</Text>
      <DifficultySelector
        label={strings.difficultyLabel}
        onSelect={onSelectDifficulty}
        selectedDifficulty={displayedDifficulty}
        strings={difficultyStrings}
      />
    </View>
  </WorldBackground>
</Card>

<View style={styles.actionStack}>
  {isOfflineMode ? <PrimaryButton label={strings.addDemoPlayers} onPress={onAddDemoPlayers} /> : null}
  <SecondaryButton label={isBusy ? strings.loading : strings.toggleReady} onPress={onToggleReady} />
  <PrimaryButton disabled={isStartDisabled} label={isBusy ? strings.loading : roomActionLabel} onPress={onStartBattle} />
  <SecondaryButton label={strings.leaveRoom} onPress={onLeaveRoom} />
</View>

const styles = StyleSheet.create({
  heroHeader: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
    maxWidth: 720,
  },
  heroControlZone: {
    backgroundColor: colors.surfaceInset,
    borderColor: colors.borderStrong,
    borderRadius: radii.xl,
    borderWidth: 2,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  actionStack: {
    gap: spacing.sm,
  },
});
```

```tsx
// src/features/results/results-view.tsx
<Card highlight style={styles.hero}>
  <WorldBackground style={styles.worldCard} variant={badge.id === 'nether-pro-perfect' ? 'nether' : 'overworld'}>
    <View style={styles.heroHeader}>
      <Text style={styles.kicker}>{strings.subtitle}</Text>
      <Text style={styles.title}>{strings.title}</Text>
      <BadgeChip icon={badge.icon} label={badgeLabel} tone={badge.tone} />
    </View>

    <View style={styles.heroSummary}>
      <View style={styles.heroStats}>
        <StatPill label={strings.score} value={String(result.score)} />
        <StatPill label={strings.bestStreak} value={String(result.bestStreak)} />
        <StatPill label={strings.accuracyLabel} value={`${result.correctAnswers}/${result.questionCount}`} />
        <StatPill label={strings.difficulty} value={difficultyLabel} />
      </View>
      {result.roomCode ? <Text style={styles.roomCode}>{strings.roomCodePrefix} {result.roomCode}</Text> : null}
    </View>
  </WorldBackground>
</Card>

<View style={styles.actionStack}>
  <PrimaryButton label={strings.playAgain} onPress={onPlayAgain} />
  <SecondaryButton label={strings.backHome} onPress={onBackHome} />
</View>

const styles = StyleSheet.create({
  heroHeader: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  heroSummary: {
    backgroundColor: colors.surfaceInset,
    borderColor: colors.borderStrong,
    borderRadius: radii.xl,
    borderWidth: 2,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  actionStack: {
    gap: spacing.sm,
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/ui-refresh.test.ts`

Expected: PASS with `5` passing tests and `0` failures.

- [ ] **Step 5: Commit**

```bash
git add tests/ui-refresh.test.ts src/features/rooms/room-lobby-view.tsx src/features/results/results-view.tsx
git commit -m "feat: restyle rooms and results with block slabs"
```

### Task 4: Turn Onboarding Into A Block-Profile Entry Flow

**Files:**
- Modify: `tests/ui-refresh.test.ts`
- Modify: `src/features/onboarding/onboarding-view.tsx`
- Modify: `tests/localization-layout.test.ts`
- Test: `tests/ui-refresh.test.ts`
- Test: `tests/localization-layout.test.ts`

- [ ] **Step 1: Write the failing test**

Append this test to `tests/ui-refresh.test.ts`:

```ts
test('onboarding preview and option grids use block profile plates', () => {
  const source = readFileSync(new URL('../src/features/onboarding/onboarding-view.tsx', import.meta.url), 'utf8');

  assert.match(source, /styles\\.profilePlate/);
  assert.match(source, /styles\\.optionBlock/);
  assert.match(source, /styles\\.avatarCardActive/);
  assert.match(source, /styles\\.heroBlock/);
});
```

Add this assertion block to `tests/localization-layout.test.ts` inside `web layout source allows long translated labels to wrap instead of overlapping`:

```ts
  assert.match(onboardingSource, /styles\\.profilePlate/);
  assert.match(onboardingSource, /styles\\.optionBlock/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/ui-refresh.test.ts tests/localization-layout.test.ts`

Expected: FAIL because onboarding does not yet define `profilePlate` or `optionBlock`, and the updated overlap regression will not find those markers.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/features/onboarding/onboarding-view.tsx
<Card highlight style={styles.profilePlate}>
  <Text style={styles.previewEyebrow}>{strings.previewEyebrow}</Text>
  <View style={styles.previewRow}>
    <View style={[styles.previewBadge, { backgroundColor: selectedAvatar.color }]}>
      <Text style={styles.previewInitial}>{selectedAvatarLabel[0]}</Text>
    </View>
    <View style={styles.previewText}>
      <Text style={styles.previewTitle}>{strings.previewTitle}</Text>
      <Text style={styles.previewName}>{previewName}</Text>
      <Text style={styles.previewMeta}>
        {selectedAvatarLabel} • {strings.previewLanguageLabel}: {selectedLocaleLabel}
      </Text>
    </View>
  </View>
</Card>

<Card>
  <Text style={styles.sectionTitle}>{strings.languageLabel}</Text>
  <View style={styles.choiceGrid}>
    {localeOptions.map((option) => {
      const isActive = selectedLocale === option.value;
      return (
        <Pressable
          key={option.value}
          onPress={() => onSelectLocale(option.value)}
          style={[styles.optionBlock, isActive && styles.choiceChipActive]}
        >
          <Text style={[styles.choiceChipText, isActive && styles.choiceChipTextActive]}>
            {option.label}
          </Text>
        </Pressable>
      );
    })}
  </View>
</Card>

const styles = StyleSheet.create({
  profilePlate: {
    backgroundColor: colors.surfaceAccent,
  },
  optionBlock: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: radii.lg,
    borderWidth: 2,
    minWidth: 120,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  avatarCardActive: {
    backgroundColor: colors.surfaceAccent,
    borderColor: colors.borderFocus,
    transform: [{ translateY: -2 }],
  },
});
```

```ts
// tests/localization-layout.test.ts
assert.match(onboardingSource, /styles\\.profilePlate/);
assert.match(onboardingSource, /styles\\.optionBlock/);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/ui-refresh.test.ts tests/localization-layout.test.ts`

Expected: PASS with all `ui-refresh` and `localization-layout` tests green.

- [ ] **Step 5: Commit**

```bash
git add tests/ui-refresh.test.ts tests/localization-layout.test.ts src/features/onboarding/onboarding-view.tsx
git commit -m "feat: restyle onboarding as a block profile flow"
```

### Task 5: Full Verification And Export Check

**Files:**
- Modify: none
- Test: `tests/ui-refresh.test.ts`
- Test: `tests/localization-layout.test.ts`
- Test: `tests/app-shell.test.ts`
- Test: `tests/difficulty-flow.test.ts`

- [ ] **Step 1: Run focused UI regression suite**

Run: `npx tsx --test tests/ui-refresh.test.ts tests/localization-layout.test.ts tests/app-shell.test.ts tests/difficulty-flow.test.ts`

Expected: PASS with `0` failures and all new visual/layout regression tests green.

- [ ] **Step 2: Run full project verification**

Run: `npm run validate`

Expected: `npm test`, `npm run typecheck`, and `npx expo export --platform web` all succeed and finish with exit code `0`.

- [ ] **Step 3: Review the changed visual files before final handoff**

Run:

```bash
git diff -- src/theme/tokens.ts src/features/ui/theme-art.ts src/features/ui/world-background.tsx src/components/ui/card.tsx src/components/ui/button.tsx src/components/ui/stat-pill.tsx src/features/ui/badge-chip.tsx src/features/home/home-view.tsx src/features/home/difficulty-selector.tsx src/features/rooms/room-lobby-view.tsx src/features/results/results-view.tsx src/features/onboarding/onboarding-view.tsx tests/ui-refresh.test.ts tests/localization-layout.test.ts
```

Expected: Diff shows only the planned Minecraft-inspired visual system refresh and the overlap hardening changes.
