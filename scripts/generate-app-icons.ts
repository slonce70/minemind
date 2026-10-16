// Draws the app icon, Android adaptive icon layers, splash image and favicon from the Kubik
// mascot sprite (src/features/ui/pixel-art.ts). Run: npx tsx scripts/generate-app-icons.ts
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { deflateSync } from 'node:zlib';

import { mascotSprites, type PixelSpriteData } from '../src/features/ui/pixel-art';

type Rgba = [number, number, number, number];

const background = '#132017';
const backgroundAlt = '#17291B';

function hex(color: string, alpha = 255): Rgba {
  const value = color.replace('#', '');

  return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16), alpha];
}

class Canvas {
  readonly pixels: Uint8Array;

  constructor(readonly size: number) {
    this.pixels = new Uint8Array(size * size * 4);
  }

  rect(x: number, y: number, width: number, height: number, color: Rgba) {
    for (let row = Math.max(0, y); row < Math.min(this.size, y + height); row += 1) {
      for (let column = Math.max(0, x); column < Math.min(this.size, x + width); column += 1) {
        this.pixels.set(color, (row * this.size + column) * 4);
      }
    }
  }

  /** Pixel-art tiles: alternating squares in two close shades. */
  tiles(tile: number) {
    for (let y = 0; y < this.size; y += tile) {
      for (let x = 0; x < this.size; x += tile) {
        this.rect(x, y, tile, tile, hex((x / tile + y / tile) % 2 === 0 ? background : backgroundAlt));
      }
    }
  }

  sprite(sprite: PixelSpriteData, scale: number, left: number, top: number, recolor?: Rgba) {
    sprite.rows.forEach((row, y) => {
      [...row].forEach((key, x) => {
        const color = sprite.palette[key];

        if (key !== '.' && color) {
          this.rect(left + x * scale, top + y * scale, scale, scale, recolor ?? hex(color));
        }
      });
    });
  }

  /** The sprite centred, `fraction` of the canvas wide, nudged to whole pixels. */
  centred(sprite: PixelSpriteData, fraction: number, recolor?: Rgba) {
    const columns = sprite.rows[0].length;
    const scale = Math.floor((this.size * fraction) / columns);
    const offset = Math.floor((this.size - scale * columns) / 2);

    this.sprite(sprite, scale, offset, offset, recolor);
  }

  png() {
    const raw = Buffer.alloc((this.size * 4 + 1) * this.size);

    for (let row = 0; row < this.size; row += 1) {
      raw[row * (this.size * 4 + 1)] = 0;
      Buffer.from(this.pixels.buffer, row * this.size * 4, this.size * 4).copy(raw, row * (this.size * 4 + 1) + 1);
    }

    const header = Buffer.alloc(13);
    header.writeUInt32BE(this.size, 0);
    header.writeUInt32BE(this.size, 4);
    header.set([8, 6, 0, 0, 0], 8);

    return Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', header),
      chunk('IDAT', deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]);
  }
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;

  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }

  return value >>> 0;
});

function chunk(type: string, data: Buffer) {
  const length = Buffer.alloc(4);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  let value = 0xffffffff;

  for (const byte of body) {
    value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  }

  length.writeUInt32BE(data.length, 0);
  crc.writeUInt32BE((value ^ 0xffffffff) >>> 0, 0);

  return Buffer.concat([length, body, crc]);
}

const assetsDir = path.join(process.cwd(), 'assets');
const mascot = mascotSprites.happy;
const outputs: [string, Canvas][] = [];

const icon = new Canvas(1024);
icon.tiles(64);
icon.centred(mascot, 0.66);
outputs.push(['icon.png', icon]);

// Android crops adaptive icons to a circle or squircle: keep the mascot inside the safe zone.
const foreground = new Canvas(512);
foreground.centred(mascot, 0.55);
outputs.push(['android-icon-foreground.png', foreground]);

const adaptiveBackground = new Canvas(512);
adaptiveBackground.tiles(32);
outputs.push(['android-icon-background.png', adaptiveBackground]);

const monochrome = new Canvas(432);
monochrome.centred(mascot, 0.55, [255, 255, 255, 255]);
outputs.push(['android-icon-monochrome.png', monochrome]);

const splash = new Canvas(1024);
splash.centred(mascot, 0.6);
outputs.push(['splash-icon.png', splash]);

const favicon = new Canvas(48);
favicon.centred(mascot, 1);
outputs.push(['favicon.png', favicon]);

for (const [name, canvas] of outputs) {
  writeFileSync(path.join(assetsDir, name), canvas.png());
}

console.log(`Wrote ${outputs.map(([name]) => name).join(', ')}`);
