<template>
  <section class="grid gap-2 rounded-lg border border-slate-700 bg-slate-900/60 p-3">
    <p class="text-sm font-semibold text-slate-100">Photo Tags</p>
    <p class="text-xs text-slate-400">
      Assign tag names (for example: gestures, long-pose, anatomy) and target those tags in class blocks.
    </p>
    <p v-if="availablePhotoTags.length > 0" class="text-xs text-slate-300">
      Active tags: {{ availablePhotoTags.join(", ") }}
    </p>
    <p v-else class="text-xs text-slate-500">No tags assigned yet.</p>

    <div class="grid max-h-44 gap-2 overflow-y-auto pr-1">
      <label
        v-for="photo in taggedPhotos"
        :key="photo.id"
        class="grid gap-1 rounded-md border border-slate-700 bg-slate-950/50 px-2 py-1.5 text-xs text-slate-300"
      >
        <span class="truncate text-slate-200">{{ photo.name }}</span>
        <input
          type="text"
          :value="photo.tag"
          placeholder="Tag name (leave empty for all)"
          class="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          @change="onTagChange(photo.id, $event)"
        />
      </label>
    </div>
  </section>
</template>

<script setup>
defineProps({
  taggedPhotos: {
    type: Array,
    required: true
  },
  availablePhotoTags: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(["photo-tag-update"]);

function onTagChange(photoId, event) {
  emit("photo-tag-update", {
    photoId,
    tag: event.target.value
  });
}
</script>
