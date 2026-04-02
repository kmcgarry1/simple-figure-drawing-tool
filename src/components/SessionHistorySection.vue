<template>
  <section class="fd-card fd-history-panel rounded-2xl p-4">
    <div class="fd-history-header">
      <div class="grid gap-1">
        <p class="fd-section-label">Archive</p>
        <p class="fd-text-strong text-base font-semibold">
          {{ activeTab === "runs" ? "Recent runs" : "Saved snapshots" }}
        </p>
        <p class="fd-text-muted text-sm">
          {{
            activeTab === "runs"
              ? `${filteredEntries.length} run${filteredEntries.length === 1 ? "" : "s"} ready to review.`
              : `${recentSnapshots.length} snapshot${recentSnapshots.length === 1 ? "" : "s"} ready to restore.`
          }}
        </p>
      </div>

      <div class="fd-segmented fd-history-tabs" role="group" aria-label="History views">
        <button
          type="button"
          class="fd-segmented-option"
          :class="{ 'is-active': activeTab === 'runs' }"
          :aria-pressed="activeTab === 'runs' ? 'true' : 'false'"
          @click="activeTab = 'runs'"
        >
          Runs
        </button>
        <button
          type="button"
          class="fd-segmented-option"
          :class="{ 'is-active': activeTab === 'snapshots' }"
          :aria-pressed="activeTab === 'snapshots' ? 'true' : 'false'"
          @click="activeTab = 'snapshots'"
        >
          Snapshots
        </button>
      </div>
    </div>

    <details class="fd-subtle-card fd-disclosure rounded-2xl p-4">
      <summary class="fd-disclosure-summary">
        <div class="grid gap-1">
          <p class="fd-section-label">Archive Tools</p>
          <p class="fd-text-strong text-sm font-semibold">Filters, export, and maintenance</p>
        </div>
        <span class="fd-chip rounded-full px-2.5 py-1 text-xs font-semibold">Optional</span>
      </summary>

      <div class="mt-4 grid gap-4">
        <section class="fd-card grid gap-3 rounded-2xl p-4">
          <div class="grid gap-1">
            <p class="fd-text-strong text-sm font-semibold">Run filters</p>
            <p class="fd-text-muted text-sm">Use filters only when you need to narrow the archive.</p>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <label class="grid gap-1.5 text-sm" for="historyModeFilter">
              <span class="fd-text-muted">Mode</span>
              <select
                id="historyModeFilter"
                v-model="modeFilter"
                class="fd-input w-full rounded-xl px-3 py-2 text-sm"
              >
                <option value="all">All Modes</option>
                <option value="class">Class</option>
                <option value="quick">Quick</option>
              </select>
            </label>

            <label class="grid gap-1.5 text-sm" for="historyOutcomeFilter">
              <span class="fd-text-muted">Outcome</span>
              <select
                id="historyOutcomeFilter"
                v-model="outcomeFilter"
                class="fd-input w-full rounded-xl px-3 py-2 text-sm"
              >
                <option value="all">All Outcomes</option>
                <option value="completed">Completed</option>
                <option value="ended">Ended</option>
              </select>
            </label>

            <label class="grid gap-1.5 text-sm" for="historyDateFromFilter">
              <span class="fd-text-muted">Date From</span>
              <input
                id="historyDateFromFilter"
                v-model="dateFromFilter"
                type="date"
                class="fd-input w-full rounded-xl px-3 py-2 text-sm"
              />
            </label>

            <label class="grid gap-1.5 text-sm" for="historyDateToFilter">
              <span class="fd-text-muted">Date To</span>
              <input
                id="historyDateToFilter"
                v-model="dateToFilter"
                type="date"
                class="fd-input w-full rounded-xl px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div class="fd-row-actions">
            <p class="fd-text-muted text-sm">Showing {{ filteredEntries.length }} of {{ sessionHistory.length }} run(s).</p>
            <button
              type="button"
              class="fd-mini-button"
              :disabled="!hasActiveFilters"
              @click="resetFilters"
            >
              <FilterX class="fd-inline-icon-sm" aria-hidden="true" />
              Reset Filters
            </button>
          </div>

          <div class="grid gap-2 sm:grid-cols-2">
            <BaseButton compact tone="subtle" :disabled="filteredEntries.length === 0" @click="exportFilteredHistoryJson">
              <Download class="fd-inline-icon-sm" aria-hidden="true" />
              Export History JSON
            </BaseButton>
            <BaseButton compact tone="danger" :disabled="sessionHistory.length === 0" @click="$emit('clear-history')">
              <Trash2 class="fd-inline-icon-sm" aria-hidden="true" />
              Clear History
            </BaseButton>
          </div>
        </section>

        <details class="fd-card fd-disclosure rounded-2xl p-4">
          <summary class="fd-disclosure-summary">
            <div class="grid gap-1">
              <p class="fd-section-label">Insights</p>
              <p class="fd-text-strong text-sm font-semibold">
                Last {{ insights.windowDays }} days
              </p>
            </div>
            <span class="fd-chip rounded-full px-2.5 py-1 text-xs font-semibold">Optional</span>
          </summary>

          <div class="mt-4 grid gap-4">
            <div class="fd-summary-metrics">
              <div>
                <p class="fd-kicker">Sessions</p>
                <p class="fd-text-strong text-sm font-semibold">{{ insights.sessionsInWindow }}</p>
              </div>
              <div>
                <p class="fd-kicker">Completed</p>
                <p class="fd-text-strong text-sm font-semibold">{{ insights.completedSessionsInWindow }}</p>
              </div>
              <div>
                <p class="fd-kicker">Practice</p>
                <p class="fd-text-strong text-sm font-semibold">{{ formatDuration(insights.totalElapsedSecondsInWindow) }}</p>
              </div>
              <div>
                <p class="fd-kicker">Avg Slides</p>
                <p class="fd-text-strong text-sm font-semibold">{{ formatAverageSlides(insights.averageCompletedSlides) }}</p>
              </div>
              <div>
                <p class="fd-kicker">Avg Completion</p>
                <p class="fd-text-strong text-sm font-semibold">{{ insights.averageCompletionRatioPercent }}%</p>
              </div>
            </div>

            <div class="grid gap-3">
              <div class="grid gap-1">
                <p class="fd-kicker">Most-used Templates</p>
                <p v-if="insights.topTemplates.length === 0" class="fd-text-muted text-sm">
                  No template usage captured yet.
                </p>
                <div v-else class="flex flex-wrap gap-2">
                  <span
                    v-for="template in insights.topTemplates"
                    :key="`template-insight-${template.label}`"
                    class="fd-chip rounded-full px-2.5 py-1 text-xs font-semibold"
                  >
                    {{ template.label }} ({{ template.count }})
                  </span>
                </div>
              </div>

              <div class="grid gap-1">
                <p class="fd-kicker">Most-used Tags</p>
                <p v-if="insights.topTags.length === 0" class="fd-text-muted text-sm">
                  No class tags captured yet.
                </p>
                <div v-else class="flex flex-wrap gap-2">
                  <span
                    v-for="tag in insights.topTags"
                    :key="`tag-insight-${tag.label}`"
                    class="fd-chip rounded-full px-2.5 py-1 text-xs font-semibold"
                  >
                    {{ tag.label }} ({{ tag.count }})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </details>
      </div>
    </details>

    <div v-if="activeTab === 'runs'" class="fd-history-list" role="list" aria-label="Recent runs">
      <p v-if="sessionHistory.length === 0" class="fd-text-muted text-sm">
        No sessions recorded yet.
      </p>
      <p v-else-if="filteredEntries.length === 0" class="fd-text-muted text-sm">
        No sessions match the current archive filters.
      </p>

      <article
        v-for="entry in recentEntries"
        :key="entry.id"
        role="listitem"
        class="fd-history-row"
      >
        <div class="fd-history-row-header">
          <div class="grid gap-1">
            <div class="flex flex-wrap items-center gap-2">
              <p class="fd-text-strong text-sm font-semibold">{{ entry.sessionMode === "class" ? "Class Run" : "Quick Run" }}</p>
              <span class="fd-chip rounded-full px-2.5 py-1 text-xs font-semibold">{{ entry.result }}</span>
            </div>
            <p class="fd-text-muted text-sm">{{ formatTimestamp(entry.endedAt) }}</p>
          </div>

          <div class="fd-history-row-meta">
            <span>{{ entry.completedSlides }} / {{ entry.plannedSlides }} slides</span>
            <span>{{ formatDuration(entry.elapsedSeconds) }}</span>
          </div>
        </div>

        <p class="fd-text-body text-sm">{{ buildTimingSummary(entry) }}</p>
        <p class="fd-text-muted text-sm">{{ buildAttributionSummary(entry) }}</p>

        <div v-if="snapshotEditorEntryId === entry.id" class="fd-history-editor">
          <label class="grid gap-1.5 text-sm" :for="`snapshot-name-${entry.id}`">
            <span class="fd-text-muted">Snapshot Name</span>
            <input
              :id="`snapshot-name-${entry.id}`"
              type="text"
              class="fd-input w-full rounded-xl px-3 py-2 text-sm"
              :value="snapshotNamesByEntryId[entry.id] || ''"
              :placeholder="buildDefaultSnapshotName(entry)"
              @input="setSnapshotDraftName(entry.id, $event.target.value)"
            />
          </label>

          <div class="grid gap-2 sm:grid-cols-2">
            <BaseButton compact tone="subtle" @click="cancelSnapshotSave">
              <X class="fd-inline-icon-sm" aria-hidden="true" />
              Cancel
            </BaseButton>
            <BaseButton compact @click="confirmSnapshotSave(entry)">
              <BookmarkPlus class="fd-inline-icon-sm" aria-hidden="true" />
              Confirm Save
            </BaseButton>
          </div>
        </div>

        <div v-else class="fd-row-actions">
          <BaseButton compact @click="rerunFromEntry(entry.id)">
            <RotateCcw class="fd-inline-icon-sm" aria-hidden="true" />
            Rerun Setup
          </BaseButton>
          <BaseButton compact tone="subtle" @click="beginSnapshotSave(entry)">
            <Bookmark class="fd-inline-icon-sm" aria-hidden="true" />
            Save Snapshot
          </BaseButton>
        </div>
      </article>
    </div>

    <div v-else class="fd-history-list" role="list" aria-label="Saved snapshots">
      <p v-if="recentSnapshots.length === 0" class="fd-text-muted text-sm">
        Save snapshots from run history to restore named setups quickly.
      </p>

      <article
        v-for="snapshot in recentSnapshots"
        :key="snapshot.id"
        role="listitem"
        class="fd-history-row"
      >
        <div class="fd-history-row-header">
          <div class="grid gap-1">
            <p class="fd-text-strong text-sm font-semibold">{{ snapshot.name }}</p>
            <p class="fd-text-muted text-sm">{{ formatTimestamp(snapshot.updatedAt) }}</p>
          </div>

          <div class="fd-history-row-meta">
            <span>{{ snapshot.sessionMode === "class" ? "Class" : "Quick" }}</span>
          </div>
        </div>

        <p class="fd-text-body text-sm">
          {{
            snapshot.templateName
              ? `${snapshot.sessionMode === "class" ? "Class" : "Quick"} setup | Template ${snapshot.templateName}`
              : `${snapshot.sessionMode === "class" ? "Class" : "Quick"} setup`
          }}
        </p>

        <div class="fd-row-actions">
          <BaseButton compact @click="restoreSnapshot(snapshot.id)">
            <History class="fd-inline-icon-sm" aria-hidden="true" />
            Restore Snapshot
          </BaseButton>
          <BaseButton compact tone="danger" @click="deleteSnapshot(snapshot.id)">
            <Trash2 class="fd-inline-icon-sm" aria-hidden="true" />
            Delete
          </BaseButton>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from "vue";
import { Bookmark, BookmarkPlus, Download, FilterX, History, RotateCcw, Trash2, X } from "lucide-vue-next";
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

const activeTab = ref("runs");
const modeFilter = ref("all");
const outcomeFilter = ref("all");
const dateFromFilter = ref("");
const dateToFilter = ref("");
const snapshotEditorEntryId = ref("");
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

function buildAttributionSummary(entry) {
  const templateName = String(entry?.templateName || "").trim();
  const presetLabel = String(entry?.presetLabel || "").trim();

  if (templateName && presetLabel) {
    return `Preset ${presetLabel} | Template ${templateName}`;
  }
  if (presetLabel) {
    return `Preset ${presetLabel}`;
  }
  if (templateName) {
    return `Template ${templateName}`;
  }

  return "Preset metadata was not saved for this run.";
}

function beginSnapshotSave(entry) {
  const existingValue = String(snapshotNamesByEntryId.value[entry.id] || "").trim();
  if (!existingValue) {
    setSnapshotDraftName(entry.id, buildDefaultSnapshotName(entry));
  }

  snapshotEditorEntryId.value = entry.id;
}

function cancelSnapshotSave() {
  snapshotEditorEntryId.value = "";
}

function confirmSnapshotSave(entry) {
  const currentName = String(snapshotNamesByEntryId.value[entry.id] || "").trim();
  const resolvedName = currentName || buildDefaultSnapshotName(entry);

  setSnapshotDraftName(entry.id, resolvedName);
  emit("save-history-snapshot", {
    sessionId: entry.id,
    name: resolvedName
  });
  snapshotEditorEntryId.value = "";
  activeTab.value = "snapshots";
}

function restoreSnapshot(snapshotId) {
  emit("restore-run-snapshot", snapshotId);
}

function deleteSnapshot(snapshotId) {
  emit("delete-run-snapshot", snapshotId);
}
</script>
