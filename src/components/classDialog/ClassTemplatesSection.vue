<template>
  <div class="grid gap-4">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div class="grid gap-1">
        <p class="fd-section-label inline-flex items-center gap-1.5">
          <Save class="h-4 w-4 fd-icon-accent" aria-hidden="true" />
          Saved Templates
        </p>
        <p class="fd-text-strong text-sm font-semibold">Save, reuse, and sync class structures.</p>
      </div>

      <label class="grid gap-1.5 text-sm" for="templateSortMode">
        <span class="fd-text-muted">Sort</span>
        <select
          id="templateSortMode"
          v-model="sortMode"
          class="fd-input min-w-[180px] rounded-xl px-3 py-2 text-sm"
        >
          <option value="updated-desc">Recently Updated</option>
          <option value="name-asc">Name (A-Z)</option>
        </select>
      </label>
    </div>

    <p class="fd-text-muted text-sm">
      Keep recurring formats close at hand. Sync stays optional and does not change the saved payload shape.
    </p>

    <section class="fd-subtle-card grid gap-3 rounded-2xl p-4">
      <div class="grid gap-1">
        <p class="fd-text-strong text-sm font-semibold">Save current plan</p>
        <p class="fd-text-muted text-sm">Capture the current block structure under a reusable name.</p>
      </div>

      <label class="grid gap-1.5 text-sm" for="templateNameInput">
        <span class="fd-text-muted">Template Name</span>
        <input
          id="templateNameInput"
          v-model.trim="templateName"
          type="text"
          placeholder="Morning gesture set"
          class="fd-input w-full rounded-xl px-3 py-2 text-sm"
          @keydown.enter.prevent="saveTemplate"
        />
      </label>

      <BaseButton compact tone="subtle" @click="saveTemplate">
        <Save class="mr-1 h-3.5 w-3.5" aria-hidden="true" />
        Save Current Plan
      </BaseButton>
    </section>

    <section class="fd-subtle-card grid gap-3 rounded-2xl p-4">
      <div class="grid gap-1">
        <p class="fd-text-strong text-sm font-semibold">Transfer templates</p>
        <p class="fd-text-muted text-sm">Export or import template JSON without changing the storage format.</p>
      </div>

      <div class="grid gap-2 sm:grid-cols-2">
        <BaseButton compact tone="subtle" @click="$emit('class-template-export')">
          <Download class="mr-1 h-3.5 w-3.5" aria-hidden="true" />
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
          <Upload class="mr-1 h-3.5 w-3.5" aria-hidden="true" />
          Import Templates
        </BaseButton>
      </div>
    </section>

    <section class="fd-subtle-card grid gap-3 rounded-2xl p-4">
      <div class="grid gap-1">
        <p class="fd-text-strong inline-flex items-center gap-1.5 text-sm font-semibold">
          <component
            :is="classTemplateSyncEnabled ? CloudUpload : CloudOff"
            class="h-3.5 w-3.5 fd-icon-accent"
            aria-hidden="true"
          />
          Cross-device sync
        </p>
        <p class="fd-text-muted text-sm">
          {{
            classTemplateSyncEnabled
              ? "Use a shared key on each device, then push or pull the template set."
              : "Sync is unavailable here. Local template save, import, and export still work."
          }}
        </p>
      </div>

      <label class="grid gap-1.5 text-sm" for="templateSyncKeyInput">
        <span class="fd-text-muted">Sync Key</span>
        <input
          id="templateSyncKeyInput"
          v-model.trim="templateSyncKeyInput"
          type="text"
          :disabled="!classTemplateSyncEnabled"
          placeholder="studio-team-1"
          class="fd-input w-full rounded-xl px-3 py-2 text-sm"
        />
      </label>

      <div class="grid gap-2 sm:grid-cols-2">
        <BaseButton compact tone="subtle" :disabled="!canSyncTemplates" @click="$emit('class-template-sync-push')">
          <CloudUpload class="mr-1 h-3.5 w-3.5" aria-hidden="true" />
          Push To Sync
        </BaseButton>
        <BaseButton compact tone="subtle" :disabled="!canSyncTemplates" @click="$emit('class-template-sync-pull')">
          <CloudDownload class="mr-1 h-3.5 w-3.5" aria-hidden="true" />
          Pull From Sync
        </BaseButton>
      </div>
    </section>

    <div v-if="classTemplates.length === 0" class="fd-inline-note">
      <p class="fd-text-strong text-sm font-semibold">No saved templates yet.</p>
      <p class="fd-text-muted text-sm">Save the current class plan here once the structure is ready.</p>
    </div>

    <section
      v-for="group in groupedTemplates"
      :key="group.id"
      class="grid gap-2"
    >
      <p class="fd-kicker">{{ group.label }}</p>

      <article
        v-for="template in group.templates"
        :key="template.id"
        class="fd-list-row"
      >
        <div class="grid gap-1">
          <p class="fd-text-strong text-sm font-semibold">{{ template.name }}</p>
          <p class="fd-text-muted text-sm">{{ summarizeTemplate(template.blocks) }}</p>
        </div>

        <label class="grid gap-1.5 text-sm" :for="`template-edit-${template.id}`">
          <span class="fd-text-muted">Template Name</span>
          <input
            :id="`template-edit-${template.id}`"
            v-model.trim="templateNames[template.id]"
            type="text"
            class="fd-input w-full rounded-xl px-3 py-2 text-sm"
            @keydown.enter.prevent="renameTemplate(template.id)"
          />
        </label>

        <div class="grid gap-2 sm:grid-cols-2">
          <BaseButton compact tone="subtle" @click="$emit('class-template-load', template.id)">
            <FolderOpenDot class="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            Load
          </BaseButton>
          <BaseButton compact tone="subtle" @click="renameTemplate(template.id)">
            <Pencil class="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            Rename
          </BaseButton>
          <BaseButton compact tone="subtle" @click="$emit('class-template-duplicate', template.id)">
            <CopyPlus class="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            Duplicate
          </BaseButton>
          <BaseButton compact tone="danger" @click="$emit('class-template-delete', template.id)">
            <Trash2 class="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            Delete
          </BaseButton>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import {
  CloudDownload,
  CloudOff,
  CloudUpload,
  CopyPlus,
  Download,
  FolderOpenDot,
  Pencil,
  Save,
  Trash2,
  Upload
} from "lucide-vue-next";
import { calculateClassPlanSummary } from "../../utils/classPlan";
import BaseButton from "../BaseButton.vue";

const props = defineProps({
  classTemplates: {
    type: Array,
    required: true
  },
  classTemplateSyncEnabled: {
    type: Boolean,
    required: true
  },
  classTemplateSyncKey: {
    type: String,
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
  "class-template-import",
  "class-template-sync-key-change",
  "class-template-sync-pull",
  "class-template-sync-push"
]);
const templateName = ref("");
const templateNames = ref({});
const templateSyncKeyInput = ref(props.classTemplateSyncKey || "");
const templateImportInputRef = ref(null);
const sortMode = ref("updated-desc");
const RECENT_TEMPLATE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const canSyncTemplates = computed(
  () => props.classTemplateSyncEnabled && templateSyncKeyInput.value.trim().length > 0
);

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
  return `${blockCount} block(s) | ${summary.totalPoses} pose(s) | ${summary.totalSeconds}s total`;
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

watch(
  () => props.classTemplateSyncKey,
  (nextSyncKey) => {
    const normalizedNextSyncKey = String(nextSyncKey || "").trim();
    if (normalizedNextSyncKey === templateSyncKeyInput.value) {
      return;
    }

    templateSyncKeyInput.value = normalizedNextSyncKey;
  },
  { immediate: true }
);

watch(templateSyncKeyInput, (nextSyncKey) => {
  emit("class-template-sync-key-change", nextSyncKey);
});
</script>
