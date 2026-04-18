# MineMind Expansion Design: Difficulty, Content Engine, Online Foundation, And Minecraft Fantasy UX

## Scope

This document defines the next major planning wave for `MineMind` after the V1 redesign pass completed on `2026-04-18`.

This wave is not a rewrite. It is a product expansion that should make the app:

- more replayable through meaningful difficulty modes
- much deeper through a large Minecraft question bank
- more exciting for kids through a stronger Minecraft-inspired visual fantasy
- more future-proof through explicit online architecture and content pipelines

## Autonomous Assumptions

This spec is written autonomously based on the existing codebase and prior project docs.

Assumptions used throughout:

1. The primary audience remains children `8-12`.
2. `Guest-first onboarding`, `solo mode`, and `private rooms by code` remain the core product shape.
3. Public matchmaking, chat, monetization, and user-generated content remain out of scope for this wave.
4. The app should feel strongly Minecraft-adjacent, but it should not copy Mojang assets, UI, or trademarked visual language directly.
5. The team wants a question-generation workflow that can produce large batches quickly, but all content still needs editorial review before shipping.

## Why This Wave Matters

The current app is stable, localized, and visually improved, but it still has four structural limitations:

1. `Replay depth is too shallow`
   The current match loop works, but one undifferentiated difficulty band means repeat sessions feel samey.

2. `The question bank is too small`
   A short local bank is enough for prototype validation, but not enough for repeat play, difficulty-based progression, or future rooms.

3. `The fantasy is still too generic`
   The app is cleaner than before, but it still reads more like a polished quiz app than a kid-facing Minecraft battle world.

4. `The online story is implied, not designed`
   Rooms exist, Supabase exists, and some live flows exist, but the future online architecture still needs a clearer contract.

## Current State Snapshot

The codebase already gives us a good launchpad:

- `Expo Router` routes for onboarding, home, solo, rooms, and results
- `Zustand` app state with hydration and room persistence
- `Supabase` integration path for guest sessions, rooms, and server-backed rounds
- localized content in `uk`, `en`, `ru`
- an improved UI shell and better screen composition
- green validation for `npm test`, `npm run typecheck`, and `npm run validate`

The missing piece is not the foundation. The missing piece is the expansion layer above that foundation.

## Design Alternatives

### Option A: Content-Only Expansion

Add many more Minecraft questions, but keep the same gameplay shape and the same visual system.

Pros:

- fastest path to more replayability
- least engineering churn
- easiest to parallelize editorial work

Cons:

- does not solve shallow difficulty progression
- does not make the app feel more magical for kids
- risks building a larger content set on top of weak presentation

### Option B: Visual-First Minecraft Reskin

Invest in backgrounds, icons, motion, and Minecraft-inspired presentation first, then expand systems later.

Pros:

- strong visible improvement
- immediate user delight
- useful for demos and investor-style showings

Cons:

- content depth remains thin
- online and content architecture stay underdefined
- the app may look better while playing mostly the same

### Option C: Balanced Expansion Across Gameplay, Content, Visuals, And Online Readiness

Add difficulty modes, large-scale content structure, Minecraft-style presentation, and explicit online contracts in coordinated phases.

Pros:

- strongest long-term value
- each system supports the others
- increases replayability, retention, and future scalability at the same time

Cons:

- larger coordination effort
- requires clear phasing and file boundaries

## Recommended Direction

Choose `Option C`.

This is the right path because:

- difficulty without content is hollow
- content without stronger presentation feels dry
- visuals without structure create demo polish but not product depth
- online without content contracts creates future migration pain

The right move is a coordinated expansion with one shared model across:

- `difficulty selection`
- `question taxonomy`
- `offline/local content packs`
- `future Supabase delivery`
- `child-friendly Minecraft fantasy presentation`

## Target Product Direction

### Product Pillars

1. `Fast to start`
   A child should be able to jump from home into a match in under 10 seconds.

2. `Easy to replay`
   The next match should feel meaningfully different through topic mix, difficulty, and reward framing.

3. `Feels like a Minecraft adventure`
   The atmosphere should feel blocky, playful, adventurous, and collectible without copying Minecraft UI directly.

4. `Safe and parent-readable`
   The app should remain trustable, calm, and privacy-clear.

5. `Ready for real online rooms`
   Content and round contracts should already support synchronized multiplayer even before the live layer is fully polished.

## Gameplay Expansion Spec

### Difficulty Model

Internally, the product should use stable platform-friendly enums:

- `easy`
- `medium`
- `hard`

User-facing labels can stay themed and localized. Recommended Minecraft-flavored display labels:

- `easy` -> `Builder`
- `medium` -> `Explorer`
- `hard` -> `Nether Pro`

This gives us clean backend/storage values without losing product flavor.

### Difficulty Behavior

Recommended first-pass behavior:

- `easy`
  - simpler wording
  - broader facts
  - `20s` timer
  - stronger explanations
- `medium`
  - current default feel
  - `18s` timer
  - mixed general and applied knowledge
- `hard`
  - tighter distractors
  - more advanced mechanics
  - `15s` timer
  - slightly higher speed reward

Important rule:

- question count stays `8` across all difficulties in this wave

That preserves session consistency and room fairness while still making the mode feel different.

### Difficulty Surface Area

Difficulty should appear in four places:

1. `Home`
   The player chooses a mode before entering solo or creating a room.

2. `Solo match`
   The HUD should clearly show which difficulty is active.

3. `Rooms`
   Host chooses difficulty for the room before start.

4. `Results`
   Rewards and recap should remind the player which mode they beat.

### Reward Framing

Difficulty should not feel like a hidden configuration. It should feel like a challenge lane.

Recommended reward framing:

- `Builder clear`
- `Explorer streak`
- `Nether Pro win`

The first goal is not a complex progression system. The first goal is emotional framing that makes replay feel intentional.

## Content Engine Spec

### Content Target

Recommended approved launch target for the expanded Minecraft bank:

- `360` approved questions

Breakdown:

- `8` topic groups
- `3` difficulty levels
- `15` questions per topic per difficulty

Recommended topic groups:

1. `Survival Basics`
2. `Crafting And Smelting`
3. `Blocks And Building`
4. `Mobs And Combat`
5. `Farming And Animals`
6. `Villagers And Enchanting`
7. `Biomes And Structures`
8. `Nether, End, And Redstone`

Minimum viable shipping threshold:

- `180` approved questions

That gives the team a realistic first milestone without forcing the full bank before the UX layer improves.

### Question Schema

The current `LocalizedQuestionDefinition` is too thin for scaled content.

The next content schema should include:

- `id`
- `categoryId`
- `topicId`
- `difficulty`
- `ageBand`
- `prompt`
- `options`
- `correctIndex`
- `explanation`
- `tags`
- `sourceVersion`
- `isActive`

Recommended optional metadata:

- `learningGoal`
- `factKind`
- `estimatedAnswerTime`
- `avoidInSameRoundWith`

This supports better curation, better round assembly, and safer future backend delivery.

### Editorial Standards

Every question should pass these gates:

1. `Kid clarity`
   The prompt should be readable by an `8-12` year old without requiring wiki-level familiarity.

2. `Single-best answer`
   Distractors can be clever, but not ambiguous.

3. `Useful explanation`
   The post-answer fact should teach something, not just restate the answer.

4. `Version sanity`
   Avoid niche version-specific trivia unless clearly marked for hard mode and reviewed.

5. `No duplicate feel`
   Similar questions can exist, but they should test different ideas.

### Generation Workflow

The project should support `AI-assisted drafting + human editorial approval`, not raw automatic publishing.

Recommended workflow:

1. generate draft batches by topic and difficulty
2. run structural validation
3. run duplicate and similarity checks
4. do human editorial pass
5. export approved bank into local packs and Supabase seed format

This balances speed with quality and child-safety.

### Storage Strategy

Use a dual-path content system:

- `local canonical source` for fast development and offline mode
- `Supabase-delivered packs` for future live content rotation

Recommended canonical source:

- one versioned question bank file in the repo
- generated derived packs for client/runtime consumption

This keeps authoring predictable while still supporting future remote delivery.

## Minecraft Fantasy UX Spec

### Visual Direction

The app should feel:

- playful
- blocky
- adventurous
- bright against dark terrain-like surfaces
- reward-driven instead of admin-like

It should not feel:

- like a SaaS dashboard
- like a generic neon mobile game
- like a direct Minecraft UI clone

### Style Principles

1. `Voxel-adjacent shapes`
   Use block rhythm, stepped borders, chunky cards, and terrain layers.

2. `Adventure backgrounds`
   Replace flat dark gradients with world-inspired scenes like overworld dusk, cave glow, Nether heat, and End mystery.

3. `Original badge system`
   Use custom icons for streaks, difficulty, trophies, room host, and perfect rounds.

4. `Kid-readable emphasis`
   Strong hierarchy, larger headlines, stronger CTA contrast, less text fog.

5. `Motion with meaning`
   Match intro, answer reveal, score burst, and reward transition should feel game-like, not just app-like.

### Screen-Specific Direction

#### Onboarding

Goal:

- feel like entering a world, not filling a form

Direction:

- hero background
- larger avatar preview
- collectible-style avatar cards
- CTA framed as entering the adventure

#### Home

Goal:

- instantly answer “what should I play next?”

Direction:

- dominant solo hero
- visible difficulty selector
- secondary room card
- recent result as reward recap
- future seasonal/featured content slot

#### Solo

Goal:

- feel like an active battle loop

Direction:

- stronger HUD
- difficulty chip
- clearer answer reveal
- micro celebration for correct streaks
- less plain list-like layout

#### Results

Goal:

- make the player want one more round

Direction:

- podium energy
- badge or achievement moments
- difficulty-specific win language
- clearer “play again” dominance

#### Rooms

Goal:

- feel like a real multiplayer staging area

Direction:

- host controls feel special
- room code more shareable and prominent
- difficulty visible at the lobby level
- room status should feel like a match queue, not a settings page

## Future Online Spec

### Near-Term Online Goal

The next wave should not build public online matchmaking.

It should build the right foundation for:

- synchronized private room rounds
- authoritative question set selection
- reconnect/resume
- clean final result calculation

### Online Contracts

Future room architecture should explicitly own:

1. `Room lifecycle`
   lobby -> ready -> countdown -> active -> finalizing -> finished

2. `Authoritative round setup`
   backend chooses content pack, seed, difficulty, and question IDs

3. `Authoritative submissions`
   backend stores answers and time-left snapshots

4. `Finalization`
   backend computes standings and returns one final room result

5. `Reconnect path`
   player can resume room state safely after refresh or app restart

### Required Backend Data Shape

The future backend model should understand:

- room difficulty
- content pack version
- question topic distribution
- player presence state
- finalization status

The current local data model should start mirroring these concepts now so migration stays smooth.

## Architecture Implications

### New Product Model Boundaries

The app should gain three explicit domains:

1. `content`
   question bank, topic taxonomy, difficulty metadata, validation

2. `match configuration`
   selected difficulty, selected category, room match settings

3. `presentation assets`
   icons, backgrounds, badge metadata, theme variants

### State Model Additions

`app-store` should eventually persist:

- selected solo difficulty
- selected room difficulty
- maybe last played topic or favorite mode

These are safe product settings that help reduce friction.

### Asset Model

The project currently has only app icons and splash assets.

This wave should add:

- background art surfaces
- icon/badge system
- themed decorative illustrations
- reusable section art or banner components

These should live in original project-owned assets, not copied Minecraft art.

## Risks And Constraints

1. `IP imitation risk`
   Too much direct Minecraft mimicry would be legally and creatively weak. The art direction must stay inspired, not copied.

2. `Content quality risk`
   AI-generated drafts can become repetitive, wrong, or too hard for kids. Editorial gates are non-negotiable.

3. `Scope risk`
   Difficulty, content expansion, visuals, and online design together are large. Delivery must be phased.

4. `Backend drift risk`
   If local content shape and future Supabase shape diverge, later migration becomes painful.

## Recommended Phasing

### Phase 1: Content And Difficulty Foundation

- introduce difficulty enums and config
- expand question schema
- create validated local bank format
- add first large approved question set

### Phase 2: Minecraft Fantasy Presentation

- stronger art direction
- themed assets
- updated home/solo/results/rooms hierarchy
- difficulty-aware UX

### Phase 3: Online-Ready Contracts

- room difficulty selection
- content pack selection by backend-friendly shape
- improved room state machine
- stronger Supabase contracts and realtime design

### Phase 4: Balance And Retention

- tune difficulty fairness
- add badges and replay hooks
- measure drop-off and repeat-play behavior

## Success Criteria

This wave is successful if:

1. a child immediately understands the difference between `Builder`, `Explorer`, and `Nether Pro`
2. the app can serve many repeat matches without obvious question repetition
3. the UI feels like an original Minecraft-inspired game experience rather than a polished dashboard
4. room architecture clearly supports future synchronized private multiplayer
5. the content workflow supports safe batch expansion without chaos

## Recommendation Summary

The best next move is not “just add more questions” and not “just reskin the app.”

The best next move is:

- add `difficulty` as a first-class gameplay concept
- build a real `content engine`
- redesign the `fantasy layer` to feel more Minecraft-like for kids
- align the client model with `future authoritative online rooms`

That combination gives `MineMind` real replay depth and makes the product feel much closer to a standout kid-facing quiz game rather than a technically good prototype.
