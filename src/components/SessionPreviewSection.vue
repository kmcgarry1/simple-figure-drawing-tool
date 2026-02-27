<template>
  <section class="grid gap-2 rounded-md border border-amber-200/80 bg-white/64 p-2.5">
    <div class="grid gap-0.5">
      <p class="text-sm font-semibold text-stone-800">Session Preview</p>
      <p class="text-xs text-stone-500">{{ previewSummaryText }}</p>
    </div>

    <p v-if="previewItems.length === 0" class="text-xs text-stone-500">
      Prepare a session set to see upcoming slides.
    </p>

    <article
      v-for="item in previewItems"
      :key="item.id"
      class="grid gap-0.5 rounded-md border border-amber-200/80 bg-white/56 px-2 py-1.5"
    >
      <div class="flex items-center justify-between gap-2">
        <span class="text-xs font-semibold" :class="item.kind === 'break' ? 'text-amber-800' : 'text-stone-800'">
          {{ item.title }}
        </span>
        <span class="text-xs text-stone-500">{{ item.durationText }}</span>
      </div>
      <p class="truncate text-xs text-stone-600">{{ item.subtitle }}</p>
    </article>
  </section>
</template>

<script setup>
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
