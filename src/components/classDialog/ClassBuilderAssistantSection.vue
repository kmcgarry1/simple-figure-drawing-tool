<template>
  <div class="grid gap-2">
    <p class="fd-section-label">Class Builder Assistant</p>
    <section class="fd-subtle-card grid gap-2 rounded-md p-2.5">
      <p class="text-xs text-stone-600">
        Generate a class plan from a target duration preset, gesture/long-pose mix, and preferred
        photo tags.
      </p>

      <div class="grid grid-cols-3 gap-2 max-[560px]:grid-cols-1">
        <BaseButton
          v-for="preset in classPresetOptions"
          :key="`assistant-preset-${preset.id}`"
          compact
          :tone="assistantPresetId === preset.id ? 'primary' : 'subtle'"
          @click="assistantPresetId = preset.id"
        >
          {{ preset.label }}
        </BaseButton>
      </div>

      <label class="grid gap-1 text-xs text-stone-600" for="assistantGestureShare">
        <span>Gesture Mix: {{ gestureSharePercent }}% (Long Pose {{ 100 - gestureSharePercent }}%)</span>
        <input
          id="assistantGestureShare"
          type="range"
          min="10"
          max="90"
          step="1"
          :value="gestureSharePercent"
          class="fd-input w-full accent-amber-500"
          @input="onGestureShareInput"
        />
      </label>

      <div class="grid grid-cols-2 gap-2 max-[560px]:grid-cols-1">
        <label class="grid gap-1 text-xs text-stone-600" for="assistantGestureTag">
          <span>Gesture Tag</span>
          <select
            id="assistantGestureTag"
            v-model="gestureTag"
            class="fd-input w-full rounded-md px-2 py-1.5 text-sm"
          >
            <option v-for="tag in tagOptions" :key="`assistant-gesture-tag-${tag}`" :value="tag">
              {{ formatTagLabel(tag) }}
            </option>
          </select>
        </label>

        <label class="grid gap-1 text-xs text-stone-600" for="assistantLongPoseTag">
          <span>Long Pose Tag</span>
          <select
            id="assistantLongPoseTag"
            v-model="longPoseTag"
            class="fd-input w-full rounded-md px-2 py-1.5 text-sm"
          >
            <option v-for="tag in tagOptions" :key="`assistant-long-tag-${tag}`" :value="tag">
              {{ formatTagLabel(tag) }}
            </option>
          </select>
        </label>
      </div>

      <label class="inline-flex items-center gap-2 text-xs text-stone-600">
        <input
          v-model="includeBreaks"
          type="checkbox"
          class="h-4 w-4 rounded border-amber-300/90 bg-white text-sky-500 focus-visible:ring-sky-300/80"
        />
        <span>Include scheduled breaks for longer classes.</span>
      </label>

      <BaseButton compact tone="subtle" @click="generateGuidedPlan">
        Generate Guided Plan
      </BaseButton>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import BaseButton from "../BaseButton.vue";

const props = defineProps({
  classPresetOptions: {
    type: Array,
    required: true
  },
  classPresetId: {
    type: String,
    required: true
  },
  availablePhotoTags: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(["class-assistant-generate"]);

const assistantPresetId = ref(props.classPresetId);
const gestureSharePercent = ref(60);
const gestureTag = ref("all");
const longPoseTag = ref("all");
const includeBreaks = ref(true);

const tagOptions = computed(() => ["all", ...props.availablePhotoTags]);

function normalizeTagSelection(currentTag) {
  const normalizedTag = String(currentTag || "").trim();
  if (!normalizedTag || normalizedTag === "all") {
    return "all";
  }

  return props.availablePhotoTags.includes(normalizedTag) ? normalizedTag : "all";
}

function normalizePresetSelection(currentPresetId) {
  return props.classPresetOptions.some((preset) => preset.id === currentPresetId)
    ? currentPresetId
    : props.classPresetOptions[0]?.id || props.classPresetId;
}

function onGestureShareInput(event) {
  const parsedValue = Number.parseInt(event.target.value, 10);
  if (Number.isNaN(parsedValue)) {
    return;
  }

  gestureSharePercent.value = Math.min(90, Math.max(10, parsedValue));
}

function generateGuidedPlan() {
  emit("class-assistant-generate", {
    targetPresetId: normalizePresetSelection(assistantPresetId.value),
    gestureSharePercent: gestureSharePercent.value,
    gestureTag: normalizeTagSelection(gestureTag.value),
    longPoseTag: normalizeTagSelection(longPoseTag.value),
    includeBreaks: includeBreaks.value
  });
}

function formatTagLabel(tag) {
  return tag === "all" ? "All Photos" : tag;
}

watch(
  () => props.classPresetId,
  (nextPresetId) => {
    assistantPresetId.value = normalizePresetSelection(nextPresetId);
  }
);

watch(
  () => props.availablePhotoTags,
  () => {
    gestureTag.value = normalizeTagSelection(gestureTag.value);
    longPoseTag.value = normalizeTagSelection(longPoseTag.value);
  },
  { deep: true }
);
</script>
