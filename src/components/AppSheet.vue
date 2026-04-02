<template>
  <Teleport to="body">
    <Transition appear name="dialog-fade">
      <div v-if="isOpen" class="fd-dialog-backdrop fd-sheet-backdrop" @click.self="closeSheet">
        <section
          ref="dialogRef"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="description ? descriptionId : undefined"
          tabindex="-1"
          class="fd-modal-surface fd-sheet-panel"
          :class="sheetClass"
          @keydown="onDialogKeydown"
        >
          <header class="fd-sheet-header">
            <div class="grid gap-1">
              <p class="fd-section-label">{{ eyebrow }}</p>
              <h2 :id="titleId" class="fd-sheet-title">{{ title }}</h2>
              <p v-if="description" :id="descriptionId" class="fd-text-muted text-sm">
                {{ description }}
              </p>
            </div>
            <button type="button" class="fd-topbar-button" @click="closeSheet">
              Close
            </button>
          </header>
          <div class="fd-sheet-body">
            <slot />
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";

const FOCUSABLE_SELECTOR = [
  "a[href]:not([tabindex='-1'])",
  "button:not([disabled]):not([tabindex='-1'])",
  "input:not([disabled]):not([type='hidden']):not([tabindex='-1'])",
  "select:not([disabled]):not([tabindex='-1'])",
  "textarea:not([disabled]):not([tabindex='-1'])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ""
  },
  eyebrow: {
    type: String,
    default: "Panel"
  },
  placement: {
    type: String,
    default: "right"
  },
  size: {
    type: String,
    default: "medium"
  }
});

const emit = defineEmits(["close"]);
const dialogRef = ref(null);
const previousFocusedElement = ref(null);
const titleId = `app-sheet-title-${Math.random().toString(36).slice(2)}`;
const descriptionId = `app-sheet-description-${Math.random().toString(36).slice(2)}`;

const sheetClass = computed(() => [
  props.placement === "center" ? "fd-sheet-center" : "fd-sheet-right",
  props.size === "wide" ? "fd-sheet-wide" : props.size === "narrow" ? "fd-sheet-narrow" : "fd-sheet-medium"
]);

watch(
  () => props.isOpen,
  async (nextOpen) => {
    if (nextOpen) {
      previousFocusedElement.value =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      document.body.style.overflow = "hidden";
      await nextTick();
      dialogRef.value?.focus();
      return;
    }

    document.body.style.overflow = "";
    await nextTick();
    previousFocusedElement.value?.focus();
  }
);

function closeSheet() {
  emit("close");
}

function onDialogKeydown(event) {
  if (event.key === "Escape") {
    event.preventDefault();
    closeSheet();
    return;
  }

  if (event.key !== "Tab") {
    return;
  }

  const focusables = Array.from(dialogRef.value?.querySelectorAll(FOCUSABLE_SELECTOR) || []).filter(
    (element) => element instanceof HTMLElement && element.getClientRects().length > 0
  );

  if (focusables.length === 0) {
    event.preventDefault();
    dialogRef.value?.focus();
    return;
  }

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
    return;
  }

  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

onBeforeUnmount(() => {
  document.body.style.overflow = "";
});
</script>
