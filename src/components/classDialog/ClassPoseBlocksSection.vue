<template>
  <div class="grid gap-3">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="grid gap-1">
        <p class="fd-section-label inline-flex items-center gap-2">
          <ListOrdered class="h-4 w-4 fd-icon-accent" aria-hidden="true" />
          Class Blocks
        </p>
        <p class="fd-text-muted text-sm">
          Build the class in order. Every block stays visible so timing and tags are easy to review.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <span class="fd-chip rounded-full px-2.5 py-1 text-xs font-semibold">{{ classBlocks.length }} blocks</span>
        <span class="fd-chip rounded-full px-2.5 py-1 text-xs font-semibold">{{ totalDurationLabel }}</span>
      </div>
    </div>

    <article
      v-for="(block, index) in props.classBlocks"
      :key="`pose-block-${index}`"
      class="fd-subtle-card grid gap-3 rounded-2xl p-4"
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0 grid gap-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="fd-chip rounded-full px-2 py-1 text-xs font-semibold">
              {{ index + 1 }}
            </span>
            <p class="fd-text-strong truncate text-sm font-semibold">{{ blockHeading(block, index) }}</p>
            <span class="fd-badge-ready rounded-full px-2 py-1 text-xs font-semibold">
              {{ blockTypeBadgeLabel(block) }}
            </span>
          </div>
          <p class="fd-text-muted text-sm">{{ blockSummaryText(block) }}</p>
        </div>
        <BaseButton compact tone="danger" :disabled="props.classBlocks.length <= 1" @click="$emit('class-block-remove', index)">
          <Trash2 class="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
          Remove
        </BaseButton>
      </div>

      <div class="fd-card grid gap-3 rounded-2xl p-4">
        <label class="grid gap-1.5 text-sm">
          <span class="fd-text-muted">Block Type</span>
          <div class="fd-segmented max-w-[280px]" role="group" :aria-label="`Block type for ${blockHeading(block, index)}`">
            <button
              type="button"
              class="fd-segmented-option"
              :class="{ 'is-active': resolveBlockType(block) === 'pose' }"
              :aria-pressed="resolveBlockType(block) === 'pose' ? 'true' : 'false'"
              @click="onBlockTypeButtonClick(index, 'pose')"
            >
              Pose Block
            </button>
            <button
              type="button"
              class="fd-segmented-option"
              :class="{ 'is-active': resolveBlockType(block) === 'break' }"
              :aria-pressed="resolveBlockType(block) === 'break' ? 'true' : 'false'"
              @click="onBlockTypeButtonClick(index, 'break')"
            >
              Break Block
            </button>
          </div>
        </label>

        <label class="grid gap-1.5 text-sm">
          <span class="fd-text-muted">Block Name</span>
          <input
            type="text"
            :value="block.label"
            class="fd-input w-full rounded-xl px-3 py-2 text-sm"
            @input="onBlockLabelInput(index, $event)"
          />
        </label>

        <div class="grid gap-3 sm:grid-cols-2">
          <label class="grid gap-1.5 text-sm">
            <span class="fd-text-muted">{{ resolveBlockType(block) === "break" ? "Seconds Per Break" : "Seconds Per Pose" }}</span>
            <input
              type="number"
              min="5"
              max="7200"
              :value="block.durationSeconds"
              class="fd-input w-full rounded-xl px-3 py-2 text-sm"
              @change="onBlockDurationChange(index, $event)"
            />
          </label>

          <label class="grid gap-1.5 text-sm">
            <span class="fd-text-muted">{{ resolveBlockType(block) === "break" ? "Break Count" : "Pose Count" }}</span>
            <input
              type="number"
              min="1"
              max="200"
              :value="block.poseCount"
              class="fd-input w-full rounded-xl px-3 py-2 text-sm"
              @change="onBlockCountChange(index, $event)"
            />
          </label>
        </div>

        <label v-if="resolveBlockType(block) === 'pose'" class="grid gap-1.5 text-sm">
          <span class="fd-text-muted">Photo Tag</span>
          <select
            :value="block.photoTag || 'all'"
            class="fd-input w-full rounded-xl px-3 py-2 text-sm"
            @change="onBlockPhotoTagChange(index, $event)"
          >
            <option value="all">All Photos</option>
            <option v-for="tag in props.availablePhotoTags" :key="`tag-${tag}`" :value="tag">{{ tag }}</option>
          </select>
        </label>
      </div>
    </article>

    <div class="grid gap-2 sm:grid-cols-2">
      <BaseButton compact tone="subtle" @click="$emit('class-block-add', 'pose')">
        <UserRound class="mr-1 h-3.5 w-3.5" aria-hidden="true" />
        Add Pose Block
      </BaseButton>
      <BaseButton compact tone="subtle" @click="$emit('class-block-add', 'break')">
        <Coffee class="mr-1 h-3.5 w-3.5" aria-hidden="true" />
        Add Break Block
      </BaseButton>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { Coffee, ListOrdered, Trash2, UserRound } from "lucide-vue-next";
import { formatDurationShort } from "../../composables/figureSession/formatters";
import BaseButton from "../BaseButton.vue";

const props = defineProps({
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
const totalDurationLabel = computed(() => {
  const totalSeconds = props.classBlocks.reduce((sum, block) => {
    return sum + resolveBlockCount(block) * resolveBlockDurationSeconds(block);
  }, 0);

  return `${formatDurationShort(totalSeconds)} total`;
});

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

function onBlockTypeButtonClick(index, value) {
  emit("class-block-update", {
    index,
    field: "blockType",
    value
  });
}

function resolveBlockType(block) {
  return String(block?.blockType || "").trim().toLowerCase() === "break" ? "break" : "pose";
}

function resolvePositiveInteger(value, fallback) {
  const parsedValue = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return fallback;
  }

  return parsedValue;
}

function resolveBlockDurationSeconds(block) {
  return resolvePositiveInteger(block?.durationSeconds, 5);
}

function resolveBlockCount(block) {
  return resolvePositiveInteger(block?.poseCount, 1);
}

function resolvePhotoTagLabel(photoTag) {
  const normalizedPhotoTag = String(photoTag || "").trim();
  return normalizedPhotoTag.length > 0 ? normalizedPhotoTag : "All Photos";
}

function blockTypeBadgeLabel(block) {
  return resolveBlockType(block) === "break" ? "Break" : "Pose";
}

function blockHeading(block, index) {
  const normalizedLabel = String(block?.label || "").trim();
  if (normalizedLabel.length > 0) {
    return normalizedLabel;
  }

  return `${blockTypeBadgeLabel(block)} Block ${index + 1}`;
}

function blockSummaryText(block) {
  const blockType = resolveBlockType(block);
  const count = resolveBlockCount(block);
  const durationSeconds = resolveBlockDurationSeconds(block);
  const totalDurationText = formatDurationShort(count * durationSeconds);

  const countLabel =
    blockType === "break"
      ? `${count} break${count === 1 ? "" : "s"}`
      : `${count} pose${count === 1 ? "" : "s"}`;

  const baseSummary = `${countLabel} | ${durationSeconds}s each | Total ${totalDurationText}`;
  if (blockType === "break") {
    return baseSummary;
  }

  return `${baseSummary} | Tag: ${resolvePhotoTagLabel(block.photoTag)}`;
}
</script>
