<template>
  <div class="grid gap-2">
    <p class="text-xs uppercase tracking-wide text-slate-400">Saved Templates</p>
    <div class="grid gap-2 rounded-md border border-slate-700 bg-slate-950/50 p-2.5">
      <label class="grid gap-1 text-xs text-slate-300" for="templateNameInput">
        <span>Template Name</span>
        <input
          id="templateNameInput"
          v-model.trim="templateName"
          type="text"
          placeholder="e.g. Morning Gesture Set"
          class="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          @keydown.enter.prevent="saveTemplate"
        />
      </label>
      <BaseButton compact tone="subtle" @click="saveTemplate">Save Current Plan</BaseButton>
    </div>

    <div v-if="classTemplates.length === 0" class="text-xs text-slate-400">
      No custom templates saved yet.
    </div>

    <article
      v-for="template in classTemplates"
      :key="template.id"
      class="grid gap-2 rounded-md border border-slate-700 bg-slate-950/50 p-2.5"
    >
      <div class="grid gap-0.5">
        <p class="text-sm font-medium text-slate-100">{{ template.name }}</p>
        <p class="text-xs text-slate-400">
          {{ summarizeTemplate(template.blocks) }}
        </p>
      </div>
      <div class="grid grid-cols-2 gap-2 max-[560px]:grid-cols-1">
        <BaseButton compact @click="$emit('class-template-load', template.id)">Load</BaseButton>
        <BaseButton compact tone="danger" @click="$emit('class-template-delete', template.id)">
          Delete
        </BaseButton>
      </div>
    </article>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { calculateClassPlanSummary } from "../../utils/classPlan";
import BaseButton from "../BaseButton.vue";

defineProps({
  classTemplates: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(["class-template-save", "class-template-load", "class-template-delete"]);
const templateName = ref("");

function saveTemplate() {
  emit("class-template-save", templateName.value);
  templateName.value = "";
}

function summarizeTemplate(blocks) {
  const summary = calculateClassPlanSummary(blocks || []);
  const blockCount = Array.isArray(blocks) ? blocks.length : 0;
  return `${blockCount} block(s), ${summary.totalPoses} pose(s), ${summary.totalSeconds}s total`;
}
</script>
