<template>
  <section class="fd-page">
    <div class="fd-page-heading">
      <p class="fd-section-label">{{ pageEyebrow }}</p>
      <h1 class="fd-page-title">{{ pageTitle }}</h1>
      <p class="fd-text-muted text-base">{{ pageDescription }}</p>
    </div>

    <div class="grid gap-4 xl:grid-cols-3">
      <section class="fd-page-panel fd-panel-welcome">
        <div class="grid gap-1">
          <p class="fd-section-label">Add Photos</p>
          <p class="fd-text-strong text-lg font-semibold">Build the source pool</p>
          <p class="fd-text-muted text-sm">
            Upload files or a folder, then tag and reorder only after the source pool is ready.
          </p>
        </div>

        <div
          class="fd-dropzone"
          :class="{ 'is-drag-active': isDragActive }"
          @dragenter.prevent="isDragActive = true"
          @dragover.prevent="isDragActive = true"
          @dragleave.prevent="isDragActive = false"
          @drop="onFileDrop"
        >
          <div class="grid gap-2">
            <p class="fd-text-strong text-base font-semibold">
              {{ studioDraft.photoCount > 0 ? `${studioDraft.photoCount} photos ready` : "Drop images here" }}
            </p>
            <p class="fd-text-muted text-sm">
              Accepted formats: {{ session.fileInputAccept }}
            </p>
          </div>

          <div class="grid gap-2 sm:grid-cols-2">
            <label class="fd-dropzone-action" for="studioPhotoInput">
              <Images class="fd-inline-icon" aria-hidden="true" />
              Add Image Files
            </label>
            <label class="fd-dropzone-action fd-dropzone-action-subtle" for="studioFolderInput">
              <FolderOpen class="fd-inline-icon" aria-hidden="true" />
              Choose Folder
            </label>
          </div>

          <input
            id="studioPhotoInput"
            type="file"
            :accept="session.fileInputAccept"
            multiple
            class="sr-only"
            @change="onFilesSelected"
          />
          <input
            id="studioFolderInput"
            type="file"
            :accept="session.fileInputAccept"
            multiple
            webkitdirectory
            directory
            class="sr-only"
            @change="onFilesSelected"
          />
        </div>

        <div class="fd-upload-status">
          <p class="fd-text-body text-sm" role="status" aria-live="polite">{{ session.statusMessage.value }}</p>
          <p v-if="session.uploadNotice.value" class="fd-text-muted text-sm">{{ session.uploadNotice.value }}</p>
        </div>

        <BaseButton
          v-if="studioDraft.hasSourcePhotos"
          compact
          tone="subtle"
          @click="openLibraryDrawer"
        >
          <LibraryBig class="fd-inline-icon-sm" aria-hidden="true" />
          Manage Library
        </BaseButton>
      </section>

      <section class="fd-page-panel fd-panel-quiet">
        <div class="grid gap-1">
          <p class="fd-section-label">Session Setup</p>
          <p class="fd-text-strong text-lg font-semibold">Choose the session mode</p>
          <p class="fd-text-muted text-sm">Quick keeps setup in one place. Class opens the planner.</p>
        </div>

        <div class="fd-segmented" role="group" aria-label="Session mode">
          <button
            type="button"
            class="fd-segmented-option"
            :class="{ 'is-active': session.sessionMode.value === 'quick' }"
            :aria-pressed="session.sessionMode.value === 'quick' ? 'true' : 'false'"
            @click="session.setSessionMode('quick')"
          >
            Quick Practice
          </button>
          <button
            type="button"
            class="fd-segmented-option"
            :class="{ 'is-active': session.sessionMode.value === 'class' }"
            :aria-pressed="session.sessionMode.value === 'class' ? 'true' : 'false'"
            @click="switchToClassMode"
          >
            Class Planning
          </button>
        </div>

        <div v-if="session.sessionMode.value === 'quick'" class="fd-subtle-card grid gap-3 rounded-2xl p-4">
          <p class="fd-text-strong text-base font-semibold">Quick timing</p>
          <p class="fd-text-muted text-sm">Keep the setup lightweight, then start directly from the final panel.</p>
          <DurationInput
            id="studioDurationInput"
            label="Seconds per photo"
            :value="session.durationSeconds.value"
            compact
            @update="updateDuration"
            @commit="session.applyDurationChange"
          />
        </div>

        <div v-else class="fd-subtle-card grid gap-3 rounded-2xl p-4">
          <div class="grid gap-1">
            <p class="fd-text-strong text-base font-semibold">Class summary</p>
            <p class="fd-text-muted text-sm">
              {{
                studioDraft.classSummary.hasClassPlan
                  ? `${studioDraft.classSummary.poseCount} poses | ${studioDraft.classSummary.totalMinutesText}`
                  : "No class plan yet."
              }}
            </p>
            <p class="fd-text-muted text-sm">{{ studioDraft.classSummary.deltaText }}</p>
          </div>
          <BaseButton tone="subtle" @click="router.push('/class')">
            <ArrowUpRight class="fd-inline-icon-sm" aria-hidden="true" />
            Open Class Planner
          </BaseButton>
        </div>
      </section>

      <section class="fd-page-panel fd-panel-primary">
        <div class="grid gap-1">
          <p class="fd-section-label">Start Session</p>
          <p class="fd-text-strong text-lg font-semibold">
            {{ session.sessionMode.value === "quick" ? "Preview the first slides" : "Review stays in the class planner" }}
          </p>
          <p class="fd-text-muted text-sm">
            {{
              session.sessionMode.value === "quick"
                ? studioDraft.previewSummaryText
                : "Class launch stays in Review. Use Session Setup when you are ready to continue."
            }}
          </p>
        </div>

        <div
          v-if="session.sessionMode.value === 'quick' && studioDraft.previewItems.length > 0"
          class="grid gap-2"
        >
          <article
            v-for="item in studioDraft.previewItems"
            :key="item.id"
            class="fd-subtle-card flex items-start justify-between gap-3 rounded-2xl px-4 py-3"
          >
            <div class="grid gap-0.5">
              <p class="fd-text-strong text-sm font-semibold">{{ item.title }}</p>
              <p class="fd-text-muted text-sm">{{ item.subtitle }}</p>
            </div>
            <span class="fd-chip rounded-full px-2.5 py-1 text-xs font-semibold">{{ item.durationText }}</span>
          </article>
        </div>
        <p v-else-if="session.sessionMode.value === 'quick'" class="fd-text-muted text-sm">
          Add references to generate the preview.
        </p>
        <div v-else class="fd-inline-note">
          <p class="fd-text-strong text-sm font-semibold">No duplicate launch action here.</p>
          <p class="fd-text-muted text-sm">Keep building the class in the planner, then start from the Review step.</p>
        </div>

        <div class="grid gap-2">
          <BaseButton
            v-if="session.sessionMode.value === 'quick'"
            :disabled="!studioDraft.canStartQuickSession"
            @click="session.startFreshSession"
          >
            {{ session.startActionLabel.value }}
          </BaseButton>

          <BaseButton
            v-if="session.sessionMode.value === 'quick'"
            compact
            tone="subtle"
            :disabled="!studioDraft.hasSourcePhotos"
            @click="session.createNewRandomSet"
          >
            <Shuffle class="fd-inline-icon-sm" aria-hidden="true" />
            {{ session.regenerateActionLabel.value }}
          </BaseButton>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { ArrowUpRight, FolderOpen, Images, LibraryBig, Shuffle } from "lucide-vue-next";
import { useRoute, useRouter } from "vue-router";
import BaseButton from "../components/BaseButton.vue";
import DurationInput from "../components/DurationInput.vue";
import { useHostSessionContext } from "../composables/useHostSessionContext";

const router = useRouter();
const route = useRoute();
const { session, viewModels, openLibraryDrawer } = useHostSessionContext();
const isDragActive = ref(false);

const studioDraft = viewModels.studioDraft;
const pageEyebrow = computed(() => String(route.meta.navLabel || "Studio"));
const pageTitle = computed(() => String(route.meta.pageTitle || "Add references, set timing, start drawing."));
const pageDescription = computed(() =>
  String(
    route.meta.pageDescription ||
      "Quick practice is the default path. Class planning lives in its own workspace."
  )
);

function updateDuration(value) {
  session.durationSeconds.value = value;
}

function handleSelectedFiles(fileList) {
  session.handlePhotoSelection(fileList);
}

function onFilesSelected(event) {
  handleSelectedFiles(event.target?.files || []);
  if (event.target instanceof HTMLInputElement) {
    event.target.value = "";
  }
}

function onFileDrop(event) {
  event.preventDefault();
  isDragActive.value = false;
  handleSelectedFiles(event.dataTransfer?.files || []);
}

function switchToClassMode() {
  session.setSessionMode("class");
}

onMounted(() => {
  if (session.sessionMode.value !== "quick") {
    session.setSessionMode("quick");
  }
});
</script>
