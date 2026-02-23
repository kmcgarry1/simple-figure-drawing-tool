<template>
  <div class="grid gap-2">
    <p class="text-xs uppercase tracking-wide text-slate-400">Pose Blocks</p>
    <article
      v-for="(block, index) in classBlocks"
      :key="`pose-block-${index}`"
      class="grid gap-2 rounded-md border border-slate-700 bg-slate-950/50 p-2.5"
    >
      <label class="grid gap-1 text-xs text-slate-300">
        <span>Block Name</span>
        <input
          type="text"
          :value="block.label"
          class="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          @input="onBlockLabelInput(index, $event)"
        />
      </label>

      <div class="grid grid-cols-2 gap-2 max-[560px]:grid-cols-1">
        <label class="grid gap-1 text-xs text-slate-300">
          <span>Seconds Per Pose</span>
          <input
            type="number"
            min="5"
            max="7200"
            :value="block.durationSeconds"
            class="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            @change="onBlockDurationChange(index, $event)"
          />
        </label>

        <label class="grid gap-1 text-xs text-slate-300">
          <span>Pose Count</span>
          <input
            type="number"
            min="1"
            max="200"
            :value="block.poseCount"
            class="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            @change="onBlockCountChange(index, $event)"
          />
        </label>
      </div>

      <label class="grid gap-1 text-xs text-slate-300">
        <span>Break After Block (seconds)</span>
        <input
          type="number"
          min="0"
          max="3600"
          :value="block.breakAfterSeconds ?? 0"
          class="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          @change="onBlockBreakChange(index, $event)"
        />
      </label>
      <p v-if="index === classBlocks.length - 1" class="text-[11px] text-slate-400">
        Break timing applies between blocks; the final block has no trailing break.
      </p>

      <BaseButton
        compact
        tone="danger"
        :disabled="classBlocks.length <= 1"
        @click="$emit('class-block-remove', index)"
      >
        Remove Block
      </BaseButton>
    </article>

    <BaseButton compact tone="subtle" @click="$emit('class-block-add')">Add Block</BaseButton>
  </div>
</template>

<script setup>
import BaseButton from "../BaseButton.vue";

defineProps({
  classBlocks: {
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

function onBlockBreakChange(index, event) {
  emit("class-block-update", {
    index,
    field: "breakAfterSeconds",
    value: event.target.value
  });
}
</script>
