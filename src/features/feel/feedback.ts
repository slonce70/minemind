import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { useAppStore } from '../../state/app-store';

// Sound effects, background music and vibration in one place, each gated by the player's settings.
// Sounds are synthesised by scripts/generate-sounds.ts.
const effectSources = {
  click: require('../../../assets/sounds/click.wav'),
  correct: require('../../../assets/sounds/correct.wav'),
  'round-end': require('../../../assets/sounds/round-end.wav'),
  tick: require('../../../assets/sounds/tick.wav'),
  wrong: require('../../../assets/sounds/wrong.wav'),
} as const;

export type SoundEffect = keyof typeof effectSources;

const effectVolume = 0.8;
/** Music sits well under the effects. */
const musicVolume = 0.28;
const players: Partial<Record<SoundEffect, AudioPlayer>> = {};
let musicPlayer: AudioPlayer | undefined;

const settings = () => useAppStore.getState().settings;

function playEffect(effect: SoundEffect) {
  if (!settings().sound) {
    return;
  }

  try {
    const player = (players[effect] ??= createAudioPlayer(effectSources[effect]));

    player.volume = effectVolume;
    void player.seekTo(0);
    player.play();
  } catch {
    // Audio is a nicety: a device without an audio session just stays quiet.
  }
}

function vibrate(kind: 'tap' | 'success' | 'error') {
  if (!settings().haptics || Platform.OS === 'web') {
    return;
  }

  const result =
    kind === 'tap'
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      : Haptics.notificationAsync(
          kind === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
        );

  result.catch(() => undefined);
}

export const feedback = {
  correct() {
    playEffect('correct');
    vibrate('success');
  },
  roundEnd() {
    playEffect('round-end');
    vibrate('success');
  },
  tap() {
    playEffect('click');
    vibrate('tap');
  },
  tick() {
    playEffect('tick');
  },
  wrong() {
    playEffect('wrong');
    vibrate('error');
  },
};

/** Starts or stops the background loop to match the music setting. */
export function syncMusic(shouldPlay = settings().music) {
  try {
    if (!shouldPlay) {
      musicPlayer?.pause();
      return;
    }

    if (!musicPlayer) {
      musicPlayer = createAudioPlayer(require('../../../assets/sounds/music-loop.m4a'));
      musicPlayer.loop = true;
    }

    musicPlayer.volume = musicVolume;
    musicPlayer.play();
  } catch {
    // See playEffect.
  }
}
