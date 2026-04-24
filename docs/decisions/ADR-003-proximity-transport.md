# ADR-003: Proximity Transport Research Track

## Status
Accepted as an `R&D-only` decision for the current roadmap.

## Decision
MineMind will not commit to a production Bluetooth or nearby multiplayer stack in the main product roadmap yet.

Instead, proximity play will be handled as a separate prototype track with these rules:

- `Android` evaluates `Nearby Connections` first and `BLE` second
- `iOS` evaluates `Multipeer Connectivity` first and `BLE` second
- any production recommendation must come only after real-device evidence
- `LAN / hotspot host mode` remains the primary offline multiplayer direction until the prototype proves otherwise

## Why
- proximity transport is a native-capable problem, not a small extension of the existing Expo Go app
- Android and iOS do not offer the same nearby stack, so one "universal" abstraction cannot be assumed up front
- school/classroom use cares more about simple joining and reliable reconnects than about the transport being technically impressive
- the product already has a clearer offline path in `LAN / hotspot host mode`

## Evaluation Rubric
The prototype must be judged against:

- pairing friction for children and teachers
- reconnect behavior after temporary disconnects
- cross-platform viability
- background and battery constraints
- classroom usability with `2-4` real devices

## Consequences
- this work requires custom native development builds rather than Expo Go
- the roadmap can continue shipping `solo`, `online`, and `classroom host mode` without waiting for Bluetooth research
- the final product decision stays open until the prototype outcomes are recorded here

## Deferred Final Outcome
After the prototype sessions complete, this ADR must be updated with one of:

- `Go`: promote proximity multiplayer into a future product-planning track
- `No-go`: keep `LAN / hotspot host mode` as the only offline group mode
