<template>
  <label
    :class="[
      'grid',
      compact ? 'gap-1 text-[11px] text-stone-600' : 'gap-1.5 text-sm text-stone-700'
    ]"
    :for="id"
  >
    <span class="font-medium">{{ label }}</span>
    <input
      :id="id"
      type="number"
      :min="min"
      :max="max"
      :value="value"
      class="fd-input w-full rounded-md"
      :class="compact ? 'px-2 py-1.5 text-sm' : 'px-2.5 py-2 text-sm'"
      @input="onInput"
      @change="$emit('commit')"
    />
  </label>
</template>

<script setup>
defineProps({
  id: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  value: {
    type: [Number, String],
    required: true
  },
  min: {
    type: Number,
    default: 5
  },
  max: {
    type: Number,
    default: 600
  },
  compact: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["update", "commit"]);

function onInput(event) {
  emit("update", event.target.value);
}
</script>
