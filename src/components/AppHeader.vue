<template>
  <header class="surface-panel hero-panel relative overflow-hidden rounded-2xl px-5 py-5 max-[720px]:rounded-xl">
    <div
      aria-hidden="true"
      class="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full bg-cyan-300/25 blur-3xl"
    />
    <div
      aria-hidden="true"
      class="pointer-events-none absolute -left-14 bottom-0 h-36 w-36 rounded-full bg-emerald-300/20 blur-3xl"
    />
    <div
      aria-hidden="true"
      class="pointer-events-none absolute bottom-0 right-[22%] h-24 w-40 rounded-full bg-amber-300/20 blur-3xl"
    />

    <div class="relative flex flex-wrap items-start justify-between gap-4">
      <div class="grid gap-1">
        <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100/90">
          Figure Session Builder
        </p>
        <h1 class="bg-gradient-to-r from-cyan-100 via-slate-100 to-emerald-100 bg-clip-text text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-tight text-transparent">
          Figure Drawing Slideshow
        </h1>
        <p class="max-w-[58ch] text-sm text-slate-200/90">
          Build either a quick timed drill or a full 1-3 hour life drawing class.
        </p>
        <div class="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-medium">
          <span class="rounded-full border border-cyan-300/50 bg-cyan-400/10 px-2 py-0.5 text-cyan-100">
            Full-screen live stage
          </span>
          <span class="rounded-full border border-emerald-300/45 bg-emerald-400/10 px-2 py-0.5 text-emerald-100">
            Wizard setup flow
          </span>
          <span class="rounded-full border border-amber-300/45 bg-amber-400/10 px-2 py-0.5 text-amber-100">
            Quick random drills
          </span>
        </div>
      </div>

      <div class="grid justify-items-end gap-1.5 text-xs text-slate-300">
        <span class="rounded-full border border-cyan-300/45 bg-slate-950/65 px-2.5 py-0.5 text-cyan-100/90">
          v{{ appVersion }}
        </span>
        <div class="flex items-center gap-2">
          <a
            class="text-cyan-100/90 underline-offset-2 transition-colors hover:text-cyan-50 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
            href="/privacy.html"
          >
            Privacy
          </a>
          <span aria-hidden="true">|</span>
          <a
            class="text-cyan-100/90 underline-offset-2 transition-colors hover:text-cyan-50 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
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
