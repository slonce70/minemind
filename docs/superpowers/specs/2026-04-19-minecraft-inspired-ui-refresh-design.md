# Minecraft-Inspired UI Refresh Design

## Scope

This document defines the approved visual and layout refresh for the current MineMind app as of `2026-04-19`.

The goal is to move the product away from a generic green dashboard and toward a Minecraft-inspired interface that feels blocky, playful, tactile, and game-like without copying Mojang's original UI directly.

This refresh also includes a layout hardening pass for the overlapping hero content reported in the browser.

## Approved Direction

The approved style direction is:

- `Minecraft-inspired`, not vanilla Minecraft imitation
- primary visual signals:
  - `blocks and terrain relief`
  - `pixel-HUD style controls`

The goal is not a reskin. The goal is a system-level refresh where the shared primitives establish the visual identity across home, rooms, results, and onboarding.

## Problem Statement

### Visual Problem

The current UI has a consistent palette, but it does not read as Minecraft-inspired. It feels closer to a generic green SaaS dashboard with soft glass cards than to a playful game surface.

Specific weaknesses:

- cards feel too smooth and too neutral
- decorative backgrounds are abstract rather than terrain-inspired
- buttons do not feel tactile or game-like
- hero sections feel like one large green slab instead of layered block surfaces
- the interface lacks a strong block rhythm or HUD framing

### Layout Problem

The reported overlap is not only a web issue.

The browser makes it more visible because `react-native-web` text metrics differ from native, but the root cause is shared layout structure:

- decorative layers in `src/features/ui/world-background.tsx` are absolutely positioned across the same area used by content
- hero content is allowed to grow while decorative bands remain fixed-height visual slabs
- some control groups still rely on long horizontal layouts that become fragile under localized copy and responsive sizing

This means the overlap risk exists system-wide, with web exposing it first.

## Design Goals

### Experience Goals

1. The app should feel like a game interface, not a dashboard.
2. The UI should evoke Minecraft through rhythm, material cues, and block logic rather than imitation.
3. The hero surface should feel layered and readable, with content separated cleanly from decoration.
4. Buttons and status elements should feel tactile, chunky, and game-ready.
5. Layout should remain readable in Ukrainian, Russian, and English without text collisions.

### Non-Goals

- copying Minecraft's vanilla menu pixel-for-pixel
- introducing licensed Minecraft art or trademarked UI details
- rewriting every screen from scratch
- shipping a web-only fix that leaves native styling untouched

## Design Alternatives Considered

### Option A: Light Reskin

Change colors, borders, and a few accents while keeping the same composition.

Pros:

- fastest path
- low risk

Cons:

- still reads as the same dashboard
- does not solve the structural hero problem
- not enough to establish a clear Minecraft-inspired identity

### Option B: Token-First Redesign

Rework shared tokens and primitives first, then adapt hero composition on key screens.

Pros:

- strongest systemic improvement
- style propagates across multiple screens naturally
- best balance of speed and quality
- fixes both visual identity and layout resilience together

Cons:

- touches shared UI foundations
- requires coordinated updates across core screens

### Option C: Hero-Only Poster Refresh

Focus mainly on a dramatic hero section and leave most primitives intact.

Pros:

- visually noticeable quickly

Cons:

- overlap risk remains in shared primitives
- deeper UI still feels generic
- styling becomes inconsistent across screens

## Recommended And Approved Option

Choose `Option B: Token-first redesign`.

This refresh should focus on shared building blocks first:

- theme tokens
- cards
- buttons
- status pills
- hero/world backgrounds

Then the home, rooms, results, and onboarding screens should be adjusted to use those primitives in a clearer layered composition.

## Visual System Specification

### Materials

The new UI should use a terrain-inspired material model:

- base surfaces: dark stone, deep soil, cave shadow
- accent surfaces: moss, grass edge, warm ore, torch gold
- interactive elements: carved slab, block border, HUD plate
- highlights: gold and ember rather than plain yellow

The current smooth translucent glass look should be reduced significantly.

### Shape Language

The shape language should become more block-like:

- corners should be firmer and less bubbly
- cards should feel like stacked slabs or carved blocks
- inner borders and relief lines should create depth
- controls should feel rectangular and chunky

Rounded corners can remain, but they should support a block rhythm rather than a soft mobile-dashboard style.

### Buttons

Buttons should behave like pixel-HUD controls:

- stronger rectangular silhouette
- visible top highlight and lower edge weight
- clearer pressed state through vertical shift and shadow change
- primary CTA should read as a large action plate
- secondary CTA should read as carved stone or dark block

### Cards

Cards should feel like layered blocks:

- double-border or inset treatment
- stronger surface contrast from background
- less glass, more material
- optional top strip or edge seam to suggest block relief

### Status Pills

Stat chips should become small HUD plaques rather than rounded badges:

- stronger contrast
- tighter type hierarchy
- better wrapping behavior
- more clearly separated label and value planes

### Background Art

`overworld`, `cave`, and `nether` variants should stop using simple horizontal bands.

Instead:

- `overworld` should suggest grass, soil, and block horizon
- `cave` should suggest stone depth and ore/cold light pockets
- `nether` should suggest basalt, lava glow, or ember strata

Background art must always remain subordinate to readable content.

## Layout Specification

### Hero Structure

The hero must be split into two readable zones:

1. `Hero header`
   - eyebrow
   - title
   - short subtitle
   - one compact badge

2. `Control zone`
   - language
   - mode
   - difficulty
   - primary CTA

This prevents the decorative background from competing with the interactive cluster.

### Responsive Rules

The UI must assume long localized copy and smaller browser widths.

Rules:

- horizontal groups must wrap safely
- content cells must permit shrinking via `minWidth: 0`
- CTA rows should stack when needed
- difficulty controls must support multi-row layout on constrained widths
- decorative layers must never rely on fixed heights that cut through live content

### Browser Overlap Fix

The overlap issue should be solved at the component architecture level, not by isolated spacing tweaks.

Required changes:

- move decorative layers behind content instead of slicing through content height
- avoid large absolute-positioned visual bands inside shared hero surfaces
- introduce explicit content containers with safe padding and vertical rhythm
- ensure web and native share resilient responsive rules

## Screen-Level Direction

### Home

Home should become the clearest expression of the new style.

Changes:

- hero as a stacked terrain panel
- concise, high-energy hierarchy
- status chips as HUD plaques
- difficulty selector as chunky block toggles
- primary CTA as the strongest visual surface

### Rooms

Rooms should inherit the same block language, with stronger room-code emphasis and a more alive lobby feel.

The room roster must stay readable even when names are longer or localized labels expand.

### Results

Results should keep the podium concept, but the podium and reward summary should feel more game-like and less like generic summary cards.

### Onboarding

Onboarding should feel like entering a game world, not filling a form.

The preview card should look like a player profile block rather than a soft settings panel.

## Technical Change Surface

Primary files expected to change:

- `src/theme/tokens.ts`
- `src/components/ui/card.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/stat-pill.tsx`
- `src/features/ui/world-background.tsx`
- `src/features/ui/theme-art.ts`
- `src/features/home/home-view.tsx`
- `src/features/rooms/room-lobby-view.tsx`
- `src/features/results/results-view.tsx`
- `src/features/onboarding/onboarding-view.tsx`

## Testing And Verification Expectations

Before calling the refresh complete:

- verify layout on web export with localized copy
- verify no overlap in hero sections
- verify difficulty controls wrap cleanly on narrower widths
- verify buttons remain readable in `uk`, `ru`, and `en`
- verify style direction feels consistent across home, rooms, results, and onboarding

## Success Criteria

This refresh is successful when:

- the app no longer reads like a generic green dashboard
- the UI feels Minecraft-inspired through material, rhythm, and control language
- buttons, cards, and pills feel chunkier and more game-like
- hero sections separate decoration from content cleanly
- the reported overlap issue is resolved at the shared-component level
- localized copy remains stable without collisions
