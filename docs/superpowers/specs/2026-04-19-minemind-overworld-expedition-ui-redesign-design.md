# MineMind Overworld Expedition UI Redesign

Date: 2026-04-19
Status: Approved for planning
Owner: Codex

## Summary

Redesign MineMind around an `Overworld Expedition + Craft Station HUD` direction.

The product should stop feeling like a green dashboard made of similar cards and start feeling like a Minecraft-inspired game journey with strong atmosphere, clearer screen hierarchy, and distinct mode identities.

This redesign is focused on visual system, composition, and interaction hierarchy. It does not change quiz logic, multiplayer architecture, persistence, or backend contracts.

## Why This Exists

The current UI is cleaner and more stable than before, but it still has several structural UX problems:

- The screens rely on the same visual rhythm and similar card blocks, so the product feels repetitive.
- The Minecraft inspiration is too abstract. It reads as a generic green fantasy app instead of a strong game identity.
- Primary, secondary, and utility actions are too visually close to one another.
- Home, onboarding, results, rooms, and classroom do not feel like distinct scenes in one world.
- The interface is technically usable, but it does not create excitement or emotional payoff.

The redesign must solve those issues without sacrificing readability, localization resilience, or mobile usability.

## Design Direction

### Core Direction

Use `Overworld Expedition` as the emotional and artistic direction and `Craft Station HUD` as the interaction language.

That means:

- Environments should feel like places in a Minecraft-like world rather than abstract tinted panels.
- Controls should feel blocky, tactile, and crafted, but not copied from vanilla Minecraft menus.
- Each major screen should communicate a specific role in the journey.
- Materials should feel earthy and physical: grass, dirt, stone, ore, timber, torchlight.

### Explicit Rejection

This redesign does **not** aim for:

- a 1:1 Minecraft menu clone
- a flat SaaS dashboard with Minecraft colors
- a glossy mobile game casino look
- dark fantasy dungeon art as the dominant tone

## Product Goals

### Primary Goals

- Make the app feel like a game experience, not a utility interface.
- Strengthen Minecraft-adjacent identity without becoming a copy.
- Create a much stronger first impression on home and onboarding.
- Make results feel rewarding and memorable.
- Give `solo`, `rooms`, and `classroom` distinct emotional roles.

### Secondary Goals

- Preserve readability on phones and web.
- Preserve full localization quality in `uk`, `ru`, and `en`.
- Keep classroom and room workflows practical, not decorative.
- Reuse and evolve the current primitive layer instead of replacing the entire app structure.

## Non-Goals

- No gameplay redesign
- No navigation rewrite
- No backend or transport redesign
- No new multiplayer feature scope
- No asset-heavy illustration pipeline for this pass

If art assets are added later, they should layer onto this system rather than define it.

## Visual System

### Color and Material System

Replace the current mostly-uniform green treatment with a material-driven palette:

- `Grass`: fresh exploration accents and live mode cues
- `Dirt`: grounded background and base panel undertones
- `Stone`: structural shells, lobby panels, utility surfaces
- `Ore / Torch Gold`: reward, CTA, rank, progress, highlight
- `Deep Cave / Canvas`: global backdrop and contrast anchor

The palette should not read as monochrome green. Green remains part of the world, but not the entire identity.

### Surface Hierarchy

Introduce three clear surface levels:

1. `Hero Surface`
   Used for the dominant scene on a screen. This should feel environmental and layered.

2. `Panel Surface`
   Used for actionable modules like room setup, classroom controls, and result summaries.

3. `Utility Surface`
   Used for pills, chips, minor stats, and low-priority metadata.

Current surfaces are too visually similar. The redesign must create unmistakable separation between them.

### Shape Language

Use blocky geometry with crafted depth:

- larger slab-like panels
- stepped edges
- stronger face/lip/inset treatment
- fewer “soft app card” shapes
- less neutral rounded-panel repetition

Rounded corners may remain, but they should feel intentional and heavier, not generic.

### Typography and Tone

Typography should stay readable and bold, but with clearer hierarchy:

- hero titles should feel like chapter headers
- section titles should feel carved or stamped
- helper copy should be quieter and less dashboard-like

The tone should feel adventurous, grounded, and game-first rather than administrative.

## Primitive Redesign

### Card

The base card should stop being a universal answer for every need.

We need at least:

- `SceneCard` for hero blocks
- `PanelCard` for important modules
- `UtilityCard` for secondary summaries

These can still be implemented through the existing card primitive, but they must present differently enough to support hierarchy.

### Button

Buttons should feel like crafted controls rather than generic filled and outlined buttons.

Changes required:

- stronger depth
- clearer primary vs secondary hierarchy
- more tactile pressed state
- clearer difference between action buttons and state toggles

Primary CTA should feel like launching an expedition, not submitting a form.

### Background System

`WorldBackground` should evolve from horizontal abstract layers into more scene-like environmental composition.

Requirements:

- atmosphere without layout overlap
- world variation by screen role
- stronger sense of terrain and structure
- support for `overworld`, `camp`, `stone-hall`, `reward`, and `classroom hub` moods

## Screen Redesign

### Home

Home becomes an `Expedition Board`.

Structure:

- a dominant top scene with player identity and current route
- one primary `solo` action path
- two smaller route panels for `friends` and `classroom`
- a lower-priority `expedition log` for the latest result

Requirements:

- `solo` is the single most visually dominant path
- `rooms` and `classroom` are distinct but not competing equally with the primary CTA
- the user should understand what to do next in under five seconds

### Onboarding

Onboarding becomes `Adventurer Setup`.

Structure:

- short world-facing intro
- stronger player identity plate
- three step-like setup zones: nickname, language, avatar

Requirements:

- less form feeling
- more character creation feeling
- still compact and mobile-safe
- no hidden or confusing progression

### Results

Results becomes `Trophy Camp`.

Structure:

- a rewarding top block with stronger badge drama
- a more ceremonial podium
- stat modules with clearer weighting
- insights presented like field notes

Requirements:

- must feel like payoff, not a report
- winning or perfect play must feel more special
- multiplayer standings must stay easy to read

### Rooms

Rooms becomes `Party Rally Point`.

Structure:

- a strong room-code hero object
- clear team roster tiles
- obvious ready summary
- launch action that feels like starting a mission

Requirements:

- practical clarity remains more important than decoration
- ready-state readability must improve, not regress
- difficulty selection should feel attached to mission setup

### Classroom

Classroom becomes `Local Camp Hub`.

Structure:

- the host device reads like a beacon or local hub
- invite token, ready state, and roster live inside one command surface
- teacher/host control remains obvious

Requirements:

- this screen must stay highly practical
- local multiplayer setup cannot become visually confusing
- host authority and player readiness should be legible at a glance

## Interaction Principles

- One dominant CTA per screen
- Secondary actions grouped and visually quieter
- Status and metadata never compete with progression actions
- Ready-state and participation state must be immediately scannable
- Long localized labels must wrap without causing collisions or overlap

## Implementation Strategy

### Wave 1: Visual Foundation

Update:

- theme tokens
- surface hierarchy
- card styles
- button styles
- world backgrounds

Goal:

Remove the dashboard feeling across the app before recomposing individual screens.

### Wave 2: Screen Recomposition

Order:

1. Home
2. Onboarding
3. Results
4. Rooms
5. Classroom

Goal:

Rebuild the dramatic and functional hierarchy of each screen on top of the new foundation.

## Testing and Verification

### Functional Verification

- existing quiz and navigation flows must remain intact
- no route should lose its main action
- no room/classroom control should become ambiguous

### Layout Verification

- localized long labels must still wrap correctly
- web export must remain stable
- mobile composition must remain readable without overlap

### UX Verification

Review each screen for:

- dominant CTA clarity
- mode differentiation
- Minecraft-adjacent identity
- reward feeling
- classroom and room practicality

## Success Criteria

The redesign is successful when a first-time viewer can quickly infer:

- this is a Minecraft-inspired game experience
- this is not a generic dashboard
- there is a clear next action on every screen
- solo, rooms, classroom, and results each have a distinct role
- the app feels more exciting without becoming harder to use

## Scope Boundary

This spec covers the product-facing UX and visual redesign only.

Any future work on:

- new art assets
- automatic local host discovery
- room logic changes
- backend changes

must be scoped separately unless directly required to preserve the redesigned UX.
