# MineMind QA Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the Android QA issues found on 2026-04-28: dependency health, Home CTA visibility, Solo readability/timing, Results background overlap, and slow local Android QA builds.

**Architecture:** Keep the current Expo Router and feature-module structure. Make small, testable UI and configuration changes in the existing screens/components instead of introducing a new design system. Preserve current content, localization, Supabase contracts, and quiz result semantics.

**Tech Stack:** Expo SDK 55, React Native 0.83, Expo Router, TypeScript, Node test runner via `tsx --test`, Android Gradle build, Expo Doctor.

---

## File Map

- Modify `package.json`: align Expo SDK patch dependencies and add Android QA scripts.
- Modify package lockfile after installing dependency changes.
- Modify `android/gradle.properties`: narrow or document dev ABI behavior if needed.
- Modify `src/features/home/home-view.tsx`: move the solo CTA into the first screen and reduce hero pressure.
- Modify `app/solo.tsx`: make answer options reachable before long fact/explanation content.
- Modify `src/features/quiz/use-solo-round.ts`: remove automatic next-question advance after answer reveal.
- Modify `src/features/results/results-view.tsx`: prevent decorative terrain from crossing the stats area.
- Modify `src/features/ui/world-background.tsx`: add an optional prop to disable or shrink terrain overlays for dense cards.
- Modify `tests/app-shell.test.ts`: assert explicit Next remains the only post-answer progression path.
- Modify `tests/ui-refresh.test.ts`: add source-level regression checks for Home, Solo, and Results layout contracts.
- Optionally modify `README.md` or `docs/09-test-plan.md`: document the Android QA command.

---

### Task 1: Fix Expo Dependency Health

**Files:**
- Modify: `package.json`
- Modify: package lockfile

- [ ] **Step 1: Update expected Expo SDK patch versions**

Use Expo's fixer so the versions match the currently installed SDK expectations:

```bash
npx expo install expo@~55.0.18 expo-dev-client@~55.0.28 expo-linking@~55.0.14 expo-router@~55.0.13 react-native@0.83.6
```

Expected: `package.json` and the lockfile change only in dependency metadata.

- [ ] **Step 2: Run Expo Doctor**

```bash
npx expo-doctor
```

Expected: the SDK patch mismatch and duplicate `@expo/log-box` issue are gone. If `react-native-tcp-socket` remains the only warning, continue to Step 3.

- [ ] **Step 3: Decide New Architecture risk**

If `react-native-tcp-socket` is still flagged as untested with New Architecture, choose one release-safe path:

```properties
# android/gradle.properties
newArchEnabled=false
```

Expected: `npx expo-doctor` no longer reports the New Architecture compatibility risk.

- [ ] **Step 4: Verify dependency changes**

```bash
npm test
npm run typecheck
npx expo export --platform web --output-dir /tmp/minemind-web-export
```

Expected: all commands pass.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json android/gradle.properties
git commit -m "chore: align Expo SDK dependency health"
```

---

### Task 2: Make Home Solo CTA Visible Immediately

**Files:**
- Modify: `src/features/home/home-view.tsx`
- Test: `tests/ui-refresh.test.ts`

- [ ] **Step 1: Add a failing source-level UI contract test**

In `tests/ui-refresh.test.ts`, add a test near the existing HomeView tests:

```ts
test('home view keeps the solo CTA in the first expedition card', () => {
  const source = readFileSync(new URL('../src/features/home/home-view.tsx', import.meta.url), 'utf8');
  const heroIndex = source.indexOf('<Card highlight style={styles.heroCard}');
  const soloButtonIndex = source.indexOf('<PrimaryButton label={strings.primaryCardTitle} onPress={onPlaySolo} />');
  const routeBoardIndex = source.indexOf('<View style={styles.routeBoard}>');

  assert.ok(heroIndex >= 0);
  assert.ok(soloButtonIndex > heroIndex);
  assert.ok(routeBoardIndex > soloButtonIndex, 'Solo CTA should appear before lower route board content');
});
```

- [ ] **Step 2: Run the new test and verify it fails**

```bash
npm test -- tests/ui-refresh.test.ts
```

Expected: FAIL because the solo CTA currently lives inside `routeBoard`, below the hero.

- [ ] **Step 3: Move the primary solo action into the hero**

In `src/features/home/home-view.tsx`, place the primary button immediately after the difficulty selector inside `heroControlZone`:

```tsx
<DifficultySelector
  label={strings.difficultySelectorLabel}
  onSelect={onSelectDifficulty}
  selectedDifficulty={selectedDifficulty}
  strings={difficultyStrings}
/>
<PrimaryButton label={strings.primaryCardTitle} onPress={onPlaySolo} />
```

Then remove the duplicate primary button from `primaryRoute`, or convert `primaryRoute` into a compact summary without a second CTA.

- [ ] **Step 4: Reduce hero vertical pressure**

In `src/features/home/home-view.tsx`, tighten `heroCard`, `worldCard`, and `heroControlZone` spacing by one token each where practical. Keep the difficulty selector, locale/mode metadata, and title visible.

- [ ] **Step 5: Verify Home UI tests**

```bash
npm test -- tests/ui-refresh.test.ts tests/home-honesty.test.ts tests/home-room-panel.test.ts
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/features/home/home-view.tsx tests/ui-refresh.test.ts
git commit -m "fix: surface solo play action on home"
```

---

### Task 3: Make Solo Questions Playable on Mobile

**Files:**
- Modify: `app/solo.tsx`
- Modify: `src/features/quiz/use-solo-round.ts`
- Test: `tests/app-shell.test.ts`
- Test: `tests/ui-refresh.test.ts`

- [ ] **Step 1: Add a failing test for manual post-answer progression**

In `tests/app-shell.test.ts`, update the existing explicit follow-up action test so it rejects auto-advance:

```ts
test('solo route keeps post-answer progression manual so facts remain readable', () => {
  const soloSource = readFileSync(new URL('../app/solo.tsx', import.meta.url), 'utf8');
  const roundSource = readFileSync(new URL('../src/features/quiz/use-solo-round.ts', import.meta.url), 'utf8');

  assert.match(soloSource, /round\.isRevealed \? \(/);
  assert.match(soloSource, /t\('solo\.next'\)/);
  assert.match(soloSource, /round\.goNext/);
  assert.doesNotMatch(roundSource, /autoAdvanceTimeoutRef\.current\s*=\s*setTimeout/);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

```bash
npm test -- tests/app-shell.test.ts
```

Expected: FAIL because `use-solo-round.ts` still starts `autoAdvanceTimeoutRef`.

- [ ] **Step 3: Remove post-answer auto-advance**

In `src/features/quiz/use-solo-round.ts`, delete both `autoAdvanceTimeoutRef.current = setTimeout(..., 1100)` blocks after answer submission. Keep `goNext()` available for the explicit button in `app/solo.tsx`.

- [ ] **Step 4: Simplify the timeout ref cleanup**

If `autoAdvanceTimeoutRef` is no longer used anywhere, remove:

```ts
const autoAdvanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
```

and remove the cleanup `useEffect` that clears it.

- [ ] **Step 5: Add a Solo layout contract test**

In `tests/ui-refresh.test.ts`, add:

```ts
test('solo screen renders answer options before the explanatory fact card', () => {
  const source = readFileSync(new URL('../app/solo.tsx', import.meta.url), 'utf8');
  const optionListIndex = source.indexOf('<View style={styles.optionList}>');
  const factCardIndex = source.indexOf('<Card style={styles.factCard}>');

  assert.ok(optionListIndex >= 0);
  assert.ok(factCardIndex > optionListIndex);
});
```

Expected: this should pass before and after the implementation, protecting the intended order.

- [ ] **Step 6: Reduce question card height**

In `app/solo.tsx`, keep timer and prompt in the question card, but ensure illustrations do not consume mobile height for every question. Use a smaller aspect ratio or max height:

```ts
questionIllustrationFrame: {
  aspectRatio: 16 / 7,
  maxHeight: 180,
  overflow: 'hidden',
  borderRadius: radii.lg,
},
questionPrompt: {
  color: colors.textPrimary,
  fontSize: typography.body,
  fontWeight: '800',
  lineHeight: 24,
},
```

Expected: on a 1080x2400 Android viewport, at least two answers are visible without scrolling on typical long prompts.

- [ ] **Step 7: Verify Solo tests**

```bash
npm test -- tests/app-shell.test.ts tests/ui-refresh.test.ts tests/solo-round.test.ts
```

Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add app/solo.tsx src/features/quiz/use-solo-round.ts tests/app-shell.test.ts tests/ui-refresh.test.ts
git commit -m "fix: keep solo questions readable and facts manual"
```

---

### Task 4: Stop Results Background From Crossing Stats

**Files:**
- Modify: `src/features/ui/world-background.tsx`
- Modify: `src/features/results/results-view.tsx`
- Test: `tests/ui-refresh.test.ts`

- [ ] **Step 1: Add a failing Results background contract test**

In `tests/ui-refresh.test.ts`, add:

```ts
test('results view disables terrain overlays in the dense summary hero', () => {
  const source = readFileSync(new URL('../src/features/results/results-view.tsx', import.meta.url), 'utf8');

  assert.match(source, /<WorldBackground[\s\S]*showTerrain=\{false\}/);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

```bash
npm test -- tests/ui-refresh.test.ts
```

Expected: FAIL because `WorldBackground` has no `showTerrain` prop yet.

- [ ] **Step 3: Add optional terrain control**

In `src/features/ui/world-background.tsx`, extend props:

```ts
type WorldBackgroundProps = ViewProps & {
  children: React.ReactNode;
  showTerrain?: boolean;
  variant: keyof typeof themeArt;
};
```

Update the component:

```tsx
export function WorldBackground({
  children,
  showTerrain = true,
  style,
  variant,
  ...props
}: WorldBackgroundProps) {
  const art = themeArt[variant];

  return (
    <View style={[styles.shell, { backgroundColor: art.backdrop }, style]} {...props}>
      {showTerrain ? (
        <View style={[styles.layers, styles.passThrough]}>
          <View style={[styles.mist, { backgroundColor: art.mist }]} />
          <View style={[styles.terrainTop, { backgroundColor: art.terrainTop }]} />
          <View style={[styles.terrainMid, { backgroundColor: art.terrainMid }]} />
          <View style={[styles.terrainBottom, { backgroundColor: art.terrainBottom }]} />
          <View style={[styles.detail, { backgroundColor: art.detail }]} />
        </View>
      ) : null}
      <View style={styles.contentShell}>{children}</View>
    </View>
  );
}
```

- [ ] **Step 4: Disable terrain in Results hero**

In `src/features/results/results-view.tsx`, pass:

```tsx
<WorldBackground
  showTerrain={false}
  style={styles.worldCard}
  variant={badge.id === 'nether-pro-perfect' ? 'nether' : 'reward'}
>
```

- [ ] **Step 5: Verify Results tests**

```bash
npm test -- tests/ui-refresh.test.ts tests/result-badges.test.ts tests/result-summary.test.ts tests/match-record.test.ts
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/features/ui/world-background.tsx src/features/results/results-view.tsx tests/ui-refresh.test.ts
git commit -m "fix: keep results stats unobstructed"
```

---

### Task 5: Add Fast Android QA Script

**Files:**
- Modify: `package.json`
- Optionally modify: `docs/09-test-plan.md`

- [ ] **Step 1: Add a package script for the emulator ABI**

In `package.json`, add:

```json
"android:qa": "cd android && ./gradlew :app:installDebug -PreactNativeArchitectures=arm64-v8a --console=plain"
```

Expected: local Android QA does not accidentally compile all ABIs.

- [ ] **Step 2: Document the command**

In `docs/09-test-plan.md`, add an Android QA note:

```md
### Android emulator smoke test

Use `npm run android:qa` for local emulator installs. It limits the native build to the emulator ABI and avoids the much slower all-ABI debug build.
```

- [ ] **Step 3: Verify the script starts**

```bash
npm run android:qa
```

Expected: if an emulator is available, install succeeds. If no emulator is running, Gradle should fail only at the install/device step, not at script parsing.

- [ ] **Step 4: Commit**

```bash
git add package.json docs/09-test-plan.md
git commit -m "chore: add fast Android QA install script"
```

---

### Task 6: Final Verification Pass

**Files:**
- No code files unless a previous task revealed a regression.

- [ ] **Step 1: Run full automated verification**

```bash
npm test
npm run typecheck
npx tsx scripts/validate-question-bank.ts
npx tsx scripts/validate-master-question-program.ts
npx expo-doctor
npx expo export --platform web --output-dir /tmp/minemind-web-export
```

Expected: all pass, or `expo-doctor` has only an explicitly accepted warning documented in the final notes.

- [ ] **Step 2: Run Android smoke test**

```bash
emulator -avd MineMind_API_35 -no-snapshot-load
npm run android:qa
npx expo start --dev-client --localhost --port 8081
adb reverse tcp:8081 tcp:8081
adb shell am start -a android.intent.action.VIEW -d "minemind://"
```

Expected: app launches into MineMind without a JS crash.

- [ ] **Step 3: Manually verify the four fixed screens**

Check on Android:

- Onboarding completes with a nickname.
- Home shows `Грати соло` without requiring scroll.
- Solo shows answer choices before the timer expires; after answering, the fact stays until tapping Next.
- Results stats have no decorative stripe crossing text/cards.

- [ ] **Step 4: Capture screenshots**

```bash
mkdir -p /tmp/minemind-qa-fixed
adb exec-out screencap -p > /tmp/minemind-qa-fixed/results.png
```

Expected: screenshots demonstrate the fixed Home, Solo, and Results layouts.

- [ ] **Step 5: Final commit or PR**

```bash
git status --short
git log --oneline -5
```

Expected: only planned commits are present and the worktree is clean.

---

## Self-Review

- Spec coverage: covers dependency health, Home CTA visibility, Solo answer accessibility, post-answer fact readability, Results background overlap, Android QA build speed, and final Android smoke testing.
- Placeholder scan: no task depends on TBD behavior; every task has concrete files, commands, and expected outcomes.
- Type consistency: `showTerrain?: boolean` is introduced in `WorldBackgroundProps` and consumed only by `ResultsView`; existing callers keep default behavior.
