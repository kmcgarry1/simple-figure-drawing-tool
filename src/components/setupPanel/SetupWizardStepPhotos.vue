<template>
  <section class="grid gap-3.5 rounded-xl border border-amber-200/80 bg-white/58 p-4">
    <div class="grid gap-1">
      <p class="text-[15px] font-semibold text-stone-800">Step 1: Add source photos</p>
      <p class="text-[13px] leading-5 text-stone-600">
        Start with direct file upload, or load a folder for larger sets. The app validates supported images
        automatically.
      </p>
    </div>

    <div class="grid gap-3 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)] xl:items-start">
      <article class="grid gap-2.5 rounded-xl border border-lime-300/70 bg-white/84 p-3.5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="text-[15px] font-semibold text-stone-800">Upload Photos</p>
          <span class="rounded-full border border-lime-300/80 bg-lime-100/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-lime-900">
            Primary Path
          </span>
        </div>
        <p class="text-[13px] leading-5 text-stone-600">
          Choose one or many files from anywhere on your device. Best for most sessions.
        </p>
        <label class="grid gap-1.5 text-[13px] text-stone-700" for="photoInput">
          <span class="font-semibold">Select image files</span>
          <input
            id="photoInput"
            type="file"
            :accept="fileInputAccept"
            multiple
            class="w-full rounded-md border border-lime-300/70 bg-white px-2.5 py-2 text-sm text-stone-800 file:mr-2 file:cursor-pointer file:rounded file:border file:border-lime-300/80 file:bg-lime-100/70 file:px-2 file:py-1 file:text-sm file:font-semibold file:text-lime-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            @change="$emit('photos-selected', $event)"
          />
        </label>
        <p class="text-[12px] text-stone-600">Accepted formats: {{ acceptedFormatsLabel }}</p>
      </article>

      <article class="grid gap-2.5 rounded-xl border border-amber-200/80 bg-white/76 p-3">
        <div class="grid gap-1">
          <p class="text-[15px] font-semibold text-stone-800">Load Photo Folder</p>
          <p class="text-[13px] leading-5 text-stone-600">Useful when your references are already organized in a single folder.</p>
        </div>
        <label class="grid gap-1.5 text-[13px] text-stone-700" for="photoFolderInput">
          <span class="font-semibold">Choose a folder</span>
          <input
            id="photoFolderInput"
            type="file"
            :accept="fileInputAccept"
            multiple
            webkitdirectory
            directory
            class="w-full rounded-md border border-amber-200/90 bg-white/84 px-2.5 py-2 text-sm text-stone-800 file:mr-2 file:cursor-pointer file:rounded file:border file:border-amber-200/90 file:bg-amber-50 file:px-2 file:py-1 file:text-sm file:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            @change="$emit('photos-selected', $event)"
          />
        </label>
      </article>
    </div>

    <div class="grid gap-1 rounded-lg border border-amber-200/80 bg-white/84 px-3 py-2.5 text-[13px] text-stone-700">
      <p>
        Current source pool:
        <span class="font-semibold text-stone-800">{{ sourcePoolCountLabel }}</span>
      </p>
      <p class="text-[12px] leading-5 text-stone-600">{{ sourcePoolStatusHint }}</p>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  fileInputAccept: {
    type: String,
    required: true
  },
  taggedPhotos: {
    type: Array,
    required: true
  }
});

defineEmits(["photos-selected"]);

const acceptedFormatsLabel = computed(() => {
  const normalized = String(props.fileInputAccept || "").trim();
  if (!normalized) {
    return "Image files";
  }

  return normalized;
});

const sourcePoolCountLabel = computed(() => {
  const count = Array.isArray(props.taggedPhotos) ? props.taggedPhotos.length : 0;
  return `${count} photo${count === 1 ? "" : "s"}`;
});

const sourcePoolStatusHint = computed(() => {
  const count = Array.isArray(props.taggedPhotos) ? props.taggedPhotos.length : 0;
  if (count === 0) {
    return "Add at least one photo to continue to session setup.";
  }

  if (count < 8) {
    return "You can continue now, but adding more photos gives better random variety.";
  }

  return "Great coverage. Continue to Step 2 to configure timing and launch options.";
});
</script>
