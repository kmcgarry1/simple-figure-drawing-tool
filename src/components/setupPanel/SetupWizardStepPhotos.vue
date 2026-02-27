<template>
  <section class="grid gap-3 rounded-lg border border-amber-200/80 bg-white/58 p-3">
    <div class="grid gap-1">
      <p class="text-sm font-semibold text-stone-800">Step 1: Add source photos</p>
      <p class="text-xs text-stone-500">
        Add files manually or load a folder. The app will validate and randomize from the accepted set.
      </p>
    </div>

    <label class="grid gap-1.5 text-sm text-stone-700" for="photoInput">
      <span class="font-medium">Upload Photos</span>
      <input
        id="photoInput"
        type="file"
        :accept="fileInputAccept"
        multiple
        class="w-full rounded-md border border-amber-200/90 bg-white/84 px-2.5 py-2 text-sm text-stone-800 file:mr-2 file:cursor-pointer file:rounded file:border file:border-amber-200/90 file:bg-amber-50 file:px-2 file:py-1 file:text-sm file:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        @change="$emit('photos-selected', $event)"
      />
    </label>

    <label class="grid gap-1.5 text-sm text-stone-700" for="photoFolderInput">
      <span class="font-medium">Load Photo Folder</span>
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

    <p class="text-xs text-stone-500">
      Current source pool: {{ taggedPhotos.length }} photo(s).
    </p>
  </section>
</template>

<script setup>
defineProps({
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
</script>
