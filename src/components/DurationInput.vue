<template>
  <label
    :class="[
      'grid',
      compact ? 'gap-1 text-[11px] text-slate-300' : 'gap-1.5 text-sm text-slate-200'
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
      class="w-full rounded-md border border-slate-600 bg-slate-900 text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
      :class="compact ? 'px-2 py-1.5 text-sm' : 'px-2.5 py-2 text-sm'"
      @input="onInput"
      @change="$emit('commit')"
      @blur="$emit('commit')"
    />
  </label>
</template>

<script setup>
const props = defineProps({
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
