<template>
  <section class="fd-card grid gap-2 rounded-lg p-3">
    <div class="flex items-center justify-between gap-2">
      <p class="text-sm font-semibold text-stone-800">Session History</p>
      <div class="grid grid-flow-col gap-1.5">
        <BaseButton
          compact
          tone="subtle"
          :disabled="filteredEntries.length === 0"
          @click="exportFilteredHistoryJson"
        >
          Export History JSON
        </BaseButton>
        <BaseButton compact tone="subtle" :disabled="sessionHistory.length === 0" @click="$emit('clear-history')">
          Clear
        </BaseButton>
      </div>
    </div>

    <section class="fd-subtle-card grid gap-2 rounded-md p-2.5">
      <p class="text-xs font-semibold uppercase tracking-wide text-stone-600">Filters</p>
      <div class="grid gap-2 sm:grid-cols-2">
        <label class="grid gap-1 text-[11px] text-stone-600" for="historyModeFilter">
          <span>Mode Filter</span>
          <select
            id="historyModeFilter"
            v-model="modeFilter"
            class="fd-input w-full rounded-md px-2 py-1.5 text-xs"
          >
            <option value="all">All Modes</option>
            <option value="class">Class</option>
            <option value="quick">Quick</option>
          </select>
        </label>

        <label class="grid gap-1 text-[11px] text-stone-600" for="historyOutcomeFilter">
          <span>Outcome Filter</span>
          <select
            id="historyOutcomeFilter"
            v-model="outcomeFilter"
            class="fd-input w-full rounded-md px-2 py-1.5 text-xs"
          >
            <option value="all">All Outcomes</option>
            <option value="completed">Completed</option>
            <option value="ended">Ended</option>
          </select>
        </label>

        <label class="grid gap-1 text-[11px] text-stone-600" for="historyDateFromFilter">
          <span>Date From</span>
          <input
            id="historyDateFromFilter"
            v-model="dateFromFilter"
            type="date"
            class="fd-input w-full rounded-md px-2 py-1.5 text-xs"
          />
        </label>

        <label class="grid gap-1 text-[11px] text-stone-600" for="historyDateToFilter">
          <span>Date To</span>
          <input
            id="historyDateToFilter"
            v-model="dateToFilter"
            type="date"
            class="fd-input w-full rounded-md px-2 py-1.5 text-xs"
          />
        </label>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-600">
        <p>Showing {{ filteredEntries.length }} of {{ sessionHistory.length }} session(s).</p>
        <button
          type="button"
          class="rounded border border-amber-200/90 bg-white/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-stone-700 transition-colors hover:bg-white disabled:opacity-35 disabled:hover:bg-white/80"
          :disabled="!hasActiveFilters"
          @click="resetFilters"
        >
          Reset Filters
        </button>
      </div>
    </section>

    <section class="fd-subtle-card grid gap-2 rounded-md p-2.5">
      <p class="text-xs font-semibold uppercase tracking-wide text-stone-600">
        Insights (Last {{ insights.windowDays }} Days)
      </p>

      <div class="grid grid-cols-2 gap-2 text-xs text-stone-600 max-[560px]:grid-cols-1">
        <p>
          Sessions:
          <span class="font-semibold text-stone-800">{{ insights.sessionsInWindow }}</span>
        </p>
        <p>
          Completed:
          <span class="font-semibold text-stone-800">{{ insights.completedSessionsInWindow }}</span>
        </p>
        <p>
          Practice Time:
          <span class="font-semibold text-stone-800">{{ formatDuration(insights.totalElapsedSecondsInWindow) }}</span>
        </p>
        <p>
          Avg Completed Slides:
          <span class="font-semibold text-stone-800">
            {{ formatAverageSlides(insights.averageCompletedSlides) }}
          </span>
        </p>
        <p class="col-span-2 max-[560px]:col-span-1">
          Avg Completion Ratio:
          <span class="font-semibold text-stone-800">{{ insights.averageCompletionRatioPercent }}%</span>
        </p>
      </div>

      <div class="grid gap-1">
        <p class="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Most-used Templates</p>
        <div v-if="insights.topTemplates.length === 0" class="text-xs text-stone-500">
          No template usage captured yet.
        </div>
        <div v-else class="flex flex-wrap gap-1">
          <span
            v-for="template in insights.topTemplates"
            :key="`template-insight-${template.label}`"
            class="rounded-full border border-amber-200/90 bg-white/80 px-2 py-0.5 text-[11px] text-stone-700"
          >
            {{ template.label }} ({{ template.count }})
          </span>
        </div>
      </div>

      <div class="grid gap-1">
        <p class="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Most-used Tags</p>
        <div v-if="insights.topTags.length === 0" class="text-xs text-stone-500">
          No class tags captured yet.
        </div>
        <div v-else class="flex flex-wrap gap-1">
          <span
            v-for="tag in insights.topTags"
            :key="`tag-insight-${tag.label}`"
            class="rounded-full border border-amber-200/90 bg-white/80 px-2 py-0.5 text-[11px] text-stone-700"
          >
            {{ tag.label }} ({{ tag.count }})
          </span>
        </div>
      </div>
    </section>

    <p v-if="sessionHistory.length === 0" class="text-sm text-stone-500">
      No sessions recorded yet.
    </p>
    <p v-else-if="filteredEntries.length === 0" class="text-sm text-stone-500">
      No sessions match current filters.
    </p>

    <article
      v-for="entry in recentEntries"
      :key="entry.id"
      class="fd-subtle-card grid gap-1 rounded-md px-2.5 py-2 text-xs text-stone-600"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="font-medium text-stone-800">
          {{ entry.sessionMode === "class" ? "Class" : "Quick" }} | {{ entry.result }}
        </span>
        <span>{{ formatTimestamp(entry.endedAt) }}</span>
      </div>
      <div class="flex flex-wrap items-center gap-2 text-stone-500">
        <span>{{ entry.completedSlides }} / {{ entry.plannedSlides }} slides</span>
        <span>{{ formatDuration(entry.elapsedSeconds) }}</span>
      </div>
      <p class="text-[11px] text-stone-500">
        {{ buildTimingSummary(entry) }}
      </p>
      <p class="text-[11px] text-stone-500">
        {{ buildBreakSummary(entry) }}
      </p>
      <p class="text-[11px] text-stone-500">
        {{ buildAttributionSummary(entry) }}
      </p>
      <label class="grid gap-1 pt-1 text-[11px] text-stone-600" :for="`snapshot-name-${entry.id}`">
        <span>Snapshot Name</span>
        <input
          :id="`snapshot-name-${entry.id}`"
          type="text"
          class="fd-input w-full rounded-md px-2 py-1.5 text-xs"
          :value="snapshotNamesByEntryId[entry.id] || ''"
          :placeholder="buildDefaultSnapshotName(entry)"
          @input="setSnapshotDraftName(entry.id, $event.target.value)"
        />
      </label>
      <div class="grid grid-cols-2 gap-2 pt-1">
        <BaseButton compact tone="subtle" @click="rerunFromEntry(entry.id)">Rerun Setup</BaseButton>
        <BaseButton compact tone="subtle" @click="saveSnapshotFromEntry(entry)">Save Snapshot</BaseButton>
      </div>
    </article>

    <section class="fd-subtle-card grid gap-2 rounded-md p-2.5">
      <div class="flex items-center justify-between gap-2">
        <p class="text-xs font-semibold uppercase tracking-wide text-stone-600">
          Run Snapshots
        </p>
        <p class="text-[11px] text-stone-500">
          {{ recentSnapshots.length }} saved
        </p>
      </div>

      <p v-if="recentSnapshots.length === 0" class="text-xs text-stone-500">
        Save snapshots from history entries to reuse named setups quickly.
      </p>

      <article
        v-for="snapshot in recentSnapshots"
        :key="snapshot.id"
        class="fd-callout-muted grid gap-1 rounded-md px-2.5 py-2 text-xs text-stone-600"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="font-semibold text-stone-800">{{ snapshot.name }}</span>
          <span>{{ formatTimestamp(snapshot.updatedAt) }}</span>
        </div>
        <p class="text-[11px] text-stone-500">
          {{ snapshot.sessionMode === "class" ? "Class" : "Quick" }} setup
          <template v-if="snapshot.templateName">
            | Template: {{ snapshot.templateName }}
          </template>
        </p>
        <div class="grid grid-cols-2 gap-2 pt-1">
          <BaseButton compact tone="subtle" @click="restoreSnapshot(snapshot.id)">Restore Snapshot</BaseButton>
          <BaseButton compact tone="danger" @click="deleteSnapshot(snapshot.id)">Delete Snapshot</BaseButton>
        </div>
      </article>
    </section>
  </section>
</template>

<script setup>
import { computed, ref } from "vue";
import { buildSessionInsights } from "../composables/figureSession/sessionInsights";
import {
  createSessionHistoryExportPayload,
  filterSessionHistory
} from "../composables/figureSession/sessionHistoryFilters";
import BaseButton from "./BaseButton.vue";

const props = defineProps({
  sessionHistory: {
    type: Array,
    required: true
  },
  runSnapshots: {
    type: Array,
    required: true
  }
});

const emit = defineEmits([
  "clear-history",
  "rerun-history",
  "save-history-snapshot",
  "restore-run-snapshot",
  "delete-run-snapshot"
]);

const modeFilter = ref("all");
const outcomeFilter = ref("all");
const dateFromFilter = ref("");
const dateToFilter = ref("");
const snapshotNamesByEntryId = ref({});

const activeFilters = computed(() => ({
  mode: modeFilter.value,
  outcome: outcomeFilter.value,
  dateFrom: dateFromFilter.value,
  dateTo: dateToFilter.value
}));
const filteredEntries = computed(() => filterSessionHistory(props.sessionHistory, activeFilters.value));
const recentEntries = computed(() => filteredEntries.value.slice(0, 10));
const recentSnapshots = computed(() => Array.from(props.runSnapshots || []).slice(0, 10));
const hasActiveFilters = computed(
  () =>
    modeFilter.value !== "all" ||
    outcomeFilter.value !== "all" ||
    Boolean(dateFromFilter.value) ||
    Boolean(dateToFilter.value)
);
const insights = computed(() => buildSessionInsights(props.sessionHistory));

function formatTimestamp(value) {
  const timestamp = Date.parse(String(value));
  if (Number.isNaN(timestamp)) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  }
  return `${seconds}s`;
}

function formatAverageSlides(averageSlides) {
  const safeValue = Math.max(0, Number(averageSlides) || 0);
  const hasFractionalPart = Math.abs(safeValue - Math.round(safeValue)) > 0.01;
  return hasFractionalPart ? safeValue.toFixed(1) : String(Math.round(safeValue));
}

function parseToNumber(rawValue, fallback = 0) {
  const parsedValue = Number(rawValue);
  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  return parsedValue;
}

function resetFilters() {
  modeFilter.value = "all";
  outcomeFilter.value = "all";
  dateFromFilter.value = "";
  dateToFilter.value = "";
}

function exportFilteredHistoryJson() {
  if (filteredEntries.value.length === 0 || typeof window === "undefined") {
    return;
  }

  const payload = createSessionHistoryExportPayload(filteredEntries.value, activeFilters.value);
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const blobUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");

  const dateStamp = new Date().toISOString().slice(0, 10);
  downloadLink.href = blobUrl;
  downloadLink.download = `figure-drawing-history-${dateStamp}.json`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();

  URL.revokeObjectURL(blobUrl);
}

function rerunFromEntry(entryId) {
  emit("rerun-history", entryId);
}

function setSnapshotDraftName(entryId, nextName) {
  snapshotNamesByEntryId.value = {
    ...snapshotNamesByEntryId.value,
    [entryId]: String(nextName ?? "")
  };
}

function buildDefaultSnapshotName(entry) {
  const modeLabel = entry?.sessionMode === "class" ? "Class" : "Quick";
  const timestamp = Date.parse(String(entry?.endedAt || ""));
  if (Number.isNaN(timestamp)) {
    return `${modeLabel} Snapshot`;
  }

  const dateLabel = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric"
  }).format(new Date(timestamp));

  return `${modeLabel} ${dateLabel}`;
}

function buildTimingSummary(entry) {
  const elapsedSeconds = Math.max(0, parseToNumber(entry?.elapsedSeconds, 0));
  const plannedDurationSeconds = Math.max(
    0,
    parseToNumber(entry?.plannedDurationSeconds, elapsedSeconds)
  );
  const deltaSeconds = parseToNumber(
    entry?.durationDeltaSeconds,
    elapsedSeconds - plannedDurationSeconds
  );

  if (deltaSeconds === 0) {
    return `Timing: ${formatDuration(elapsedSeconds)} elapsed vs ${formatDuration(plannedDurationSeconds)} planned (on target)`;
  }

  const deltaLabel =
    deltaSeconds > 0
      ? `${formatDuration(Math.abs(deltaSeconds))} over planned`
      : `${formatDuration(Math.abs(deltaSeconds))} under planned`;

  return `Timing: ${formatDuration(elapsedSeconds)} elapsed vs ${formatDuration(plannedDurationSeconds)} planned (${deltaLabel})`;
}

function buildBreakSummary(entry) {
  const plannedBreakCount = Math.max(0, Math.round(parseToNumber(entry?.plannedBreakCount, 0)));
  const completedBreakCount = Math.min(
    plannedBreakCount,
    Math.max(0, Math.round(parseToNumber(entry?.completedBreakCount, 0)))
  );
  const plannedBreakDurationSeconds = Math.max(
    0,
    parseToNumber(entry?.plannedBreakDurationSeconds, 0)
  );
  const completedBreakDurationSeconds = Math.min(
    plannedBreakDurationSeconds,
    Math.max(0, parseToNumber(entry?.completedBreakDurationSeconds, 0))
  );

  if (plannedBreakCount === 0) {
    return "Breaks: None planned.";
  }

  return `Breaks: ${completedBreakCount} / ${plannedBreakCount} completed (${formatDuration(completedBreakDurationSeconds)} / ${formatDuration(plannedBreakDurationSeconds)})`;
}

function buildAttributionSummary(entry) {
  const templateName = String(entry?.templateName || "").trim();
  const presetLabel = String(entry?.presetLabel || "").trim();

  return `Attribution: Template ${templateName || "none"} | Preset ${presetLabel || "n/a"}`;
}

function saveSnapshotFromEntry(entry) {
  const currentName = String(snapshotNamesByEntryId.value[entry.id] || "").trim();
  const resolvedName = currentName || buildDefaultSnapshotName(entry);

  setSnapshotDraftName(entry.id, resolvedName);
  emit("save-history-snapshot", {
    sessionId: entry.id,
    name: resolvedName
  });
}

function restoreSnapshot(snapshotId) {
  emit("restore-run-snapshot", snapshotId);
}

function deleteSnapshot(snapshotId) {
  emit("delete-run-snapshot", snapshotId);
}
</script>
