<template>
  <label class="duration-label" :class="{ 'compact-duration': compact }" :for="id">
    <span>{{ label }}</span>
    <input
      :id="id"
      type="number"
      :min="min"
      :max="max"
      :value="value"
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
