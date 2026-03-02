<template>
  <section class="fd-card grid gap-2.5 rounded-xl p-3">
    <div class="grid gap-1">
      <p class="inline-flex items-center gap-1.5 text-[15px] font-semibold text-stone-800">
        <Eye class="h-4 w-4 text-sky-700" aria-hidden="true" />
        Session Preview
      </p>
      <p class="text-[12px] leading-5 text-stone-600">{{ previewSummaryText }}</p>
    </div>

    <p v-if="previewItems.length === 0" class="text-[12px] leading-5 text-stone-600">
      Prepare a session set to see upcoming slides.
    </p>

    <article
      v-for="item in previewItems"
      :key="item.id"
      class="grid gap-0.5 rounded-lg border border-amber-200/80 bg-white/80 px-2.5 py-2"
    >
      <div class="flex items-center justify-between gap-2">
        <span class="text-[13px] font-semibold" :class="item.kind === 'break' ? 'text-amber-800' : 'text-stone-800'">
          {{ item.title }}
        </span>
        <span class="text-[12px] text-stone-600">{{ item.durationText }}</span>
      </div>
      <p class="truncate text-[12px] leading-5 text-stone-700">{{ item.subtitle }}</p>
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
