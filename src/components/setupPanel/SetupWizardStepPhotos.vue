<template>
  <section class="fd-callout grid gap-3.5 rounded-xl p-4">
    <div class="grid gap-1">
      <p class="fd-text-strong inline-flex items-center gap-2 text-[15px] font-semibold">
        <ImagePlus class="h-4 w-4 text-lime-700" aria-hidden="true" />
        Step 1: Add source photos
      </p>
      <p class="fd-text-muted text-[13px] leading-5">
        Start with direct file upload, or load a folder for larger sets. The app validates supported images
        automatically.
      </p>
    </div>

    <div class="grid gap-3 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)] xl:items-start">
      <article class="fd-nested-surface grid gap-2.5 rounded-xl p-3.5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="fd-text-strong inline-flex items-center gap-1.5 text-[15px] font-semibold">
            <Images class="h-4 w-4 text-lime-700" aria-hidden="true" />
            Upload Photos
          </p>
          <span class="fd-badge-active rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]">
            Primary Path
          </span>
        </div>
        <p class="fd-text-muted text-[13px] leading-5">
          Choose one or many files from anywhere on your device. Best for most sessions.
        </p>
        <label class="fd-text-body grid gap-1.5 text-[13px]" for="photoInput">
          <span class="font-semibold">Select image files</span>
          <input
            id="photoInput"
            type="file"
            :accept="fileInputAccept"
            multiple
            class="fd-file-input w-full rounded-md px-2.5 py-2 text-sm"
            @change="$emit('photos-selected', $event)"
          />
        </label>
        <p class="fd-text-caption text-[12px]">Accepted formats: {{ acceptedFormatsLabel }}</p>
      </article>

      <article class="fd-nested-surface grid gap-2.5 rounded-xl p-3">
        <div class="grid gap-1">
          <p class="fd-text-strong inline-flex items-center gap-1.5 text-[15px] font-semibold">
            <FolderOpen class="h-4 w-4 text-sky-700" aria-hidden="true" />
            Load Photo Folder
          </p>
          <p class="fd-text-muted text-[13px] leading-5">Useful when your references are already organized in a single folder.</p>
        </div>
        <label class="fd-text-body grid gap-1.5 text-[13px]" for="photoFolderInput">
          <span class="font-semibold">Choose a folder</span>
          <input
            id="photoFolderInput"
            type="file"
            :accept="fileInputAccept"
            multiple
            webkitdirectory
            directory
            class="fd-file-input w-full rounded-md px-2.5 py-2 text-sm"
            @change="$emit('photos-selected', $event)"
          />
        </label>
      </article>
    </div>

    <div class="fd-callout-muted fd-text-body grid gap-1 rounded-lg px-3 py-2.5 text-[13px]">
      <p class="inline-flex items-center gap-1.5">
        <component :is="sourcePoolStatusIcon" class="h-4 w-4" :class="sourcePoolStatusIconClass" aria-hidden="true" />
        Current source pool:
        <span class="fd-text-strong font-semibold">{{ sourcePoolCountLabel }}</span>
      </p>
      <p class="fd-text-muted text-[12px] leading-5">{{ sourcePoolStatusHint }}</p>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { CircleCheckBig, FolderOpen, ImagePlus, Images, Info } from "lucide-vue-next";

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

const sourcePoolStatusIcon = computed(() => {
  const count = Array.isArray(props.taggedPhotos) ? props.taggedPhotos.length : 0;
  return count === 0 ? Info : CircleCheckBig;
});

const sourcePoolStatusIconClass = computed(() => {
  const count = Array.isArray(props.taggedPhotos) ? props.taggedPhotos.length : 0;
  return count === 0 ? "text-amber-700" : "text-lime-700";
});
</script>
