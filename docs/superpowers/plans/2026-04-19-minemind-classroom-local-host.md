# MineMind Classroom Local Host Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a no-external-server classroom multiplayer mode where one device acts as the host authority and nearby devices join over hotspot or local Wi-Fi.

**Architecture:** Build a dedicated classroom transport boundary and keep it separate from Supabase. The host device owns the room lifecycle and round timing, participants connect over a local-network session, and completed classroom matches persist through the shared `MatchRecord` model with `transport: 'lan-host'`.

**Tech Stack:** Expo custom native builds, React Native, TypeScript, local network permissions, transport adapter abstraction, Zustand, existing room/quiz domain model

---

## File Structure

### Existing files to modify

- `app.json`
- `eas.json`
- `src/state/app-store.ts`
- `src/features/rooms/types.ts`
- `src/features/results/recover-room-result.ts`

### New files to create

- `app/classroom.tsx`
- `src/features/classroom/types.ts`
- `src/features/classroom/local-host-transport.ts`
- `src/features/classroom/use-classroom-lobby.ts`
- `src/features/classroom/use-classroom-round.ts`
- `src/features/classroom/classroom-lobby-view.tsx`
- `tests/classroom-transport.test.ts`
- `tests/classroom-lobby.test.ts`

## Task 1: Add The Classroom Domain Model And Truth Mapping

**Files:**
- Create: `src/features/classroom/types.ts`
- Modify: `src/features/rooms/types.ts`
- Modify: `src/features/results/recover-room-result.ts`
- Create: `tests/classroom-lobby.test.ts`

- [ ] **Step 1: Write the failing classroom-domain test**

```ts
test('classroom session records use host-device authority and lan-host transport', () => {
  const record = normalizeClassroomResult(sampleClassroomSummary);
  assert.equal(record.mode, 'classroom');
  assert.equal(record.transport, 'lan-host');
  assert.equal(record.authority, 'host-device');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/classroom-lobby.test.ts`

Expected: FAIL because no classroom domain exists yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export type ClassroomSession = {
  id: string;
  roomCode: string;
  role: 'host' | 'participant';
  status: 'lobby' | 'active' | 'finished';
  hostAddress?: string;
  participants: RoomParticipant[];
};
```

- [ ] **Step 4: Run focused verification**

Run: `npx tsx --test tests/classroom-lobby.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/classroom/types.ts src/features/rooms/types.ts src/features/results/recover-room-result.ts tests/classroom-lobby.test.ts
git commit -m "feat: add classroom host mode domain"
```

## Task 2: Introduce The Local Host Transport Boundary

**Files:**
- Create: `src/features/classroom/local-host-transport.ts`
- Create: `tests/classroom-transport.test.ts`
- Modify: `app.json`
- Modify: `eas.json`

- [ ] **Step 1: Write the failing transport test**

```ts
test('local host transport exposes start, join, publish, and close operations', () => {
  const transport = createLocalHostTransport(fakeRuntime);
  assert.ok(transport.startHostSession);
  assert.ok(transport.joinHostSession);
  assert.ok(transport.publishEvent);
  assert.ok(transport.close);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/classroom-transport.test.ts`

Expected: FAIL because no classroom transport boundary exists yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export type LocalHostTransport = {
  startHostSession: (config: HostSessionConfig) => Promise<HostSessionHandle>;
  joinHostSession: (payload: JoinPayload) => Promise<ClientSessionHandle>;
  publishEvent: (event: ClassroomTransportEvent) => Promise<void>;
  close: () => Promise<void>;
};
```

```json
{
  "build": {
    "classroom-dev": {
      "developmentClient": true,
      "distribution": "internal"
    }
  }
}
```

- [ ] **Step 4: Run focused verification**

Run: `npx tsx --test tests/classroom-transport.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/classroom/local-host-transport.ts tests/classroom-transport.test.ts app.json eas.json
git commit -m "feat: add classroom local transport boundary"
```

## Task 3: Build The Classroom Host And Join UX

**Files:**
- Create: `app/classroom.tsx`
- Create: `src/features/classroom/use-classroom-lobby.ts`
- Create: `src/features/classroom/classroom-lobby-view.tsx`
- Modify: `src/state/app-store.ts`
- Modify: `tests/classroom-lobby.test.ts`

- [ ] **Step 1: Write the failing route test**

```ts
test('classroom route offers host and join flows without Supabase', () => {
  const source = readFileSync(new URL('../app/classroom.tsx', import.meta.url), 'utf8');
  assert.match(source, /useClassroomLobby/);
  assert.match(source, /host session/i);
  assert.match(source, /join session/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/classroom-lobby.test.ts`

Expected: FAIL because the route and view do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```tsx
export default function ClassroomRoute() {
  const lobby = useClassroomLobby();
  return <ClassroomLobbyView {...lobby} />;
}
```

- [ ] **Step 4: Run focused verification**

Run: `npx tsx --test tests/classroom-lobby.test.ts tests/classroom-transport.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/classroom.tsx src/features/classroom/use-classroom-lobby.ts src/features/classroom/classroom-lobby-view.tsx src/state/app-store.ts tests/classroom-lobby.test.ts
git commit -m "feat: add classroom host and join flow"
```

## Task 4: Run Classroom Round Flow And Persist Results

**Files:**
- Create: `src/features/classroom/use-classroom-round.ts`
- Modify: `src/state/app-store.ts`
- Modify: `tests/classroom-lobby.test.ts`
- Modify: `tests/classroom-transport.test.ts`

- [ ] **Step 1: Write the failing round-flow test**

```ts
test('completed classroom rounds persist as local-only MatchRecords', () => {
  const record = finalizeClassroomRound(sampleRound, sampleParticipants);
  assert.equal(record.mode, 'classroom');
  assert.equal(record.syncStatus, 'local-only');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/classroom-lobby.test.ts tests/classroom-transport.test.ts`

Expected: FAIL because classroom round finalization is not wired yet.

- [ ] **Step 3: Write minimal implementation**

```ts
saveMatchRecord(
  normalizeMatchRecord({
    input: classroomResult,
    authority: 'host-device',
    isDemo: false,
    syncStatus: 'local-only',
    transport: 'lan-host',
  })
);
```

- [ ] **Step 4: Run focused verification**

Run: `npx tsx --test tests/classroom-lobby.test.ts tests/classroom-transport.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/classroom/use-classroom-round.ts src/state/app-store.ts tests/classroom-lobby.test.ts tests/classroom-transport.test.ts
git commit -m "feat: persist classroom host match records"
```

## Task 5: Run Native-Capable Verification

**Files:**
- Modify: none
- Test: `tests/classroom-lobby.test.ts`
- Test: `tests/classroom-transport.test.ts`

- [ ] **Step 1: Run focused suite**

Run: `npx tsx --test tests/classroom-lobby.test.ts tests/classroom-transport.test.ts`

Expected: PASS

- [ ] **Step 2: Build custom native artifacts**

Run:

```bash
npx expo prebuild
npx expo run:android
```

Expected: the classroom-enabled development build compiles with the required native permissions and transport bindings.

- [ ] **Step 3: Manual multi-device QA**

Run:

```bash
npx expo start --dev-client
```

Expected: one device can host, one or more nearby devices can join over local network, and a full round can complete.
