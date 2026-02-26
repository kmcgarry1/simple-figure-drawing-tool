<template>
  <header class="surface-panel relative overflow-hidden rounded-2xl px-5 py-4 max-[720px]:rounded-xl">
    <div
      aria-hidden="true"
      class="pointer-events-none absolute -right-14 -top-16 h-36 w-36 rounded-full bg-amber-300/20 blur-3xl"
    />
    <div
      aria-hidden="true"
      class="pointer-events-none absolute -left-14 bottom-0 h-32 w-32 rounded-full bg-teal-300/20 blur-3xl"
    />

    <div class="relative flex flex-wrap items-start justify-between gap-4">
      <div class="grid gap-1">
        <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-200/90">
          Figure Session Builder
        </p>
        <h1 class="text-[clamp(1.35rem,2.8vw,1.95rem)] font-semibold tracking-tight">
          Figure Drawing Slideshow
        </h1>
        <p class="text-sm text-slate-300">
          Build either a quick timed drill or a full 1-3 hour life drawing class.
        </p>
      </div>

      <div class="grid justify-items-end gap-1.5 text-xs text-slate-300">
        <span class="rounded-full border border-slate-500/80 bg-slate-900/70 px-2.5 py-0.5">v{{ appVersion }}</span>
        <div class="flex items-center gap-2">
          <a
            class="text-teal-200 underline-offset-2 transition-colors hover:text-teal-100 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
            href="/privacy.html"
          >
            Privacy
          </a>
          <span aria-hidden="true">|</span>
          <a
            class="text-teal-200 underline-offset-2 transition-colors hover:text-teal-100 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
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
const appVersion = __APP_VERSION__;
</script>
