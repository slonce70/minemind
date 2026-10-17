# Assets and licenses

MineMind is an unofficial fan quiz. It does not use Minecraft logos, textures, sounds or official
mob art. Everything the app shows or plays is listed here.

## Made for MineMind

These are original works of the project and ship under the project's own terms.

| Asset | Where | How it is made |
| --- | --- | --- |
| Pixel icons (check, cross, gear, trophy, topic icons and others) | `src/features/ui/pixel-art.ts` | Hand-drawn 10×10 grids in code, rendered with `react-native-svg` |
| Kubik, the mascot (three moods) | `src/features/ui/pixel-art.ts` | Hand-drawn 16×16 sprite in code |
| 14 player avatars | `src/features/profile/avatar-presets.ts` | Hand-drawn 12×12 sprites in code |
| 26 item drawings for picture and recipe questions (diamond, stick, planks and others) | `src/features/ui/item-sprites.ts` | Hand-drawn 12×12 grids in code: our own simplified drawings of the items, not game textures |
| 24 collectible Kubik cards | `src/features/progress/cards.ts`, `src/features/ui/pixel-art.ts` | Kubik sprite combined with original bodies, faces and hats (`buildKubikSprite`) |
| Progress icons (book, card, cloud, 50/50, link, +time, TV) | `src/features/ui/pixel-art.ts` | Hand-drawn 10×10 grids in code |
| App icon, Android adaptive icon layers, splash image, favicon | `assets/*.png` | Rendered from the Kubik sprite by `scripts/generate-app-icons.ts` |
| Sound effects: click, correct, wrong, timer tick, round end | `assets/sounds/*.wav` | Synthesised by `scripts/generate-sounds.ts` |
| Background music loop | `assets/sounds/music-loop.m4a` | Synthesised by `scripts/generate-sounds.ts`, compressed to AAC with macOS `afconvert` |

Questions about mobs never play mob sounds: the game's sounds are not used anywhere, and sound questions were left out.

To regenerate: `npx tsx scripts/generate-app-icons.ts` and `npx tsx scripts/generate-sounds.ts`.

## Third-party fonts

Both fonts come from Google Fonts through the `@expo-google-fonts` npm packages. The packages are
MIT-licensed code, and the font files are under the SIL Open Font License 1.1, which allows
commercial use and bundling in apps. The full license text ships in each package
(`node_modules/@expo-google-fonts/<font>/LICENSE_FONT`).

| Font | Used for | Copyright | License | Source |
| --- | --- | --- | --- | --- |
| Tiny5 | Pixel headings | Copyright 2022-2024 The Tiny5 Project Authors | SIL OFL 1.1 | https://github.com/Gissio/font_tiny5, npm `@expo-google-fonts/tiny5` |
| Nunito (400, 600, 700, 800, 900) | Body text and numbers | Copyright 2014 The Nunito Project Authors | SIL OFL 1.1 | https://github.com/googlefonts/nunito, npm `@expo-google-fonts/nunito` |

Tiny5 was picked after checking that it covers every letter the app needs: Ukrainian ї, є, ґ, і
(including capital І) and Russian ё, ъ, ы, э. Pixelify Sans was tried first and dropped because it
has no capital І.

## Removed

The 12 AI-generated question illustrations (`assets/question-illustrations`, mirrored in
`public/question-illustrations`) were removed in Phase 2 because they imitated official mobs and
blocks.
