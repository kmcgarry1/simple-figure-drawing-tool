import { ref } from "vue";
import { describe, expect, it } from "vitest";
import { createSessionRuntimeActions } from "./sessionRuntimeActions";

function createHarness() {
  const audioMuted = ref(false);
  const audioVolumePercent = ref(60);
  const sessionMode = ref("class");
  const statusMessage = ref("");
  const isClassLaunchReviewOpen = ref(false);
  const sessionSlides = ref([]);

  const calls = {
    prepareActiveSet: 0,
    startPreparedSession: 0,
    markRunStarted: 0,
    initializeClassLaunchReviewAssignments: 0,
    clearClassLaunchReviewAssignments: 0,
    applyClassLaunchReviewAssignments: 0
  };

  const actions = createSessionRuntimeActions({
    sessionMode,
    phase: ref("idle"),
    statusMessage,
    hasSourcePhotos: ref(true),
    isSessionLive: ref(false),
    isRunning: ref(false),
    isPaused: ref(false),
    getQuickDurationSeconds: () => 60,
    sessionSlides,
    activeSlideDurationMs: ref(0),
    remainingMs: ref(0),
    scheduleCurrentSlide: () => {},
    prepareActiveSet: () => {
      calls.prepareActiveSet += 1;
      return true;
    },
    startPreparedSession: () => {
      calls.startPreparedSession += 1;
    },
    clearTimers: () => {},
    revokeSlideUrl: () => {},
    resetPlaybackState: () => {},
    currentIndex: ref(-1),
    stopSession: () => {},
    markRunStarted: () => {
      calls.markRunStarted += 1;
    },
    recordSessionHistory: () => {},
    isClassLaunchReviewOpen,
    initializeClassLaunchReviewAssignments: () => {
      calls.initializeClassLaunchReviewAssignments += 1;
    },
    clearClassLaunchReviewAssignments: () => {
      calls.clearClassLaunchReviewAssignments += 1;
    },
    applyClassLaunchReviewAssignments: () => {
      calls.applyClassLaunchReviewAssignments += 1;
    },
    mirrorLiveView: ref(false),
    grayscaleLiveView: ref(false),
    hideLiveOverlay: ref(false),
    audioMuted,
    audioVolumePercent
  });

  return {
    sessionMode,
    statusMessage,
    isClassLaunchReviewOpen,
    sessionSlides,
    calls,
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

  it("opens class launch review instead of starting immediately in class mode", () => {
    const { actions, calls, isClassLaunchReviewOpen, statusMessage } = createHarness();

    actions.startFreshSession();

    expect(calls.prepareActiveSet).toBe(1);
    expect(calls.initializeClassLaunchReviewAssignments).toBe(1);
    expect(calls.markRunStarted).toBe(0);
    expect(calls.startPreparedSession).toBe(0);
    expect(isClassLaunchReviewOpen.value).toBe(true);
    expect(statusMessage.value).toContain("Class set ready");
  });

  it("starts immediately in quick mode", () => {
    const { actions, calls, sessionMode, isClassLaunchReviewOpen } = createHarness();
    sessionMode.value = "quick";

    actions.startFreshSession();

    expect(calls.prepareActiveSet).toBe(1);
    expect(calls.initializeClassLaunchReviewAssignments).toBe(0);
    expect(calls.markRunStarted).toBe(1);
    expect(calls.startPreparedSession).toBe(1);
    expect(isClassLaunchReviewOpen.value).toBe(false);
  });

  it("applies review assignments and starts class when confirmed", () => {
    const { actions, calls, sessionSlides, isClassLaunchReviewOpen } = createHarness();
    sessionSlides.value = [{ kind: "pose", file: { name: "pose.jpg" }, durationMs: 30000 }];
    isClassLaunchReviewOpen.value = true;

    actions.startClassFromReview();

    expect(calls.applyClassLaunchReviewAssignments).toBe(1);
    expect(calls.clearClassLaunchReviewAssignments).toBe(1);
    expect(calls.markRunStarted).toBe(1);
    expect(calls.startPreparedSession).toBe(1);
    expect(isClassLaunchReviewOpen.value).toBe(false);
  });
});
