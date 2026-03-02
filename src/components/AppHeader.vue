<template>
  <header class="surface-panel hero-panel relative overflow-hidden rounded-3xl px-6 py-6 max-[720px]:rounded-xl max-[720px]:px-4 max-[720px]:py-5">
    <div aria-hidden="true" class="pointer-events-none absolute inset-y-0 right-0 w-56 bg-gradient-to-l from-white/70 to-transparent" />

    <div class="relative flex flex-wrap items-start justify-between gap-6">
      <div class="grid gap-2">
        <p class="fd-section-label text-[13px]">
          Studio Session Builder
        </p>
        <h1 class="fd-title-gradient text-[clamp(1.55rem,3vw,2.2rem)] font-semibold tracking-tight">
          Figure Drawing Slideshow
        </h1>
        <p class="max-w-[58ch] text-[14px] leading-6 text-stone-600/95">
          Build quick drills or full class sessions with a clean setup flow and live stage controls.
        </p>
        <div class="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-medium text-stone-600">
          <span class="fd-chip rounded-full px-2.5 py-0.5">
            Full-screen live stage
          </span>
          <span class="fd-chip rounded-full border-emerald-300/70 bg-emerald-100/55 px-2.5 py-0.5 text-emerald-800">
            Class planning
          </span>
          <span class="fd-chip rounded-full border-orange-300/70 bg-orange-100/55 px-2.5 py-0.5 text-orange-800">
            Timed warmups
          </span>
        </div>
      </div>

      <div class="grid justify-items-end gap-2 text-xs text-stone-600">
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="fd-mode-toggle rounded-full px-3 py-1 text-[11px] font-semibold"
            @click="$emit('toggle-theme')"
          >
            {{ themeMode === "dark" ? "Light Studio" : "Dark Studio" }}
          </button>
          <span class="rounded-full border border-amber-300/65 bg-white/80 px-2.5 py-1 text-stone-700">
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
