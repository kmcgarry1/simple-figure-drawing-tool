<template>
  <section class="fd-card grid gap-2 rounded-lg p-3">
    <div class="flex items-center justify-between gap-2">
      <p class="text-sm font-semibold text-stone-800">Session History</p>
      <BaseButton compact tone="subtle" :disabled="sessionHistory.length === 0" @click="$emit('clear-history')">
        Clear
      </BaseButton>
    </div>

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
import BaseButton from "./BaseButton.vue";

const props = defineProps({
  sessionHistory: {
    type: Array,
    required: true
  }
});

defineEmits(["clear-history"]);

const recentEntries = computed(() => props.sessionHistory.slice(0, 10));

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
</script>
