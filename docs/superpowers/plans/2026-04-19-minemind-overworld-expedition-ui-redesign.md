# MineMind Overworld Expedition UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign MineMind so the app feels like a Minecraft-inspired game journey with stronger atmosphere, clearer hierarchy, and distinct roles for solo, rooms, classroom, onboarding, and results.

**Architecture:** Implement the redesign in two waves. First, rebuild the shared visual foundation through tokens, surfaces, buttons, cards, and world backgrounds. Second, recompose the high-traffic screens on top of that foundation so each screen has a stronger emotional role and clearer CTA hierarchy without changing gameplay logic or backend contracts.

**Tech Stack:** Expo Router, React Native, TypeScript, Zustand, existing UI primitives, existing localization resources, `tsx --test`, `tsc --noEmit`, `expo export --platform web`

---

## File Structure

### Existing files to modify

- `src/theme/tokens.ts`
- `src/features/ui/theme-art.ts`
- `src/features/ui/world-background.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/stat-pill.tsx`
- `src/features/home/home-view.tsx`
- `src/features/home/difficulty-selector.tsx`
- `src/features/onboarding/onboarding-view.tsx`
- `src/features/results/results-view.tsx`
- `src/features/rooms/room-lobby-view.tsx`
- `src/features/classroom/classroom-lobby-view.tsx`
- `tests/ui-refresh.test.ts`
- `tests/localization-layout.test.ts`
- `tests/app-shell.test.ts`

### Optional focused split if needed during implementation

- Create: `src/features/ui/surface-variants.ts`
- Create: `src/features/home/home-hero-layout.tsx`

Only create these files if the current files become too crowded while implementing the approved design.

## Task 1: Rebuild The Shared Visual Foundation

**Files:**
- Modify: `src/theme/tokens.ts`
- Modify: `src/features/ui/theme-art.ts`
- Modify: `src/features/ui/world-background.tsx`
- Modify: `src/components/ui/card.tsx`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/stat-pill.tsx`
- Test: `tests/ui-refresh.test.ts`

- [ ] **Step 1: Write the failing foundation test**

```ts
test('visual foundation exposes overworld expedition materials and layered scene surfaces', () => {
  const tokensSource = readFileSync(new URL('../src/theme/tokens.ts', import.meta.url), 'utf8');
  const cardSource = readFileSync(new URL('../src/components/ui/card.tsx', import.meta.url), 'utf8');
  const buttonSource = readFileSync(new URL('../src/components/ui/button.tsx', import.meta.url), 'utf8');
  const worldSource = readFileSync(new URL('../src/features/ui/world-background.tsx', import.meta.url), 'utf8');

  assert.match(tokensSource, /grass|dirt|stone|ore|torch/i);
  assert.match(tokensSource, /hero|panel|utility/i);
  assert.match(cardSource, /scene|panel|utility/i);
  assert.match(buttonSource, /pressedFace|buttonRidge|expedition/i);
  assert.match(worldSource, /camp|stone-hall|reward|classroom/i);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsx --test tests/ui-refresh.test.ts`

Expected: FAIL because the current theme still uses the flatter green dashboard vocabulary and does not expose the new material/surface hierarchy.

- [ ] **Step 3: Implement the minimal visual foundation**

```ts
export const expeditionMaterials = {
  dirt: '#4B3827',
  grass: '#6FAF54',
  ore: '#D6B04A',
  stone: '#6E726B',
  torch: '#F2C35B',
} as const;

export const surfaceTiers = {
  hero: { base: '#1C2618', edge: '#31402A', inset: '#10150F' },
  panel: { base: '#20271E', edge: '#434A40', inset: '#121610' },
  utility: { base: 'rgba(255,255,255,0.06)', edge: 'rgba(255,255,255,0.16)' },
} as const;
```

```tsx
export function Card({ highlight = false, style, tone = 'panel', ...props }: CardProps) {
  return (
    <View
      style={[
        styles.base,
        styles[tone],
        highlight && styles.highlight,
        style,
      ]}
      {...props}
    />
  );
}
```

```tsx
<View style={[styles.layers, styles.campLayers]}>
  <View style={[styles.canopy, { backgroundColor: art.canopy }]} />
  <View style={[styles.terrainShelf, { backgroundColor: art.terrainShelf }]} />
  <View style={[styles.terrainBase, { backgroundColor: art.terrainBase }]} />
</View>
```

- [ ] **Step 4: Run focused verification**

Run: `npx tsx --test tests/ui-refresh.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/theme/tokens.ts src/features/ui/theme-art.ts src/features/ui/world-background.tsx src/components/ui/card.tsx src/components/ui/button.tsx src/components/ui/stat-pill.tsx tests/ui-refresh.test.ts
git commit -m "feat: rebuild expedition visual foundation"
```

## Task 2: Recompose Home Into An Expedition Board

**Files:**
- Modify: `src/features/home/home-view.tsx`
- Modify: `src/features/home/difficulty-selector.tsx`
- Modify: `tests/ui-refresh.test.ts`
- Modify: `tests/localization-layout.test.ts`
- Modify: `tests/app-shell.test.ts`

- [ ] **Step 1: Write the failing home composition test**

```ts
test('home view promotes solo as the dominant expedition path and demotes support routes', () => {
  const source = readFileSync(new URL('../src/features/home/home-view.tsx', import.meta.url), 'utf8');

  assert.match(source, /Expedition|hero/i);
  assert.match(source, /primaryRoute|soloRoute|expeditionLog/i);
  assert.match(source, /classroomCardTitle/);
  assert.match(source, /roomCardTitle/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsx --test tests/ui-refresh.test.ts tests/app-shell.test.ts`

Expected: FAIL because the current home screen still stacks equal-weight cards under one large green hero.

- [ ] **Step 3: Implement the minimal home recomposition**

```tsx
<View style={styles.routeBoard}>
  <Card style={styles.primaryRoute} tone="scene">
    <Text style={styles.routeEyebrow}>{strings.modeSelectorCopy}</Text>
    <Text style={styles.routeTitle}>{strings.primaryCardTitle}</Text>
    <PrimaryButton label={strings.primaryCardTitle} onPress={onPlaySolo} />
  </Card>

  <View style={styles.supportRoutes}>
    <Card style={styles.supportRoute} tone="panel">...</Card>
    <Card style={styles.supportRoute} tone="panel">...</Card>
  </View>
</View>

<Card style={styles.expeditionLog} tone="utility">...</Card>
```

```tsx
<DifficultySelector
  compact={false}
  label={strings.difficultySelectorLabel}
  ...
/>
```

- [ ] **Step 4: Run focused verification**

Run: `npx tsx --test tests/ui-refresh.test.ts tests/localization-layout.test.ts tests/app-shell.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/home/home-view.tsx src/features/home/difficulty-selector.tsx tests/ui-refresh.test.ts tests/localization-layout.test.ts tests/app-shell.test.ts
git commit -m "feat: turn home into expedition board"
```

## Task 3: Turn Onboarding Into Adventurer Setup

**Files:**
- Modify: `src/features/onboarding/onboarding-view.tsx`
- Modify: `tests/ui-refresh.test.ts`
- Modify: `tests/app-shell.test.ts`
- Modify: `tests/localization-layout.test.ts`

- [ ] **Step 1: Write the failing onboarding test**

```ts
test('onboarding presents the player setup as an adventurer creation flow instead of a plain form', () => {
  const source = readFileSync(new URL('../src/features/onboarding/onboarding-view.tsx', import.meta.url), 'utf8');

  assert.match(source, /setupStep|adventurer|profilePlate|optionGrid/);
  assert.match(source, /nicknameLabel/);
  assert.match(source, /languageLabel/);
  assert.match(source, /avatarLabel/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsx --test tests/ui-refresh.test.ts tests/app-shell.test.ts`

Expected: FAIL because the current onboarding still reads as a sequence of utility cards with a preview plate.

- [ ] **Step 3: Implement the minimal onboarding recomposition**

```tsx
<Card style={styles.setupStage} tone="scene">
  <Text style={styles.previewEyebrow}>{strings.previewEyebrow}</Text>
  <View style={styles.previewRow}>...</View>
</Card>

<View style={styles.setupSteps}>
  <Card style={styles.stepCard} tone="panel">...</Card>
  <Card style={styles.stepCard} tone="panel">...</Card>
  <Card style={styles.stepCard} tone="panel">...</Card>
</View>
```

```ts
stepCard: {
  borderLeftWidth: 4,
  paddingTop: spacing.lg,
}
```

- [ ] **Step 4: Run focused verification**

Run: `npx tsx --test tests/ui-refresh.test.ts tests/app-shell.test.ts tests/localization-layout.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/onboarding/onboarding-view.tsx tests/ui-refresh.test.ts tests/app-shell.test.ts tests/localization-layout.test.ts
git commit -m "feat: redesign onboarding as adventurer setup"
```

## Task 4: Turn Results Into Trophy Camp

**Files:**
- Modify: `src/features/results/results-view.tsx`
- Modify: `tests/ui-refresh.test.ts`
- Modify: `tests/localization-layout.test.ts`

- [ ] **Step 1: Write the failing results test**

```ts
test('results view stages the podium and trophy summary as a reward scene', () => {
  const source = readFileSync(new URL('../src/features/results/results-view.tsx', import.meta.url), 'utf8');

  assert.match(source, /trophy|podium|fieldNotes|heroSummary/i);
  assert.match(source, /participants\.slice\(0, 3\)/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsx --test tests/ui-refresh.test.ts`

Expected: FAIL because the current results page is stronger than before but still reads as a statistics summary rather than a trophy scene.

- [ ] **Step 3: Implement the minimal reward recomposition**

```tsx
<View style={styles.trophyHeader}>
  <BadgeChip icon={badge.icon} label={badgeLabel} tone={badge.tone} />
  <View style={styles.rewardStats}>...</View>
</View>

<View style={styles.podiumStage}>
  {matchRecord.participants.slice(0, 3).map(...)}
</View>

<Card style={styles.fieldNotes} tone="panel">...</Card>
```

- [ ] **Step 4: Run focused verification**

Run: `npx tsx --test tests/ui-refresh.test.ts tests/localization-layout.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/results/results-view.tsx tests/ui-refresh.test.ts tests/localization-layout.test.ts
git commit -m "feat: redesign results as trophy camp"
```

## Task 5: Recompose Rooms And Classroom As Team Hubs

**Files:**
- Modify: `src/features/rooms/room-lobby-view.tsx`
- Modify: `src/features/classroom/classroom-lobby-view.tsx`
- Modify: `tests/ui-refresh.test.ts`
- Modify: `tests/localization-layout.test.ts`
- Modify: `tests/classroom-lobby.test.ts`
- Modify: `tests/room-lobby.test.ts`

- [ ] **Step 1: Write the failing team-hub test**

```ts
test('room and classroom lobbies expose roster-first team hub layouts with strong ready summaries', () => {
  const roomSource = readFileSync(new URL('../src/features/rooms/room-lobby-view.tsx', import.meta.url), 'utf8');
  const classroomSource = readFileSync(new URL('../src/features/classroom/classroom-lobby-view.tsx', import.meta.url), 'utf8');

  assert.match(roomSource, /readySummary|participantList|roomCode/);
  assert.match(classroomSource, /readySummary|participantList|inviteToken/);
  assert.match(classroomSource, /disabled=\{isStartDisabled\}/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsx --test tests/ui-refresh.test.ts tests/classroom-lobby.test.ts tests/room-lobby.test.ts`

Expected: FAIL because both lobby screens still use the old card rhythm and do not yet share the new hub-oriented composition language.

- [ ] **Step 3: Implement the minimal team-hub recomposition**

```tsx
<Card style={styles.commandSurface} tone="scene">
  <Text style={styles.sectionTitle}>{strings.activeRoom}</Text>
  <Text style={styles.roomCode}>{activeRoom.roomCode}</Text>
  <Text style={styles.readySummary}>...</Text>
</Card>

<Card style={styles.rosterSurface} tone="panel">
  <View style={styles.participantList}>...</View>
</Card>
```

```tsx
<Card style={styles.classroomHub} tone="scene">
  <Text style={styles.roomCode}>{classroomSession.roomCode}</Text>
  <Text selectable style={styles.inviteToken}>{inviteToken}</Text>
  <Text style={styles.readySummary}>...</Text>
</Card>
```

- [ ] **Step 4: Run focused verification**

Run: `npx tsx --test tests/ui-refresh.test.ts tests/localization-layout.test.ts tests/classroom-lobby.test.ts tests/room-lobby.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/rooms/room-lobby-view.tsx src/features/classroom/classroom-lobby-view.tsx tests/ui-refresh.test.ts tests/localization-layout.test.ts tests/classroom-lobby.test.ts tests/room-lobby.test.ts
git commit -m "feat: redesign room and classroom hubs"
```

## Task 6: Run Full Verification And Polish

**Files:**
- Modify: any of the files above only if verification reveals regressions
- Test: `tests/ui-refresh.test.ts`
- Test: `tests/localization-layout.test.ts`
- Test: `tests/app-shell.test.ts`
- Test: `tests/classroom-lobby.test.ts`
- Test: `tests/room-lobby.test.ts`

- [ ] **Step 1: Run the focused UX regression suite**

Run: `npx tsx --test tests/ui-refresh.test.ts tests/localization-layout.test.ts tests/app-shell.test.ts tests/classroom-lobby.test.ts tests/room-lobby.test.ts`

Expected: PASS

- [ ] **Step 2: Run full validation**

Run: `npm run validate`

Expected: PASS with all tests green, `tsc --noEmit` green, and `expo export --platform web` completing successfully.

- [ ] **Step 3: Fix any final regressions discovered by validation**

```ts
// Keep fixes minimal and local.
// Prefer spacing, wrapping, hierarchy, and style corrections over structural rewrites.
```

- [ ] **Step 4: Re-run validation after fixes**

Run: `npm run validate`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/theme/tokens.ts src/features/ui/theme-art.ts src/features/ui/world-background.tsx src/components/ui/card.tsx src/components/ui/button.tsx src/components/ui/stat-pill.tsx src/features/home/home-view.tsx src/features/home/difficulty-selector.tsx src/features/onboarding/onboarding-view.tsx src/features/results/results-view.tsx src/features/rooms/room-lobby-view.tsx src/features/classroom/classroom-lobby-view.tsx tests/ui-refresh.test.ts tests/localization-layout.test.ts tests/app-shell.test.ts tests/classroom-lobby.test.ts tests/room-lobby.test.ts
git commit -m "feat: ship overworld expedition UI redesign"
```

## Self-Review

### Spec Coverage

- Visual foundation is covered by Task 1.
- Home recomposition is covered by Task 2.
- Onboarding recomposition is covered by Task 3.
- Results reward redesign is covered by Task 4.
- Rooms and classroom hub redesign are covered by Task 5.
- Layout, localization, and regression safety are covered by Task 6.

No spec requirement is left without an implementation task.

### Placeholder Scan

The plan contains no `TBD`, `TODO`, or “similar to Task N” placeholders. Each task includes exact files, example failing tests, exact commands, and minimal implementation direction.

### Type Consistency

- The plan keeps the current component file boundaries intact.
- The optional split files are explicitly marked optional and not referenced by later tasks as required dependencies.
- The tests and implementation snippets consistently refer to the approved concepts: expedition board, adventurer setup, trophy camp, team hub, and layered scene surfaces.
