# MineMind Bluetooth And Nearby R&D Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce an evidence-based go/no-go decision for proximity multiplayer by prototyping Bluetooth/Nearby transports on real devices without blocking the main roadmap.

**Architecture:** Treat this as a contained prototype namespace with an ADR-driven outcome. Evaluate Android and iOS proximity transports separately, hide them behind one experimental transport interface, and only recommend productization if the real-device prototype beats the LAN host mode on simplicity and reliability.

**Tech Stack:** Expo custom native code, development builds, platform-native proximity frameworks, prototype transport adapter, ADR documentation

---

## File Structure

### Existing files to modify

- `app.json`
- `eas.json`

### New files to create

- `docs/decisions/ADR-003-proximity-transport.md`
- `src/features/proximity/types.ts`
- `src/features/proximity/prototype-transport.ts`
- `src/features/proximity/prototype-screen.tsx`
- `tests/proximity-transport.test.ts`

## Task 1: Write The Decision Matrix And Prototype Contract

**Files:**
- Create: `docs/decisions/ADR-003-proximity-transport.md`
- Create: `src/features/proximity/types.ts`
- Create: `tests/proximity-transport.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
test('proximity transport contract supports advertise, browse, connect, send, and disconnect', () => {
  const transport = createPrototypeTransport(fakeRuntime);
  assert.ok(transport.advertise);
  assert.ok(transport.browse);
  assert.ok(transport.connect);
  assert.ok(transport.send);
  assert.ok(transport.disconnect);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/proximity-transport.test.ts`

Expected: FAIL because the experimental transport contract does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export type ProximityTransport = {
  advertise: () => Promise<void>;
  browse: () => Promise<void>;
  connect: (peerId: string) => Promise<void>;
  send: (payload: Uint8Array) => Promise<void>;
  disconnect: () => Promise<void>;
};
```

- [ ] **Step 4: Run focused verification**

Run: `npx tsx --test tests/proximity-transport.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add docs/decisions/ADR-003-proximity-transport.md src/features/proximity/types.ts tests/proximity-transport.test.ts
git commit -m "docs: add proximity transport decision matrix"
```

## Task 2: Prepare Custom Native Prototype Builds

**Files:**
- Modify: `app.json`
- Modify: `eas.json`

- [ ] **Step 1: Write the failing environment expectation**

```ts
test('proximity prototype is marked as custom-native-only work', () => {
  const source = readFileSync(new URL('../app.json', import.meta.url), 'utf8');
  assert.match(source, /plugins/);
});
```

- [ ] **Step 2: Run test to verify it fails if needed**

Run: `npx tsx --test tests/proximity-transport.test.ts`

Expected: update only if a config assertion is added; otherwise use this step as the red/green checkpoint before adding native prototype config.

- [ ] **Step 3: Write minimal implementation**

```json
{
  "build": {
    "proximity-dev": {
      "developmentClient": true,
      "distribution": "internal"
    }
  }
}
```

- [ ] **Step 4: Run native preparation**

Run:

```bash
npx expo prebuild
npx expo run:android
```

Expected: a custom development build is produced for the prototype track.

- [ ] **Step 5: Commit**

```bash
git add app.json eas.json
git commit -m "chore: prepare custom build profile for proximity prototype"
```

## Task 3: Build A Minimal 2-Device Prototype Screen

**Files:**
- Create: `src/features/proximity/prototype-transport.ts`
- Create: `src/features/proximity/prototype-screen.tsx`
- Modify: `tests/proximity-transport.test.ts`

- [ ] **Step 1: Write the failing prototype-screen test**

```ts
test('prototype screen exposes advertise, browse, connect, and send actions', () => {
  const source = readFileSync(new URL('../src/features/proximity/prototype-screen.tsx', import.meta.url), 'utf8');
  assert.match(source, /Advertise/);
  assert.match(source, /Browse/);
  assert.match(source, /Connect/);
  assert.match(source, /Send test payload/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/proximity-transport.test.ts`

Expected: FAIL because the prototype screen and transport adapter do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```tsx
export function ProximityPrototypeScreen() {
  return (
    <View>
      <Button title="Advertise" onPress={advertise} />
      <Button title="Browse" onPress={browse} />
      <Button title="Connect" onPress={connect} />
      <Button title="Send test payload" onPress={sendPayload} />
    </View>
  );
}
```

- [ ] **Step 4: Run focused verification**

Run: `npx tsx --test tests/proximity-transport.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/proximity/prototype-transport.ts src/features/proximity/prototype-screen.tsx tests/proximity-transport.test.ts
git commit -m "feat: add proximity prototype screen"
```

## Task 4: Run Real-Device Evaluation And Publish ADR Outcome

**Files:**
- Modify: `docs/decisions/ADR-003-proximity-transport.md`

- [ ] **Step 1: Capture evaluation rubric in the ADR**

```md
- pairing friction
- reconnect behavior
- cross-platform viability
- battery/background constraints
- classroom usability
```

- [ ] **Step 2: Run manual prototype sessions**

Run:

```bash
npx expo start --dev-client
```

Expected: complete at least one `Android-only`, one `iOS-only` if available, and one mixed-device experiment if feasible.

- [ ] **Step 3: Record go/no-go decision**

```md
Decision:
- Go: continue to feature planning
or
- No-go: keep LAN host mode as the only offline group direction
```

Expected: ADR contains a final decision, not an unresolved note.
