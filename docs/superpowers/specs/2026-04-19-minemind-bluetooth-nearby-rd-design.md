# MineMind Bluetooth And Nearby R&D Design

## Scope

This subproject is a research and prototyping track, not a guaranteed shipping feature.

Its purpose is to answer whether MineMind should ever support proximity-based multiplayer without LAN or an external backend.

This includes evaluating:

- Bluetooth LE based peer transport
- Google Nearby Connections
- Apple Multipeer Connectivity
- the Expo/native implications of each option

## Why This Is Separate

Bluetooth and nearby play are meaningfully different from both:

- Supabase-backed internet rooms
- LAN/hotspot classroom host mode

Treating them as a separate R&D track prevents the core roadmap from being blocked by native-transport uncertainty.

## Research Questions

1. Can the current Expo-based app support a stable proximity transport without abandoning the overall stack?
2. Is there one cross-platform abstraction worth shipping, or do Android and iOS need different native adapters?
3. Can the UX for discovery, pairing, and reconnect be simple enough for children in a classroom?
4. Is the battery/background/reliability cost justified compared with LAN host mode?

## Recommended Research Direction

Do not assume that one JavaScript Bluetooth library is the answer.

The recommended evaluation path is:

- `Android`: evaluate Nearby Connections first, BLE second
- `iOS`: evaluate Multipeer Connectivity first, BLE second
- `Cross-platform`: evaluate whether the product can hide platform differences behind one transport interface

The repository should not commit to a production Bluetooth stack until this R&D track proves viability.

## Success Criteria

This research track is successful if it produces a confident decision:

- `Go`: proximity transport is viable enough for a shipping roadmap
- `No-go`: LAN host mode should remain the only offline group mode

A successful outcome is not “we wrote some prototype code”. A successful outcome is “we know whether this should exist”.

## Prototype Requirements

The minimal prototype should prove:

- host can advertise
- client can discover or join
- a room can be formed
- a small message payload can be exchanged reliably
- a reconnect or disconnect outcome is understood

Target prototype scale:

- `2-4 devices`
- `Android-only`, `iOS-only`, and one mixed-platform check if feasible

## Product Rules

Even if the prototype works technically, it should still be rejected unless:

- join flow is simple enough for children
- pairing does not feel fragile
- support burden is acceptable
- performance is better enough than LAN host mode to justify the complexity

## Out Of Scope

- shipping a teacher-facing classroom product
- replacing online rooms
- public matchmaking
- making Expo Go support Bluetooth

## Acceptance Criteria

- a written decision record compares the shortlisted proximity transports
- a prototype build exists on real devices
- the prototype measures reliability, pairing friction, and reconnect behavior
- the team has a go/no-go decision grounded in evidence

## Risks And Mitigations

`Risk: native code explosion`
- Mitigation: constrain this work to a prototype namespace and an ADR before any core room refactor

`Risk: cross-platform mismatch`
- Mitigation: evaluate Android and iOS independently before promising one unified feature

`Risk: wasting time on the wrong offline mode`
- Mitigation: keep this track explicitly secondary to the LAN classroom host mode
