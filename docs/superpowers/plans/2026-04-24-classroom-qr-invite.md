# Classroom QR Invite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make local Classroom play practical for children by letting the host show a scannable QR invite, letting joiners enter from that deep link automatically, and auto-filling the host's LAN address when possible.

**Architecture:** Keep the existing TCP Classroom transport and invite-token contract. Add a small QR matrix helper plus a presentational QR component, use Expo Network only to resolve the host IPv4 address before advertising, and pass Expo Router search params into the lobby hook so scanned `minemind://classroom?...` links prefill the join form.

**Tech Stack:** Expo Router, React Native, TypeScript, Node test runner, `expo-network`, `qrcode-generator`, existing Classroom TCP transport.

---

## File Structure

- Modify `package.json` and `package-lock.json`: add `expo-network` and `qrcode-generator`.
- Modify `src/features/classroom/classroom-invite.ts`: keep token parsing and add `buildClassroomInviteQrMatrix`.
- Create `src/features/classroom/classroom-invite-qr.tsx`: render a QR matrix using React Native `View` blocks.
- Modify `src/features/classroom/use-classroom-lobby.ts`: accept initial invite input, prefill join fields, and resolve host IP with `Network.getIpAddressAsync()`.
- Modify `src/features/classroom/classroom-lobby-view.tsx`: show QR invite card for host sessions.
- Modify `app/classroom.tsx`: read deep-link search params and pass an initial invite token into the hook.
- Modify `src/i18n/resources.ts`: add Ukrainian, English, and Russian QR/invite helper copy.
- Modify `tests/classroom-invite.test.ts`: test QR matrix shape and deep-link token handling.
- Modify `tests/classroom-lobby.test.ts`: static tests for `expo-network`, deep-link params, and QR rendering.

## Task 1: Dependencies and Plan Commit

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `docs/superpowers/plans/2026-04-24-classroom-qr-invite.md`

- [ ] **Step 1: Install runtime dependencies**

Run:

```bash
npx expo install expo-network
npm install qrcode-generator
```

Expected: `package.json` includes `expo-network` and `qrcode-generator`; lockfile updates without changing Expo major versions.

- [ ] **Step 2: Verify dependency tree**

Run:

```bash
npm ls expo expo-network qrcode-generator
```

Expected: `expo@55.x`, `expo-network@55.x`, and `qrcode-generator@2.x` are installed.

- [ ] **Step 3: Commit plan and dependency baseline**

Run:

```bash
git add docs/superpowers/plans/2026-04-24-classroom-qr-invite.md package.json package-lock.json
git commit -m "chore: plan classroom qr invite flow"
```

Expected: a commit with the written plan and dependency metadata.

## Task 2: QR Matrix Contract

**Files:**
- Modify: `src/features/classroom/classroom-invite.ts`
- Test: `tests/classroom-invite.test.ts`

- [ ] **Step 1: Write the failing QR matrix test**

Add to `tests/classroom-invite.test.ts`:

```ts
test('buildClassroomInviteQrMatrix returns a scannable square matrix for invite tokens', () => {
  const token = buildClassroomInviteToken({
    hostAddress: '192.168.0.42',
    port: 36735,
    roomCode: 'CLASS1',
  });
  const matrix = buildClassroomInviteQrMatrix(token);

  assert.ok(matrix.size >= 21);
  assert.equal(matrix.cells.length, matrix.size);
  assert.equal(matrix.cells[0]?.length, matrix.size);
  assert.equal(matrix.cells[0]?.[0], true);
  assert.equal(matrix.cells[0]?.[matrix.size - 1], true);
  assert.equal(matrix.cells[matrix.size - 1]?.[0], true);
});
```

- [ ] **Step 2: Run the target test and verify RED**

Run:

```bash
npx tsx --test tests/classroom-invite.test.ts
```

Expected: FAIL because `buildClassroomInviteQrMatrix` is not exported.

- [ ] **Step 3: Implement the QR helper**

In `src/features/classroom/classroom-invite.ts`, import `qrcode-generator` and add:

```ts
import qrcode from 'qrcode-generator';

export type ClassroomInviteQrMatrix = {
  cells: boolean[][];
  size: number;
};

export function buildClassroomInviteQrMatrix(input: string): ClassroomInviteQrMatrix {
  const qr = qrcode(0, 'M');
  qr.addData(input);
  qr.make();

  const size = qr.getModuleCount();

  return {
    cells: Array.from({ length: size }, (_, rowIndex) =>
      Array.from({ length: size }, (_, columnIndex) => qr.isDark(rowIndex, columnIndex))
    ),
    size,
  };
}
```

- [ ] **Step 4: Run target test and verify GREEN**

Run:

```bash
npx tsx --test tests/classroom-invite.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/features/classroom/classroom-invite.ts tests/classroom-invite.test.ts
git commit -m "feat: build classroom qr invite matrix"
```

## Task 3: Deep-Link Autofill and Host IP Fallback

**Files:**
- Modify: `app/classroom.tsx`
- Modify: `src/features/classroom/use-classroom-lobby.ts`
- Test: `tests/classroom-lobby.test.ts`

- [ ] **Step 1: Write failing static tests**

Add to `tests/classroom-lobby.test.ts`:

```ts
test('classroom route passes scanned invite params into the lobby hook', () => {
  const source = readFileSync(new URL('../app/classroom.tsx', import.meta.url), 'utf8');

  assert.match(source, /useLocalSearchParams/);
  assert.match(source, /buildClassroomInviteToken/);
  assert.match(source, /initialInviteInput/);
});

test('classroom lobby resolves the host LAN address before advertising', () => {
  const source = readFileSync(new URL('../src/features/classroom/use-classroom-lobby.ts', import.meta.url), 'utf8');

  assert.match(source, /expo-network/);
  assert.match(source, /getIpAddressAsync/);
  assert.match(source, /0\.0\.0\.0/);
});
```

- [ ] **Step 2: Run target test and verify RED**

Run:

```bash
npx tsx --test tests/classroom-lobby.test.ts
```

Expected: FAIL because route params and `expo-network` are not wired.

- [ ] **Step 3: Wire route search params**

In `app/classroom.tsx`, import `useMemo`, `useLocalSearchParams`, and `buildClassroomInviteToken`. Build:

```ts
const params = useLocalSearchParams<{
  host?: string;
  port?: string;
  roomCode?: string;
}>();
const initialInviteInput = useMemo(() => {
  if (!params.host || !params.roomCode) {
    return null;
  }

  return buildClassroomInviteToken({
    hostAddress: String(params.host),
    port: params.port ? Number(params.port) : undefined,
    roomCode: String(params.roomCode),
  });
}, [params.host, params.port, params.roomCode]);
```

Pass it to `useClassroomLobby({ ..., initialInviteInput })`.

- [ ] **Step 4: Prefill join form and resolve host IP**

In `src/features/classroom/use-classroom-lobby.ts`, import Expo Network and extend messages with `initialInviteInput?: string | null`. Add a guarded effect:

```ts
useEffect(() => {
  if (classroomSession || !messages?.initialInviteInput) {
    return;
  }

  const parsedInvite = parseClassroomInviteInput(messages.initialInviteInput);

  if (!parsedInvite) {
    return;
  }

  setHostAddress(messages.initialInviteInput);
  setJoinCode(parsedInvite.roomCode ?? '');
}, [classroomSession, messages?.initialInviteInput]);
```

Add:

```ts
const resolveHostAddress = async () => {
  const manualAddress = hostAddress.trim();

  if (manualAddress) {
    return manualAddress;
  }

  const detectedAddress = await Network.getIpAddressAsync();

  return detectedAddress && detectedAddress !== '0.0.0.0' ? detectedAddress : undefined;
};
```

Use `const resolvedHostAddress = await resolveHostAddress();` in `handleHostSession`, store it in `HostSessionConfig.hostAddress`, and keep existing manual fallback behavior.

- [ ] **Step 5: Run target test and verify GREEN**

Run:

```bash
npx tsx --test tests/classroom-lobby.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add app/classroom.tsx src/features/classroom/use-classroom-lobby.ts tests/classroom-lobby.test.ts
git commit -m "feat: prefill classroom invites from qr links"
```

## Task 4: QR UI and Localized Copy

**Files:**
- Create: `src/features/classroom/classroom-invite-qr.tsx`
- Modify: `src/features/classroom/classroom-lobby-view.tsx`
- Modify: `app/classroom.tsx`
- Modify: `src/i18n/resources.ts`
- Test: `tests/classroom-lobby.test.ts`
- Test: `tests/localization-layout.test.ts`

- [ ] **Step 1: Write failing UI/static tests**

Add to `tests/classroom-lobby.test.ts`:

```ts
test('classroom host lobby renders a QR invite surface for nearby joiners', () => {
  const viewSource = readFileSync(new URL('../src/features/classroom/classroom-lobby-view.tsx', import.meta.url), 'utf8');

  assert.match(viewSource, /ClassroomInviteQr/);
  assert.match(viewSource, /inviteQrTitle/);
  assert.match(viewSource, /inviteQrHint/);
});
```

Add localization expectations in `tests/localization-layout.test.ts`:

```ts
assert.ok(resources.uk.translation.classroom.inviteQrTitle);
assert.ok(resources.en.translation.classroom.inviteQrTitle);
assert.ok(resources.ru.translation.classroom.inviteQrTitle);
```

- [ ] **Step 2: Run target tests and verify RED**

Run:

```bash
npx tsx --test tests/classroom-lobby.test.ts tests/localization-layout.test.ts
```

Expected: FAIL because QR UI and strings do not exist.

- [ ] **Step 3: Create QR component**

Create `src/features/classroom/classroom-invite-qr.tsx`:

```tsx
import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '../../theme/tokens';
import { buildClassroomInviteQrMatrix } from './classroom-invite';

type ClassroomInviteQrProps = {
  value: string;
};

export const ClassroomInviteQr = memo(function ClassroomInviteQr({ value }: ClassroomInviteQrProps) {
  const matrix = useMemo(() => buildClassroomInviteQrMatrix(value), [value]);

  return (
    <View
      accessibilityLabel="Classroom invite QR code"
      accessibilityRole="image"
      style={[
        styles.frame,
        {
          aspectRatio: 1,
          gridTemplateColumns: `repeat(${matrix.size}, 1fr)`,
        },
      ]}
    >
      {matrix.cells.flatMap((row, rowIndex) =>
        row.map((isDark, columnIndex) => (
          <View
            key={`${rowIndex}-${columnIndex}`}
            style={[styles.module, isDark ? styles.darkModule : styles.lightModule]}
          />
        ))
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  frame: {
    alignSelf: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: 6,
    borderWidth: 2,
    display: 'grid',
    maxWidth: 260,
    padding: 12,
    width: '100%',
  },
  module: {
    aspectRatio: 1,
  },
  darkModule: {
    backgroundColor: colors.textPrimary,
  },
  lightModule: {
    backgroundColor: colors.surfaceRaised,
  },
});
```

- [ ] **Step 4: Render QR invite and strings**

In `classroom-lobby-view.tsx`, import `ClassroomInviteQr`, add strings `inviteQrTitle` and `inviteQrHint`, then render the QR block before the text invite token:

```tsx
{inviteToken ? (
  <View style={styles.qrSurface}>
    <Text style={styles.sectionTitle}>{strings.inviteQrTitle}</Text>
    <Text style={styles.copy}>{strings.inviteQrHint}</Text>
    <ClassroomInviteQr value={inviteToken} />
  </View>
) : null}
```

In `src/i18n/resources.ts`, add:

```ts
inviteQrTitle: 'Скануй QR, щоб приєднатися',
inviteQrHint: 'Гравці поруч сканують цей код камерою телефону й відкривають MineMind.',
```

English:

```ts
inviteQrTitle: 'Scan to join',
inviteQrHint: 'Nearby players scan this code with the phone camera and open MineMind.',
```

Russian:

```ts
inviteQrTitle: 'Сканируй QR, чтобы присоединиться',
inviteQrHint: 'Игроки рядом сканируют этот код камерой телефона и открывают MineMind.',
```

- [ ] **Step 5: Run target tests and verify GREEN**

Run:

```bash
npx tsx --test tests/classroom-lobby.test.ts tests/localization-layout.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/features/classroom/classroom-invite-qr.tsx src/features/classroom/classroom-lobby-view.tsx app/classroom.tsx src/i18n/resources.ts tests/classroom-lobby.test.ts tests/localization-layout.test.ts
git commit -m "feat: show qr code for classroom invites"
```

## Task 5: Full Verification and Browser Smoke

**Files:**
- Verify all touched files.

- [ ] **Step 1: Run focused tests**

Run:

```bash
npx tsx --test tests/classroom-invite.test.ts tests/classroom-lobby.test.ts tests/localization-layout.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run full validation**

Run:

```bash
npm run validate
```

Expected: `npm test`, `tsc --noEmit`, and `expo export --platform web` pass.

- [ ] **Step 3: Browser smoke**

Serve the exported web bundle and open `/classroom?host=192.168.0.42&port=36735&roomCode=CLASS1`.

Expected:
- route renders without console errors;
- join form pre-fills the invite token and room code;
- host-session UI source includes QR rendering and does not overlap at the Classroom screen width.

- [ ] **Step 4: Commit any verification-only fixes**

If verification exposed fixes, commit them with:

```bash
git add <changed-files>
git commit -m "fix: stabilize classroom qr invite flow"
```

Expected: branch is clean after verification.
