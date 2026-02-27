<template>
  <div class="grid gap-2">
    <p class="fd-section-label">Class Blocks</p>
    <article
      v-for="(block, index) in classBlocks"
      :key="`pose-block-${index}`"
      class="fd-subtle-card grid gap-2 rounded-md p-2.5"
    >
      <label class="grid gap-1 text-xs text-stone-600">
        <span>Block Type</span>
        <select
          :value="resolveBlockType(block)"
          class="fd-input w-full rounded-md px-2 py-1.5 text-sm"
          @change="onBlockTypeChange(index, $event)"
        >
          <option value="pose">Pose Block</option>
          <option value="break">Break Block</option>
        </select>
      </label>

      <label class="grid gap-1 text-xs text-stone-600">
        <span>Block Name</span>
        <input
          type="text"
          :value="block.label"
          class="fd-input w-full rounded-md px-2 py-1.5 text-sm"
          @input="onBlockLabelInput(index, $event)"
        />
      </label>

      <div class="grid grid-cols-2 gap-2 max-[560px]:grid-cols-1">
        <label class="grid gap-1 text-xs text-stone-600">
          <span>{{ resolveBlockType(block) === "break" ? "Seconds Per Break" : "Seconds Per Pose" }}</span>
          <input
            type="number"
            min="5"
            max="7200"
            :value="block.durationSeconds"
            class="fd-input w-full rounded-md px-2 py-1.5 text-sm"
            @change="onBlockDurationChange(index, $event)"
          />
        </label>

        <label class="grid gap-1 text-xs text-stone-600">
          <span>{{ resolveBlockType(block) === "break" ? "Break Count" : "Pose Count" }}</span>
          <input
            type="number"
            min="1"
            max="200"
            :value="block.poseCount"
            class="fd-input w-full rounded-md px-2 py-1.5 text-sm"
            @change="onBlockCountChange(index, $event)"
          />
        </label>
      </div>

      <label v-if="resolveBlockType(block) === 'pose'" class="grid gap-1 text-xs text-stone-600">
        <span>Photo Tag</span>
        <select
          :value="block.photoTag || 'all'"
          class="fd-input w-full rounded-md px-2 py-1.5 text-sm"
          @change="onBlockPhotoTagChange(index, $event)"
        >
          <option value="all">All Photos</option>
          <option v-for="tag in availablePhotoTags" :key="`tag-${tag}`" :value="tag">{{ tag }}</option>
        </select>
      </label>

      <BaseButton
        compact
        tone="danger"
        :disabled="classBlocks.length <= 1"
        @click="$emit('class-block-remove', index)"
      >
        Remove Block
      </BaseButton>
    </article>

    <div class="grid grid-cols-2 gap-2 max-[560px]:grid-cols-1">
      <BaseButton compact tone="subtle" @click="$emit('class-block-add', 'pose')">
        Add Pose Block
      </BaseButton>
      <BaseButton compact tone="subtle" @click="$emit('class-block-add', 'break')">
        Add Break Block
      </BaseButton>
    </div>
  </div>
</template>

<script setup>
import BaseButton from "../BaseButton.vue";

defineProps({
  classBlocks: {
    type: Array,
    required: true
  },
  availablePhotoTags: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(["class-block-update", "class-block-add", "class-block-remove"]);

function onBlockLabelInput(index, event) {
  emit("class-block-update", {
    index,
    field: "label",
    value: event.target.value
  });
}

function onBlockDurationChange(index, event) {
  emit("class-block-update", {
    index,
    field: "durationSeconds",
    value: event.target.value
  });
}

function onBlockCountChange(index, event) {
  emit("class-block-update", {
    index,
    field: "poseCount",
    value: event.target.value
  });
}

function onBlockPhotoTagChange(index, event) {
  emit("class-block-update", {
    index,
    field: "photoTag",
    value: event.target.value
  });
}

function onBlockTypeChange(index, event) {
  emit("class-block-update", {
    index,
    field: "blockType",
    value: event.target.value
  });
}

function resolveBlockType(block) {
  return String(block?.blockType || "").trim().toLowerCase() === "break" ? "break" : "pose";
}
</script>
