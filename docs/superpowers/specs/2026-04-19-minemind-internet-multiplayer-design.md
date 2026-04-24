# MineMind Internet Multiplayer Design

## Scope

This subproject defines real private-room multiplayer over the internet using the existing Supabase-first architecture.

It turns the current partial live room path into a production-ready, server-authoritative multiplayer mode.

This design covers:

- private room creation and joining by code
- lobby readiness and participant sync
- server-authored round manifests
- authoritative answer submission and result finalization
- reconnect and recovery behavior

It does not cover public matchmaking, chat, or teacher tools.

## Current State

The repository already contains the right direction:

- Supabase auth bootstrap for guest sessions
- room-oriented Edge Functions
- room and round recovery paths
- local fallback when Supabase is not configured
- client services for create/join/ready/start/submit/finalize

The main limitation is maturity, not direction.

The current live path still leans on polling and does not yet give the app a confident realtime room experience.

## Product Goals

After this subproject:

- children can create a private room and invite others by code
- participants see lobby state update in near real time
- the server chooses the room round and final standings
- results survive reconnects and can be recovered after temporary disconnects
- online results are persisted as honest authoritative match records

## Recommended Technical Direction

Stay on Supabase.

Reasons:

- the current codebase already uses Supabase auth, functions, and contracts
- the repo already contains room functions and schema
- this minimizes migration cost and lets the team ship faster

## Authority Model

The server is authoritative for:

- room lifecycle status
- membership
- ready state
- selected round manifest
- accepted answers
- final rankings

The client is authoritative only for:

- local transient UI state
- optimistic loading indicators
- offline fallback when Supabase is not configured

## Data Model

Canonical persisted entities should be:

- `rooms`
- `room_participants`
- `room_rounds`
- `round_answers`
- `room_rankings` or `match_results`

The most important rule is that the client does not compute the official online final ranking from local guesses. It may show interim state, but the server produces the final result.

## Realtime Strategy

Use a layered realtime model:

1. `Postgres remains canonical`
   Functions write authoritative room and round state.

2. `Supabase Realtime Presence`
   Tracks who is currently connected to a room.

3. `Supabase Realtime Broadcast`
   Pushes low-latency room and round events such as `room-updated`, `round-started`, `answer-accepted`, `finalizing`, `completed`.

4. `Polling remains fallback only`
   Existing `get-room-state` polling stays as a resilience layer when the realtime channel is unavailable or resubscription fails.

## Room Lifecycle

Recommended statuses:

- `lobby`
- `active`
- `waiting`
- `finalizing`
- `finished`

Transitions:

- `create room` -> `lobby`
- `all required players ready + host starts` -> `active`
- `all answers submitted or timers exhausted` -> `waiting`
- `server computes rankings` -> `finalizing`
- `rankings persisted and recoverable` -> `finished`

## Recovery And Reliability

The system must support:

- rejoining the same room after app restart
- resuming an active round if `roundId` exists
- recovering a finalized room result if the client disconnected during `finalize-round`
- degrading from realtime to polling without breaking the match

## Security And Child Safety

- no public room discovery
- join by room code only
- anonymous guest auth is acceptable in V1
- no chat, direct messaging, or user-generated text beyond nicknames
- row-level access should be restricted to room members only

## Out Of Scope

- public matchmaking
- friends list
- chat or reactions
- spectator mode
- global competitive leaderboard
- classroom LAN transport

## Acceptance Criteria

- rooms can be created and joined through Supabase-backed flows
- lobby participant and ready state updates propagate without relying on 4-second polling as the primary mechanism
- official online results are server-authored and recoverable
- reconnecting clients can resume room state and round state
- online results are persisted into the shared `MatchRecord` model from subproject A

## Risks And Mitigations

`Risk: realtime instability`
- Mitigation: keep `get-room-state` as explicit fallback and resync path

`Risk: duplicate answer submissions`
- Mitigation: idempotent answer writes keyed by `round_id + player_id + question_id`

`Risk: partial finalize failures`
- Mitigation: persist room rankings before the room transitions to `finished`, and support replay-safe recovery APIs
