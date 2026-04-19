# MineMind Classroom Local Host Mode Design

## Scope

This subproject defines a no-external-server classroom mode for local group play.

It is designed for the school scenario where one teacher or student device hosts the game and nearby devices join without using the internet.

This design explicitly chooses `LAN / hotspot / local Wi-Fi host mode` as the primary local multiplayer approach.

It does not use Bluetooth as the main transport.

## Why This Direction

For the MineMind stack, LAN host mode is more practical than Bluetooth because:

- one host can coordinate more players
- connection behavior is easier to reason about and debug
- room authority maps naturally to one host device
- the same room lifecycle model from online multiplayer can be reused

Bluetooth remains valuable as a future research track, but it should not be the first classroom shipping path.

## Product Goals

After this subproject:

- one device can create a classroom session without an external backend
- nearby devices on the same hotspot or local network can join by QR code or short session code
- the host device is authoritative for round selection, timing, and final standings
- the product still feels like the same MineMind room flow rather than a completely separate app

## Constraints

This mode is still native-mobile work.

Important constraint:

- it will not work in Expo Go
- it requires custom native code or native-capable transport libraries
- it requires explicit local-network permissions and custom dev builds

That is acceptable because this is a dedicated subproject, not a prototype-only shortcut.

## Recommended Architecture

### Authority

The host device is authoritative for:

- lobby membership
- room settings
- round manifest
- timer
- received answers
- final standings

Participant devices are thin clients that render the shared room state and send answer actions to the host.

### Transport

The recommended transport is:

- local hotspot or classroom Wi-Fi
- host exposes a local session endpoint
- participants connect using QR payload or manual code

The app should use one abstract transport boundary:

```ts
type LocalRoomTransport = {
  startHostSession: (config: HostSessionConfig) => Promise<HostSessionHandle>;
  joinHostSession: (payload: JoinPayload) => Promise<ClientSessionHandle>;
  stopSession: () => Promise<void>;
};
```

This boundary keeps the room domain model reusable even if the eventual local network library changes.

## Discovery

Primary discovery path:

- host shows QR code
- QR contains local address, port, session token, and room code

Fallback discovery path:

- manual room code plus local address hint

No automatic peer discovery is required in V1 of this subproject.

## UX Shape

The classroom flow should still feel like MineMind rooms:

- host creates local room
- participants join
- host sees presence and readiness
- host starts round
- participants answer simultaneously
- results show host-authoritative standings

The UI should explain that this is a `Local classroom session`, not an internet room.

## Data And Persistence

Classroom sessions do not require global backend persistence.

However, completed local-host matches should still be persisted into the shared `MatchRecord` model with:

- `mode: 'classroom'`
- `transport: 'lan-host'`
- `authority: 'host-device'`
- `syncStatus: 'local-only'`

## Out Of Scope

- Bluetooth-only play
- public internet play
- cross-school persistence
- teacher dashboards
- shared cloud leaderboards
- background/long-running host continuity across app termination

## Acceptance Criteria

- one device can host a local classroom session without Supabase
- nearby devices can join over hotspot or local Wi-Fi
- host device controls the room and final standings
- completed classroom sessions persist as truthful local match records
- UX clearly distinguishes local classroom mode from online rooms

## Risks And Mitigations

`Risk: Expo/native friction`
- Mitigation: treat this as a custom native build track from the start, not an Expo Go feature

`Risk: local network permissions and school device settings`
- Mitigation: provide explicit onboarding copy for host devices and manual connection fallback

`Risk: host disconnect ends the session`
- Mitigation: make this explicit in the UX and design around short classroom sessions rather than long resumable tournaments
