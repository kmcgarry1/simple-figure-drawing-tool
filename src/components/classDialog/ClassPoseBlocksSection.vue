<template>
  <div class="grid gap-2.5">
    <p class="fd-section-label">Class Blocks</p>
    <article
      v-for="(block, index) in props.classBlocks"
      :key="`pose-block-${index}`"
      class="fd-subtle-card grid gap-2.5 rounded-lg p-3"
    >
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div class="min-w-0 grid gap-1">
          <div class="flex flex-wrap items-center gap-1.5">
            <p class="truncate text-sm font-semibold text-stone-800">{{ blockHeading(block, index) }}</p>
            <span class="rounded-full border border-amber-300/75 bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-stone-700">
              {{ blockTypeBadgeLabel(block) }}
            </span>
          </div>
          <p class="text-xs text-stone-600">{{ blockSummaryText(block) }}</p>
        </div>
        <div class="flex items-center gap-1.5">
          <button
            type="button"
            class="rounded-md border border-amber-300/75 bg-white/84 px-2 py-1 text-[11px] font-semibold text-stone-700 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/80"
            :aria-expanded="isBlockExpanded(index) ? 'true' : 'false'"
            @click="toggleBlockDetails(index)"
          >
            {{ isBlockExpanded(index) ? "Hide Details" : "Edit Details" }}
          </button>
          <button
            type="button"
            class="rounded-md border border-red-400/85 bg-red-500 px-2 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-45"
            :disabled="props.classBlocks.length <= 1"
            @click="$emit('class-block-remove', index)"
          >
            Remove
          </button>
        </div>
      </div>

      <div v-if="isBlockExpanded(index)" class="grid gap-2 rounded-lg border border-amber-200/70 bg-white/80 p-2.5">
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
            <option v-for="tag in props.availablePhotoTags" :key="`tag-${tag}`" :value="tag">{{ tag }}</option>
          </select>
        </label>
      </div>
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
import { ref, watch } from "vue";
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
const expandedBlockIndexes = ref(new Set([0]));

watch(
  () => props.classBlocks.length,
  (nextLength, previousLength = 0) => {
    const nextExpanded = new Set(
      Array.from(expandedBlockIndexes.value).filter((index) => index < nextLength)
    );

    if (nextLength > previousLength) {
      nextExpanded.add(nextLength - 1);
    }

    if (nextExpanded.size === 0 && nextLength > 0) {
      nextExpanded.add(0);
    }

    expandedBlockIndexes.value = nextExpanded;
  },
  { immediate: true }
);

function isBlockExpanded(index) {
  return expandedBlockIndexes.value.has(index);
}

function toggleBlockDetails(index) {
  const nextExpanded = new Set(expandedBlockIndexes.value);
  if (nextExpanded.has(index)) {
    nextExpanded.delete(index);
  } else {
    nextExpanded.add(index);
  }

  expandedBlockIndexes.value = nextExpanded;
}

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

  const baseSummary = `${countLabel} · ${durationSeconds}s each · Total ${totalDurationText}`;
  if (blockType === "break") {
    return baseSummary;
  }

  return `${baseSummary} · Tag: ${resolvePhotoTagLabel(block.photoTag)}`;
}
</script>
