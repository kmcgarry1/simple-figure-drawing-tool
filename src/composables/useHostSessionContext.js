import { computed, inject, provide } from "vue";

const HOST_SESSION_CONTEXT_KEY = Symbol("host-session-context");

export function buildHostSessionViewModels({ session, remote }) {
  const studioDraft = computed(() => ({
    sessionMode: session.sessionMode.value,
    durationSeconds: session.durationSeconds.value,
    photoCount: session.taggedPhotos.value.length,
    hasSourcePhotos: session.hasSourcePhotos.value,
    canStartQuickSession: session.sessionMode.value === "quick" && session.hasSourcePhotos.value,
    previewItems: session.sessionPreviewItems.value.slice(0, 3),
    previewSummaryText: session.sessionPreviewSummaryText.value,
    classSummary: {
      poseCount: session.classPoseCount.value,
      totalMinutesText: session.classTotalMinutesText.value,
      deltaText: session.classDeltaText.value,
      hasClassPlan: session.hasClassPlan.value
    }
  }));

  const classBuilderDraft = computed(() => ({
    hasSourcePhotos: session.hasSourcePhotos.value,
    hasClassPlan: session.hasClassPlan.value,
    classTargetMinutes: session.classTargetMinutes.value,
    classPoseCount: session.classPoseCount.value,
    classTotalMinutesText: session.classTotalMinutesText.value,
    classDeltaText: session.classDeltaText.value,
    previewItems: session.sessionPreviewItems.value,
    previewSummaryText: session.sessionPreviewSummaryText.value,
    templateCount: session.classTemplates.value.length,
    canLaunch: session.hasSourcePhotos.value && session.hasClassPlan.value
  }));

  const historyView = computed(() => ({
    historyCount: session.sessionHistory.value.length,
    snapshotCount: session.runSnapshots.value.length
  }));

  const remotePairingState = computed(() => ({
    status: remote.remoteStatus.value,
    diagnostics: remote.remoteDiagnostics.value,
    isConnected: remote.isRemoteConnected.value,
    pairingUrl: remote.pairingUrl.value,
    hasOfferToken: Boolean(remote.offerToken.value)
  }));

  return {
    studioDraft,
    classBuilderDraft,
    historyView,
    remotePairingState
  };
}

export function provideHostSessionContext(contextValue) {
  provide(HOST_SESSION_CONTEXT_KEY, contextValue);
}

export function useHostSessionContext() {
  const contextValue = inject(HOST_SESSION_CONTEXT_KEY, null);
  if (!contextValue) {
    throw new Error("Host session context is not available.");
  }

  return contextValue;
}
