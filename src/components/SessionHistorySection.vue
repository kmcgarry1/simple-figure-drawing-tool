<template>
  <section class="fd-card grid gap-2 rounded-lg p-3">
    <div class="flex items-center justify-between gap-2">
      <p class="text-sm font-semibold text-stone-800">Session History</p>
      <BaseButton compact tone="subtle" :disabled="sessionHistory.length === 0" @click="$emit('clear-history')">
        Clear
      </BaseButton>
    </div>

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
    </article>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { buildSessionInsights } from "../composables/figureSession/sessionInsights";
import BaseButton from "./BaseButton.vue";

const props = defineProps({
  sessionHistory: {
    type: Array,
    required: true
  }
});

defineEmits(["clear-history"]);

const recentEntries = computed(() => props.sessionHistory.slice(0, 10));
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
</script>
