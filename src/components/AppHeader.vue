<template>
  <header
    class="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 max-[720px]:rounded-lg"
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-[clamp(1.3rem,3vw,1.8rem)] font-semibold">Figure Drawing Slideshow</h1>
        <p class="mt-1 text-sm text-slate-400">
          Build either a quick timed drill or a full 1-3 hour life drawing class.
        </p>
      </div>

      <div class="grid justify-items-end gap-1 text-xs text-slate-300">
        <span class="rounded-full border border-slate-600 px-2 py-0.5">v{{ appVersion }}</span>
        <div class="flex items-center gap-2">
          <a
            class="text-sky-300 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            href="/privacy.html"
          >
            Privacy
          </a>
          <span aria-hidden="true">|</span>
          <a
            class="text-sky-300 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
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
