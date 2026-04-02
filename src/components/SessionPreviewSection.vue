<template>
  <section class="fd-card grid gap-3 rounded-2xl p-4">
    <div class="grid gap-1">
      <p class="fd-section-label inline-flex items-center gap-2">
        <Eye class="h-4 w-4 fd-icon-accent" aria-hidden="true" />
        Session Preview
      </p>
      <p class="fd-text-muted text-sm">{{ previewSummaryText }}</p>
    </div>

    <p v-if="previewItems.length === 0" class="fd-text-muted text-sm">
      Prepare a session set to see upcoming slides.
    </p>

    <article
      v-for="item in previewItems"
      :key="item.id"
      class="fd-list-row"
    >
      <div class="flex items-center justify-between gap-3">
        <span class="fd-text-strong text-sm font-semibold">
          {{ item.title }}
        </span>
        <span class="fd-chip rounded-full px-2.5 py-1 text-xs font-semibold">{{ item.durationText }}</span>
      </div>
      <p class="fd-text-body text-sm">{{ item.subtitle }}</p>
    </article>
  </section>
</template>

<script setup>
import { Eye } from "lucide-vue-next";

defineProps({
  previewSummaryText: {
    type: String,
    required: true
  },
  previewItems: {
    type: Array,
    required: true
  }
});
</script>
