<template>
  <section class="fd-page">
    <div class="fd-page-heading">
      <p class="fd-section-label">{{ pageEyebrow }}</p>
      <h1 class="fd-page-title">{{ pageTitle }}</h1>
      <p class="fd-text-muted text-base">{{ pageDescription }}</p>
    </div>

    <div class="fd-metric-strip">
      <section class="fd-subtle-card fd-metric-card rounded-2xl p-4">
        <p class="fd-kicker">Runs</p>
        <p class="fd-text-strong text-2xl font-semibold">{{ historyView.historyCount }}</p>
      </section>
      <section class="fd-subtle-card fd-metric-card rounded-2xl p-4">
        <p class="fd-kicker">Snapshots</p>
        <p class="fd-text-strong text-2xl font-semibold">{{ historyView.snapshotCount }}</p>
      </section>
    </div>

    <section class="fd-page-panel">
      <SessionHistorySection
        :session-history="session.sessionHistory.value"
        :run-snapshots="session.runSnapshots.value"
        @clear-history="session.clearSessionHistory"
        @rerun-history="rerunHistory"
        @save-history-snapshot="session.saveRunSnapshotFromHistory"
        @restore-run-snapshot="restoreSnapshot"
        @delete-run-snapshot="session.deleteRunSnapshot"
      />
    </section>
  </section>
</template>

<script setup>
import { computed, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import SessionHistorySection from "../components/SessionHistorySection.vue";
import { useHostSessionContext } from "../composables/useHostSessionContext";

const router = useRouter();
const route = useRoute();
const { session, viewModels } = useHostSessionContext();
const historyView = viewModels.historyView;
const pageEyebrow = computed(() => String(route.meta.navLabel || "History"));
const pageTitle = computed(() => String(route.meta.pageTitle || "Review runs, rerun setups, restore snapshots."));
const pageDescription = computed(() =>
  String(
    route.meta.pageDescription ||
      "History and saved snapshots live here, away from the quick-start flow."
  )
);

async function rerunHistory(entryId) {
  session.rerunSessionFromHistory(entryId);
  await nextTick();
  await router.push(session.sessionMode.value === "class" ? "/class" : "/studio");
}

async function restoreSnapshot(snapshotId) {
  session.restoreRunSnapshot(snapshotId);
  await nextTick();
  await router.push(session.sessionMode.value === "class" ? "/class" : "/studio");
}
</script>
