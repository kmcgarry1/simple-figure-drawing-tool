<template>
  <header class="surface-panel hero-panel relative overflow-hidden rounded-2xl px-5 py-5 max-[720px]:rounded-xl">
    <div
      aria-hidden="true"
      class="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full bg-sky-300/28 blur-3xl"
    />
    <div
      aria-hidden="true"
      class="pointer-events-none absolute -left-14 bottom-0 h-36 w-36 rounded-full bg-emerald-300/24 blur-3xl"
    />
    <div
      aria-hidden="true"
      class="pointer-events-none absolute bottom-0 right-[22%] h-24 w-40 rounded-full bg-orange-300/28 blur-3xl"
    />
    <div
      aria-hidden="true"
      class="pointer-events-none absolute left-5 top-0 h-1 w-32 rounded-b-full bg-gradient-to-r from-sky-300 via-emerald-300 to-orange-300 opacity-80"
    />

    <div class="relative flex flex-wrap items-start justify-between gap-4">
      <div class="grid gap-1">
        <p class="fd-section-label text-[13px]">
          Warm Studio Session Builder
        </p>
        <h1 class="fd-title-gradient text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-tight">
          Figure Drawing Slideshow
        </h1>
        <p class="max-w-[58ch] text-sm text-stone-600">
          Build quick drills or full class sessions with a studio-focused flow and live stage controls.
        </p>
        <div class="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-medium text-stone-600">
          <span class="fd-chip rounded-full px-2 py-0.5">
            Full-screen live stage
          </span>
          <span class="fd-chip rounded-full border-emerald-300/70 bg-emerald-100/55 px-2 py-0.5 text-emerald-800">
            Guided class builder
          </span>
          <span class="fd-chip rounded-full border-orange-300/70 bg-orange-100/55 px-2 py-0.5 text-orange-800">
            Randomized warmups
          </span>
        </div>
      </div>

      <div class="grid justify-items-end gap-1.5 text-xs text-stone-600">
        <div class="flex items-center gap-1.5">
          <button
            type="button"
            class="fd-mode-toggle rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            @click="$emit('toggle-theme')"
          >
            {{ themeMode === "dark" ? "Light Studio" : "Dark Studio" }}
          </button>
          <span class="rounded-full border border-amber-300/65 bg-white/75 px-2.5 py-0.5 text-stone-700 shadow-sm">
            v{{ appVersion }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <a
            class="text-stone-700 underline-offset-2 transition-colors hover:text-rose-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/80"
            href="/privacy.html"
          >
            Privacy
          </a>
          <span aria-hidden="true">|</span>
          <a
            class="text-stone-700 underline-offset-2 transition-colors hover:text-rose-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/80"
            href="/changelog.html"
          >
            Changelog
          </a>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
defineProps({
  themeMode: {
    type: String,
    required: true
  }
});

defineEmits(["toggle-theme"]);

const appVersion = __APP_VERSION__;
</script>
