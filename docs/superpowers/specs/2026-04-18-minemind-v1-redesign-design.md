# MineMind V1 Redesign And Hardening Design

## Scope

This document is an autonomous audit and redesign specification for `MineMind`, based on the current codebase, product docs, and verified project behavior as of `2026-04-18`.

The goal is not to restart the app from zero. The goal is to turn the current working prototype into a coherent V1 experience that feels child-friendly, ship-shaped, and technically stable across onboarding, solo play, results, and private rooms.

## Current State Summary

The project already has a useful base:

- Expo Router app shell with working route flow
- guest onboarding with nickname validation
- solo question loop with scoring
- room flow with offline fallback and Supabase integration path
- localization for `uk`, `en`, and `ru`
- unit coverage for core pure functions
- successful `npm test`, `npm run typecheck`, and `npm run validate`

The problem is not "the app does not work". The problem is that the user experience, copy, information hierarchy, and code boundaries still feel like a scaffolded prototype rather than a confident V1 product.

## Audit Findings

### Product And UX Findings

1. The app speaks like an internal milestone tracker instead of a kid-facing game.
   Evidence:
   - [src/i18n/resources.ts](~/Documents/Work/minecraft_victorine/src/i18n/resources.ts:47)
   - [src/i18n/resources.ts](~/Documents/Work/minecraft_victorine/src/i18n/resources.ts:84)
   - [src/i18n/resources.ts](~/Documents/Work/minecraft_victorine/src/i18n/resources.ts:112)

   Terms like `NEXUS Phase 2`, `Phase 3 queued`, `offline-ready preview`, `Supabase scaffold`, `room battle`, and `demo players` leak development context into the product. That breaks immersion and trust, especially for children and parents.

2. The home screen is informative but not motivational.
   Evidence:
   - [app/home.tsx](~/Documents/Work/minecraft_victorine/app/home.tsx:29)

   The screen contains cards and stats, but it does not strongly answer "what should I do next?" It lacks a clear primary action hierarchy, seasonal energy, progress framing, or reward anticipation.

3. The current UX is visually consistent but not distinct.
   Evidence:
   - [src/theme/tokens.ts](~/Documents/Work/minecraft_victorine/src/theme/tokens.ts:1)
   - [src/components/ui/card.tsx](~/Documents/Work/minecraft_victorine/src/components/ui/card.tsx:1)

   The visual language is competent dark-glass UI, but it does not yet feel intentionally Minecraft-first, playful, or memorable. The app reads more like a SaaS dashboard than a children's battle quiz.

4. The quiz loop is functional, but the emotional pacing is shallow.
   Evidence:
   - [app/solo.tsx](~/Documents/Work/minecraft_victorine/app/solo.tsx:315)

   The user sees prompt, options, fact, and skip. There is no real pre-round anticipation, no answer feedback choreography, no progress reward cadence, and no satisfying transition into results.

5. The rooms screen is framed as "future work" even though room logic already exists.
   Evidence:
   - [app/rooms.tsx](~/Documents/Work/minecraft_victorine/app/rooms.tsx:203)
   - [app/rooms.tsx](~/Documents/Work/minecraft_victorine/app/rooms.tsx:283)

   This makes the product feel unfinished even when it is capable of meaningful room flows in offline/demo mode and via the live integration path.

6. There is a direct product inconsistency between docs and UI.
   Evidence:
   - [docs/02-game-design.md](~/Documents/Work/minecraft_victorine/docs/02-game-design.md:10)
   - [app/home.tsx](~/Documents/Work/minecraft_victorine/app/home.tsx:54)

   The game design says one round is `8` questions, while the home screen stat chip currently shows `12`.

### Architecture And Implementation Findings

1. Route files carry too much orchestration logic.
   Evidence:
   - [app/solo.tsx](~/Documents/Work/minecraft_victorine/app/solo.tsx:25)
   - [app/rooms.tsx](~/Documents/Work/minecraft_victorine/app/rooms.tsx:25)

   Fetching, fallback logic, timers, mutations, state transitions, and rendering are all mixed in the route components. This slows down redesign work and makes regressions more likely.

2. The app provides React Query globally but does not actually use it for remote state.
   Evidence:
   - [app/_layout.tsx](~/Documents/Work/minecraft_victorine/app/_layout.tsx:21)

   This means the code pays the complexity cost of a data client without getting standardized loading, retry, cache, or mutation ergonomics.

3. The screen primitive ignores bottom safe-area handling and Expo's preferred scroll behavior.
   Evidence:
   - [src/components/ui/screen.tsx](~/Documents/Work/minecraft_victorine/src/components/ui/screen.tsx:20)

   Only top/left/right safe-area edges are applied. On modern phones this risks bottom CTA crowding and weak native polish.

4. The navigation shell suppresses headers globally.
   Evidence:
   - [app/_layout.tsx](~/Documents/Work/minecraft_victorine/app/_layout.tsx:23)

   This removes native hierarchy, titles, and back affordances and forces each screen to shoulder too much of its own framing inside the page body.

5. Polling is used for room refresh instead of the intended realtime model.
   Evidence:
   - [app/rooms.tsx](~/Documents/Work/minecraft_victorine/app/rooms.tsx:48)
   - [docs/03-architecture.md](~/Documents/Work/minecraft_victorine/docs/03-architecture.md:11)

   A 4-second poll is acceptable as a fallback, but it is not aligned with the stated realtime product promise.

6. API contracts are trusted without schema validation despite `zod` already being installed.
   Evidence:
   - [src/lib/supabase.ts](~/Documents/Work/minecraft_victorine/src/lib/supabase.ts:40)
   - [package.json](~/Documents/Work/minecraft_victorine/package.json:30)

   That increases runtime fragility and makes backend changes harder to detect early.

7. User-facing error copy often surfaces raw implementation errors.
   Evidence:
   - [app/onboarding.tsx](~/Documents/Work/minecraft_victorine/app/onboarding.tsx:55)
   - [app/rooms.tsx](~/Documents/Work/minecraft_victorine/app/rooms.tsx:109)
   - [app/solo.tsx](~/Documents/Work/minecraft_victorine/app/solo.tsx:98)

   This is fine for development, but not for a child-facing V1.

### Content, Localization, And QA Findings

1. Localization is broad but not productized.
   Evidence:
   - [src/i18n/resources.ts](~/Documents/Work/minecraft_victorine/src/i18n/resources.ts:15)

   The app is translated, but the tone is inconsistent across languages and still contains many English or internal dev terms in Ukrainian and Russian.

2. Automated tests cover logic but not experience-critical flows.
   Evidence:
   - [tests/nickname.test.ts](~/Documents/Work/minecraft_victorine/tests/nickname.test.ts:1)
   - [tests/quiz-service.test.ts](~/Documents/Work/minecraft_victorine/tests/quiz-service.test.ts:1)
   - [tests/room-flow.test.ts](~/Documents/Work/minecraft_victorine/tests/room-flow.test.ts:1)

   There are no tests for route decisions, timer progression, persistence hydration, localization layout pressure, or Supabase contract parsing.

3. Validation is currently web-centric.
   Evidence:
   - [package.json](~/Documents/Work/minecraft_victorine/package.json:11)

   `validate` proves logic, types, and web export, but it does not prove mobile runtime quality on iOS or Android.

## Design Alternatives

### Option A: Surface Polish Only

Keep the current architecture and only refresh copy, cards, colors, and typography.

Pros:
- fastest
- lowest code churn
- limited regression risk

Cons:
- keeps route complexity
- does not fix conceptual product tone
- likely produces a prettier prototype instead of a real V1

### Option B: UX-First Productization With Targeted Refactor

Redesign the shell, copy, screen hierarchy, and game feedback loop while splitting route logic into focused feature hooks/services. Keep the current route map and domain model.

Pros:
- strongest improvement per week of work
- preserves working core flows
- unlocks cleaner iteration for content and multiplayer
- supports a true V1 feel without a rewrite

Cons:
- touches many screens
- requires coordinated copy, design, and state work

### Option C: Architecture-First Rewrite

Rebuild the app shell around stricter state machines, query hooks, component system, and realtime-first room architecture before redesigning visuals.

Pros:
- best long-term structure
- easier future scale

Cons:
- slower path to visible product improvement
- high rewrite risk
- wrong order for this codebase because the user-facing product shape is still underdefined

## Recommended Direction

Choose **Option B: UX-first productization with targeted refactor**.

That means:

- keep the current product scope
- keep Expo Router, Zustand, React Query, and Supabase
- keep solo + rooms as the V1 shape
- redesign the product voice and visual system
- reorganize route logic into smaller hooks and feature UI sections
- harden network and state boundaries where they directly support UX reliability

This is the "better and cooler" path because it produces visible product lift quickly without paying rewrite tax.

## Target Product Direction

### Experience Pillars

1. `Fast start`
   A child should get from cold open to first meaningful action in under 30 seconds.

2. `Battle energy`
   The app should feel like a match, not like a form flow plus static cards.

3. `Safe by default`
   Parents should understand privacy posture without reading docs, and errors should stay calm and friendly.

4. `Offline confidence`
   Demo or offline mode should feel intentional, not like degraded infrastructure.

5. `Room-ready foundation`
   Rooms should feel like a real mode in staging, not a dev placeholder.

## UX Redesign Specification

### App Shell

- Restore native stack titles and per-screen navigation options.
- Move away from body-only headings as the sole hierarchy signal.
- Update the base `Screen` primitive to support bottom safe area, content inset behavior, and sticky bottom CTA patterns.
- Introduce a clearer spacing and type scale with larger "hero" moments only where they matter.

### Visual System

- Keep the dark base, but shift from "generic glass dashboard" to "playful battle arena".
- Use stronger contrast between primary actions and secondary surfaces.
- Introduce Minecraft-adjacent cues through blocky rhythm, terrain-inspired color accents, score bursts, and trophy/reward motifs without becoming a literal game clone.
- Define state colors for `idle`, `selected`, `correct`, `wrong`, `waiting`, and `celebration`.

### Onboarding

Current problem:
- functionally correct, emotionally flat
- feels like setup instead of entering a game

Redesign:
- one focused hero moment
- concise trust copy for parents
- nickname, avatar, and language selection grouped into a tighter flow
- instant preview of selected avatar + nickname card
- CTA copy reframed around entering the arena, not generic continuation

### Home

Current problem:
- too many neutral cards
- unclear primary journey

Redesign:
- one dominant hero card with clear primary CTA: `Play Solo`
- one compact secondary path for `Friends Room`
- recent result and streak displayed as reward memory, not admin stats
- offline/live status reframed as player-safe mode copy, not infrastructure state
- leaderboard preview either becomes a playful "Top builders this week" moment or is cut from V1 if it stays fake

### Solo Match

Current problem:
- good mechanics, weak drama
- state logic and UI are tightly coupled

Redesign:
- compact pre-question header with progress + timer urgency
- larger question surface
- stronger answer state choreography
- explanation panel becomes a reveal moment, not static filler
- optional micro-transition between questions
- result handoff should feel earned

### Results

Current problem:
- useful stats, low emotional payoff

Redesign:
- stronger podium composition
- primary reward summary: score, streak, accuracy
- explanation insights framed as "cool facts you unlocked"
- clear next actions: replay, home, room replay where relevant

### Rooms

Current problem:
- screen copy undermines the feature
- state is real enough to deserve product framing

Redesign:
- frame rooms as `Play with friends`
- lobby should feel alive even in offline/demo mode
- ready state should be visually obvious
- room code should be copy-friendly and visually dominant
- replace "next wave" copy with trust-building expectations when a capability is unavailable

## Technical Design Direction

### Route Composition

Each route should become a thin composition layer.

Create or expand feature-local modules for:

- `src/features/onboarding/*`
- `src/features/home/*`
- `src/features/quiz/*`
- `src/features/rooms/*`
- `src/features/results/*`

Responsibilities:

- route file: navigation wiring and screen composition
- hooks/view-models: async orchestration and derived view state
- presentational sections/components: layout and rendering
- services: Supabase/offline data access

### State Design

Keep Zustand for app session state, but reduce what routes manipulate directly.

Recommendations:

- persist profile and durable user preferences
- treat active round progress as a dedicated feature state instead of ad-hoc route state
- normalize room session state so resume/rejoin behavior is explicit
- avoid persisting stale transient flags that should reset on app relaunch

### Data And Network Boundaries

- keep offline fallback as a first-class path
- introduce `zod` parsing for Supabase function responses
- map backend errors to product-safe localized messages
- use React Query for remote reads/mutations where retry/caching helps UX
- keep polling as a fallback, but prepare a realtime adapter boundary for rooms

### Localization Strategy

- rewrite player-facing copy to sound intentional in each language
- remove internal dev vocabulary from product strings
- centralize tone decisions: playful, short, clear, non-technical
- add a localization QA pass for line length and CTA consistency

### Testing Strategy

Expand beyond pure function tests:

- route-level behavior tests
- view-model tests for quiz and rooms flows
- parsing tests for Supabase payload validators
- persistence hydration tests for app store
- localization snapshot or string coverage checks for critical screens

Manual QA expectations before calling the redesign complete:

- onboarding on small phone viewport
- solo match with correct, wrong, and timeout paths
- room create/join/ready/start in offline mode
- live Supabase happy path smoke test
- iOS and Android runtime pass, not web only

## Non-Goals

- public matchmaking
- chat
- monetization
- profile photo uploads
- broad content authoring tooling
- engine-level rewrite

## Implementation Shape

The work should be delivered in four product-facing phases:

1. `Foundation`
   App shell, navigation, design tokens, and reusable primitives

2. `Core Experience`
   Onboarding, home, solo, and results redesign

3. `Rooms Productization`
   Room UX rewrite, better state modeling, and safer live/offline messaging

4. `Hardening`
   copy QA, contract validation, deeper tests, and device verification

## Success Criteria

This redesign is successful when:

- the app no longer exposes internal milestone language to players
- the primary solo loop feels polished and motivating
- rooms feel like a real mode even before full realtime maturity
- screen files are thinner and easier to evolve
- backend failures surface as calm, localized UX
- the build remains green while test coverage grows around real flows

## Risks And Mitigations

- Risk: visual redesign drifts too far from current implementation pace.
  Mitigation: keep route map and domain model stable while redesigning interaction layers.

- Risk: rooms complexity expands the scope.
  Mitigation: productize room staging UX first, realtime upgrade second.

- Risk: refactor work breaks current flows.
  Mitigation: add view-model and route tests before moving screen logic.

- Risk: copy rewrite balloons.
  Mitigation: rewrite only player-visible strings first; docs can follow later.

## Final Recommendation

MineMind does need a meaningful UX redesign, but it does **not** need a ground-up rewrite.

The correct move is:

- redesign the shell and copy
- deepen the solo/results emotional loop
- productize rooms instead of apologizing for them
- separate route orchestration from presentation
- harden state and API boundaries where they affect user trust

That is the shortest path from "working prototype" to "credible V1".
