// Synthesises the game's sound effects and music loop (original, chiptune style) into assets/sounds.
// Run: npx tsx scripts/generate-sounds.ts. The music loop is compressed to AAC with macOS `afconvert`.
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const sampleRate = 22050;
const outDir = path.join(process.cwd(), 'assets', 'sounds');

type Wave = 'square' | 'triangle' | 'sine' | 'noise';

function oscillator(wave: Wave, phase: number, duty = 0.5) {
  const cycle = phase - Math.floor(phase);

  switch (wave) {
    case 'square':
      return cycle < duty ? 1 : -1;
    case 'triangle':
      return 4 * Math.abs(cycle - 0.5) - 1;
    case 'sine':
      return Math.sin(2 * Math.PI * cycle);
    case 'noise':
      return Math.random() * 2 - 1;
  }
}

type Note = {
  attack?: number;
  /** seconds */
  duration: number;
  duty?: number;
  /** Hz at the start and (optionally) the end, for slides. */
  frequency: number;
  frequencyEnd?: number;
  release?: number;
  start: number;
  volume: number;
  wave: Wave;
};

function render(notes: Note[], totalSeconds: number) {
  const buffer = new Float32Array(Math.ceil(totalSeconds * sampleRate));

  for (const note of notes) {
    const startSample = Math.round(note.start * sampleRate);
    const length = Math.round(note.duration * sampleRate);
    const attack = Math.max(1, Math.round((note.attack ?? 0.004) * sampleRate));
    const release = Math.max(1, Math.round((note.release ?? note.duration * 0.6) * sampleRate));
    let phase = 0;

    for (let index = 0; index < length && startSample + index < buffer.length; index += 1) {
      const progress = index / length;
      const frequency = note.frequency + ((note.frequencyEnd ?? note.frequency) - note.frequency) * progress;
      const envelope = Math.min(1, index / attack) * Math.min(1, (length - index) / release);

      phase += frequency / sampleRate;
      buffer[startSample + index] += oscillator(note.wave, phase, note.duty) * note.volume * envelope;
    }
  }

  return buffer;
}

function toWav(samples: Float32Array) {
  const data = Buffer.alloc(samples.length * 2);

  samples.forEach((sample, index) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, sample)) * 32767), index * 2));

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);

  return Buffer.concat([header, data]);
}

const note = (name: string) => {
  const semitones: Record<string, number> = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
  const [, letter, sharp, octave] = /^([A-G])(#?)(\d)$/.exec(name) ?? [];

  return 440 * 2 ** ((semitones[letter] + (sharp ? 1 : 0) + (Number(octave) - 4) * 12) / 12);
};

const effects: Record<string, { notes: Note[]; seconds: number }> = {
  click: {
    notes: [{ duration: 0.045, duty: 0.25, frequency: 1250, frequencyEnd: 900, release: 0.035, start: 0, volume: 0.35, wave: 'square' }],
    seconds: 0.06,
  },
  correct: {
    notes: ['E5', 'G5', 'C6'].map((name, index) => ({
      duration: index === 2 ? 0.22 : 0.08,
      duty: 0.5,
      frequency: note(name),
      start: index * 0.075,
      volume: 0.32,
      wave: 'square' as const,
    })),
    seconds: 0.4,
  },
  wrong: {
    notes: [
      { duration: 0.14, duty: 0.25, frequency: 233, frequencyEnd: 196, start: 0, volume: 0.36, wave: 'square' },
      { duration: 0.24, duty: 0.25, frequency: 185, frequencyEnd: 140, start: 0.13, volume: 0.36, wave: 'square' },
    ],
    seconds: 0.4,
  },
  tick: {
    notes: [{ duration: 0.03, frequency: 1700, frequencyEnd: 1500, release: 0.028, start: 0, volume: 0.4, wave: 'sine' }],
    seconds: 0.04,
  },
  'round-end': {
    notes: [
      ...['C5', 'E5', 'G5'].map((name, index) => ({
        duration: 0.11,
        duty: 0.5,
        frequency: note(name),
        start: index * 0.11,
        volume: 0.28,
        wave: 'square' as const,
      })),
      { duration: 0.5, duty: 0.5, frequency: note('C6'), release: 0.35, start: 0.33, volume: 0.3, wave: 'square' },
      { duration: 0.5, frequency: note('C4'), release: 0.35, start: 0.33, volume: 0.3, wave: 'triangle' },
    ],
    seconds: 0.9,
  },
};

// Calm 8-bar loop: C – Am – F – G, twice, with a light melody the second time round.
function musicLoop() {
  const bpm = 104;
  const beat = 60 / bpm;
  const chords = [
    ['C3', ['C4', 'E4', 'G4']],
    ['A2', ['A3', 'C4', 'E4']],
    ['F2', ['F3', 'A3', 'C4']],
    ['G2', ['G3', 'B3', 'D4']],
  ] as const;
  const melody = ['E5', 'D5', 'C5', 'D5', 'E5', 'E5', 'G5', 'E5', 'C5', 'A4', 'C5', 'D5', 'B4', 'D5', 'G4', 'B4'];
  const notes: Note[] = [];

  for (let bar = 0; bar < 8; bar += 1) {
    const [bass, triad] = chords[bar % 4];
    const barStart = bar * 4 * beat;

    for (let step = 0; step < 4; step += 1) {
      notes.push({ duration: beat * 0.9, frequency: note(bass), release: beat * 0.5, start: barStart + step * beat, volume: 0.22, wave: 'triangle' });
    }

    for (let step = 0; step < 8; step += 1) {
      notes.push({
        duration: beat * 0.45,
        duty: 0.125,
        frequency: note(triad[step % 3]),
        release: beat * 0.35,
        start: barStart + (step * beat) / 2,
        volume: 0.07,
        wave: 'square',
      });
    }

    if (bar >= 4) {
      for (let step = 0; step < 4; step += 1) {
        notes.push({
          duration: beat * 0.85,
          duty: 0.5,
          frequency: note(melody[((bar - 4) * 4 + step) % melody.length]),
          release: beat * 0.6,
          start: barStart + step * beat,
          volume: 0.09,
          wave: 'square',
        });
      }
    }
  }

  return { notes, seconds: 8 * 4 * beat };
}

mkdirSync(outDir, { recursive: true });

for (const [name, effect] of Object.entries(effects)) {
  writeFileSync(path.join(outDir, `${name}.wav`), toWav(render(effect.notes, effect.seconds)));
}

const music = musicLoop();
const musicWav = path.join(outDir, 'music-loop.wav');

writeFileSync(musicWav, toWav(render(music.notes, music.seconds)));
execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '64000', musicWav, path.join(outDir, 'music-loop.m4a')]);
rmSync(musicWav);
console.log(`Wrote ${Object.keys(effects).length} effects and a ${music.seconds.toFixed(1)} s music loop to ${outDir}`);
