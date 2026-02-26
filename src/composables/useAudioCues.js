import { onBeforeUnmount } from "vue";

const COUNTDOWN_FREQUENCY_BY_SECOND = Object.freeze({
  3: 523.25,
  2: 659.25,
  1: 783.99
});

function clampVolume(value) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return 0.6;
  }

  return Math.min(1, Math.max(0, parsed / 100));
}

export function useAudioCues({ audioMuted, audioVolumePercent }) {
  let audioContext = null;

  function ensureContext() {
    if (typeof window === "undefined") {
      return null;
    }

    const AudioContextRef = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextRef) {
      return null;
    }

    if (!audioContext) {
      audioContext = new AudioContextRef();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }

    return audioContext;
  }

  function playTone({ frequencyHz, durationMs, delaySeconds = 0, type = "sine" }) {
    if (audioMuted.value) {
      return;
    }

    const context = ensureContext();
    if (!context) {
      return;
    }

    const volume = clampVolume(audioVolumePercent.value);
    if (volume <= 0) {
      return;
    }

    const startAt = context.currentTime + delaySeconds;
    const stopAt = startAt + durationMs / 1000;

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequencyHz, startAt);

    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), startAt + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, stopAt);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start(startAt);
    oscillator.stop(stopAt + 0.015);
  }

  function playCountdownCue(secondsLeft) {
    const frequencyHz = COUNTDOWN_FREQUENCY_BY_SECOND[secondsLeft];
    if (!frequencyHz) {
      return;
    }

    playTone({
      frequencyHz,
      durationMs: 110,
      type: "square"
    });
  }

  function playSlideCompleteCue() {
    playTone({
      frequencyHz: 523.25,
      durationMs: 95,
      delaySeconds: 0,
      type: "triangle"
    });
    playTone({
      frequencyHz: 659.25,
      durationMs: 105,
      delaySeconds: 0.12,
      type: "triangle"
    });
    playTone({
      frequencyHz: 783.99,
      durationMs: 130,
      delaySeconds: 0.26,
      type: "triangle"
    });
  }

  onBeforeUnmount(() => {
    if (!audioContext) {
      return;
    }

    audioContext.close().catch(() => {});
    audioContext = null;
  });

  return {
    playCountdownCue,
    playSlideCompleteCue
  };
}
