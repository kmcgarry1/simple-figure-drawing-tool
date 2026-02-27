import { ref } from "vue";
import { describe, expect, it } from "vitest";
import { createSessionRuntimeActions } from "./sessionRuntimeActions";

function createHarness() {
  const audioMuted = ref(false);
  const audioVolumePercent = ref(60);

  const actions = createSessionRuntimeActions({
    sessionMode: ref("class"),
    phase: ref("idle"),
    statusMessage: ref(""),
    hasSourcePhotos: ref(true),
    isSessionLive: ref(false),
    isRunning: ref(false),
    isPaused: ref(false),
    getQuickDurationSeconds: () => 60,
    sessionSlides: ref([]),
    activeSlideDurationMs: ref(0),
    remainingMs: ref(0),
    scheduleCurrentSlide: () => {},
    prepareActiveSet: () => true,
    startPreparedSession: () => {},
    clearTimers: () => {},
    revokeSlideUrl: () => {},
    resetPlaybackState: () => {},
    currentIndex: ref(-1),
    stopSession: () => {},
    markRunStarted: () => {},
    recordSessionHistory: () => {},
    mirrorLiveView: ref(false),
    grayscaleLiveView: ref(false),
    hideLiveOverlay: ref(false),
    audioMuted,
    audioVolumePercent
  });

  return {
    audioMuted,
    audioVolumePercent,
    actions
  };
}

describe("createSessionRuntimeActions", () => {
  it("toggles audio mute state", () => {
    const { audioMuted, actions } = createHarness();

    expect(audioMuted.value).toBe(false);
    actions.toggleAudioMuted();
    expect(audioMuted.value).toBe(true);
    actions.toggleAudioMuted();
    expect(audioMuted.value).toBe(false);
  });

  it("normalizes audio volume input to the 0-100 range", () => {
    const { audioVolumePercent, actions } = createHarness();

    actions.setAudioVolumePercent(150);
    expect(audioVolumePercent.value).toBe(100);

    actions.setAudioVolumePercent(-8);
    expect(audioVolumePercent.value).toBe(0);

    actions.setAudioVolumePercent(44.6);
    expect(audioVolumePercent.value).toBe(45);

    actions.setAudioVolumePercent("not-a-number");
    expect(audioVolumePercent.value).toBe(45);
  });
});
