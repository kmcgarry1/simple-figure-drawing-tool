<template>
  <div class="grid gap-2">
    <div class="flex items-center justify-between gap-2">
      <p class="fd-section-label">Saved Templates</p>
      <label class="grid gap-1 text-[11px] text-stone-500" for="templateSortMode">
        <span>Sort</span>
        <select
          id="templateSortMode"
          v-model="sortMode"
          class="fd-input min-w-[140px] rounded-md px-1.5 py-1 text-[11px]"
        >
          <option value="updated-desc">Recently Updated</option>
          <option value="name-asc">Name (A-Z)</option>
        </select>
      </label>
    </div>

    <div class="fd-subtle-card grid gap-2 rounded-md p-2.5">
      <label class="grid gap-1 text-xs text-stone-600" for="templateNameInput">
        <span>Template Name</span>
        <input
          id="templateNameInput"
          v-model.trim="templateName"
          type="text"
          placeholder="e.g. Morning Gesture Set"
          class="fd-input w-full rounded-md px-2 py-1.5 text-sm"
          @keydown.enter.prevent="saveTemplate"
        />
      </label>
      <BaseButton compact tone="subtle" @click="saveTemplate">Save Current Plan</BaseButton>
    </div>

    <div class="fd-subtle-card grid grid-cols-2 gap-2 rounded-md p-2.5 max-[560px]:grid-cols-1">
      <BaseButton compact tone="subtle" @click="$emit('class-template-export')">
        Export Templates
      </BaseButton>
      <input
        ref="templateImportInputRef"
        type="file"
        accept=".json,application/json"
        class="hidden"
        @change="onTemplateImportSelected"
      />
      <BaseButton compact tone="subtle" @click="openTemplateImportDialog">
        Import Templates
      </BaseButton>
    </div>

    <div v-if="classTemplates.length === 0" class="text-xs text-stone-500">
      No custom templates saved yet.
    </div>

    <section
      v-for="group in groupedTemplates"
      :key="group.id"
      class="grid gap-2"
    >
      <p class="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
        {{ group.label }}
      </p>

      <article
        v-for="template in group.templates"
        :key="template.id"
        class="fd-subtle-card grid gap-2 rounded-md p-2.5"
      >
        <label class="grid gap-1 text-xs text-stone-600" :for="`template-edit-${template.id}`">
          <span>Template Name</span>
          <input
            :id="`template-edit-${template.id}`"
            v-model.trim="templateNames[template.id]"
            type="text"
            class="fd-input w-full rounded-md px-2 py-1.5 text-sm"
            @keydown.enter.prevent="renameTemplate(template.id)"
          />
        </label>

        <p class="text-xs text-stone-500">
          {{ summarizeTemplate(template.blocks) }}
        </p>

        <div class="grid grid-cols-2 gap-2 max-[560px]:grid-cols-1">
          <BaseButton compact @click="$emit('class-template-load', template.id)">Load</BaseButton>
          <BaseButton compact tone="subtle" @click="renameTemplate(template.id)">Rename</BaseButton>
          <BaseButton compact tone="subtle" @click="$emit('class-template-duplicate', template.id)">
            Duplicate
          </BaseButton>
          <BaseButton compact tone="danger" @click="$emit('class-template-delete', template.id)">
            Delete
          </BaseButton>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { calculateClassPlanSummary } from "../../utils/classPlan";
import BaseButton from "../BaseButton.vue";

const props = defineProps({
  classTemplates: {
    type: Array,
    required: true
  }
});

const emit = defineEmits([
  "class-template-save",
  "class-template-load",
  "class-template-delete",
  "class-template-rename",
  "class-template-duplicate",
  "class-template-export",
  "class-template-import"
]);
const templateName = ref("");
const templateNames = ref({});
const templateImportInputRef = ref(null);
const sortMode = ref("updated-desc");
const RECENT_TEMPLATE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function saveTemplate() {
  emit("class-template-save", templateName.value);
  templateName.value = "";
}

function openTemplateImportDialog() {
  templateImportInputRef.value?.click();
}

function onTemplateImportSelected(event) {
  const file = event.target?.files?.[0] || null;
  emit("class-template-import", file);

  if (event.target instanceof HTMLInputElement) {
    event.target.value = "";
  }
}

function renameTemplate(templateId) {
  emit("class-template-rename", {
    templateId,
    nextName: templateNames.value[templateId]
  });
}

function summarizeTemplate(blocks) {
  const summary = calculateClassPlanSummary(blocks || []);
  const blockCount = Array.isArray(blocks) ? blocks.length : 0;
  return `${blockCount} block(s), ${summary.totalPoses} pose(s), ${summary.totalSeconds}s total`;
}

function sortedTemplates(templates, nextSortMode) {
  const list = Array.from(templates || []);
  if (nextSortMode === "name-asc") {
    return list.sort((left, right) => left.name.localeCompare(right.name));
  }

  return list.sort((left, right) =>
    String(right.updatedAt || "").localeCompare(String(left.updatedAt || ""))
  );
}

const groupedTemplates = computed(() => {
  const templates = sortedTemplates(props.classTemplates, sortMode.value);
  const recentTemplates = [];
  const olderTemplates = [];
  const recentThresholdMs = Date.now() - RECENT_TEMPLATE_WINDOW_MS;

  for (const template of templates) {
    const updatedAtMs = Date.parse(template.updatedAt || "");
    if (Number.isFinite(updatedAtMs) && updatedAtMs >= recentThresholdMs) {
      recentTemplates.push(template);
      continue;
    }

    olderTemplates.push(template);
  }

  const groups = [];
  if (recentTemplates.length > 0) {
    groups.push({
      id: "recent",
      label: "Updated In Last 7 Days",
      templates: recentTemplates
    });
  }

  if (olderTemplates.length > 0) {
    groups.push({
      id: "older",
      label: "Older Templates",
      templates: olderTemplates
    });
  }

  return groups;
});

watch(
  () => props.classTemplates,
  (nextTemplates) => {
    const nextNames = {};
    for (const template of nextTemplates) {
      nextNames[template.id] = templateNames.value[template.id] || template.name;
    }
    templateNames.value = nextNames;
  },
  { immediate: true, deep: true }
);
</script>
