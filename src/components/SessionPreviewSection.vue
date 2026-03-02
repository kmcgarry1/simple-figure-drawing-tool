<template>
  <section class="fd-card grid gap-2.5 rounded-xl p-3">
    <div class="grid gap-1">
      <p class="fd-text-strong inline-flex items-center gap-1.5 text-[15px] font-semibold">
        <Eye class="h-4 w-4 text-sky-700" aria-hidden="true" />
        Session Preview
      </p>
      <p class="fd-text-muted text-[12px] leading-5">{{ previewSummaryText }}</p>
    </div>

    <p v-if="previewItems.length === 0" class="fd-text-muted text-[12px] leading-5">
      Prepare a session set to see upcoming slides.
    </p>

    <article
      v-for="item in previewItems"
      :key="item.id"
      class="fd-nested-surface grid gap-0.5 rounded-lg px-2.5 py-2"
    >
      <div class="flex items-center justify-between gap-2">
        <span class="fd-text-strong text-[13px] font-semibold">
          {{ item.title }}
        </span>
        <span class="fd-text-caption text-[12px]">{{ item.durationText }}</span>
      </div>
      <p class="fd-text-body truncate text-[12px] leading-5">{{ item.subtitle }}</p>
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
