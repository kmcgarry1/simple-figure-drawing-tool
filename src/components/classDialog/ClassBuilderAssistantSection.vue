<template>
  <div class="grid gap-3">
    <div class="grid gap-1">
      <p class="fd-section-label inline-flex items-center gap-2">
        <WandSparkles class="h-4 w-4 fd-icon-accent" aria-hidden="true" />
        Planner Assistant
      </p>
      <p class="fd-text-strong text-sm font-semibold">Generate a starting structure, then refine it manually.</p>
      <p class="fd-text-muted text-sm">
        Use this only when you want a fast first draft. It stays secondary to the preset and block editor.
      </p>
    </div>

    <div class="fd-choice-grid fd-choice-grid-3">
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

    <label class="grid gap-1.5 text-sm" for="assistantGestureShare">
      <span class="fd-text-muted">Gesture Mix: {{ gestureSharePercent }}% | Long Pose {{ 100 - gestureSharePercent }}%</span>
      <input
        id="assistantGestureShare"
        type="range"
        min="10"
        max="90"
        step="1"
        :value="gestureSharePercent"
        class="fd-range-input w-full"
        @input="onGestureShareInput"
      />
    </label>

    <div class="grid gap-3 sm:grid-cols-2">
      <label class="grid gap-1.5 text-sm" for="assistantGestureTag">
        <span class="fd-text-muted">Gesture Tag</span>
        <select
          id="assistantGestureTag"
          v-model="gestureTag"
          class="fd-input w-full rounded-xl px-3 py-2 text-sm"
        >
          <option v-for="tag in tagOptions" :key="`assistant-gesture-tag-${tag}`" :value="tag">
            {{ formatTagLabel(tag) }}
          </option>
        </select>
      </label>

      <label class="grid gap-1.5 text-sm" for="assistantLongPoseTag">
        <span class="fd-text-muted">Long Pose Tag</span>
        <select
          id="assistantLongPoseTag"
          v-model="longPoseTag"
          class="fd-input w-full rounded-xl px-3 py-2 text-sm"
        >
          <option v-for="tag in tagOptions" :key="`assistant-long-tag-${tag}`" :value="tag">
            {{ formatTagLabel(tag) }}
          </option>
        </select>
      </label>
    </div>

    <label class="fd-check-inline">
      <input
        v-model="includeBreaks"
        type="checkbox"
        class="fd-check-input"
      />
      <span>Include scheduled breaks for longer classes.</span>
    </label>

    <BaseButton compact tone="subtle" @click="generateGuidedPlan">
      <WandSparkles class="mr-1 h-3.5 w-3.5" aria-hidden="true" />
      Generate Starting Plan
    </BaseButton>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { WandSparkles } from "lucide-vue-next";
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
