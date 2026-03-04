<template>
  <header class="surface-panel hero-panel fd-hero-canvas relative overflow-hidden rounded-[2rem] px-6 py-6 max-[720px]:rounded-xl max-[720px]:px-4 max-[720px]:py-5">
    <div
      aria-hidden="true"
      class="fd-header-glow pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-gradient-to-b from-white/70 via-white/22 to-transparent blur-2xl"
    />
    <div
      aria-hidden="true"
      class="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-gradient-to-tr from-amber-200/45 via-orange-200/22 to-transparent blur-2xl"
    />

    <div class="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div class="grid content-start gap-3">
        <p class="fd-section-label text-[12px]">
          Figure Studio 2.0
        </p>
        <h1 class="fd-title-gradient text-[clamp(1.62rem,3vw,2.26rem)] font-semibold tracking-tight">
          Figure Drawing Slideshow
        </h1>
        <p class="fd-text-muted max-w-[64ch] text-[14px] leading-6">
          Build intentional quick drills and full class sessions with a guided setup flow, cleaner live controls,
          and stronger remote pairing diagnostics.
        </p>
        <div aria-hidden="true" class="fd-hero-palette">
          <span class="fd-palette-swatch fd-palette-sky" />
          <span class="fd-palette-swatch fd-palette-mint" />
          <span class="fd-palette-swatch fd-palette-peach" />
          <span class="fd-palette-swatch fd-palette-gold" />
          <span class="fd-text-caption text-[11px] tracking-[0.08em] uppercase">Studio Pigments</span>
        </div>
        <div class="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-medium">
          <span class="fd-chip fd-chip-art rounded-full px-2.5 py-0.5">
            Curated Setup Wizard
          </span>
          <span class="fd-chip fd-chip-art rounded-full px-2.5 py-0.5">
            Full-Screen Stage
          </span>
          <span class="fd-chip fd-chip-art rounded-full px-2.5 py-0.5">
            Cross-Device Pairing
          </span>
        </div>
      </div>

      <aside class="grid content-start gap-2">
        <div class="fd-callout fd-callout-art grid gap-1.5 rounded-2xl px-3.5 py-3">
          <div class="flex items-center justify-between gap-2">
            <p class="fd-kicker">Workspace</p>
            <span class="fd-chip fd-chip-art rounded-full px-2.5 py-1 text-[11px] font-semibold">v{{ appVersion }}</span>
          </div>
          <p class="fd-text-body text-[12px] leading-5">
            Session planning, run previews, and controls tuned for fast studio setup.
          </p>
        </div>

        <button
          type="button"
          class="fd-mode-toggle fd-mode-toggle-art rounded-xl px-3 py-2 text-[12px] font-semibold"
          @click="$emit('toggle-theme')"
        >
          {{ themeMode === "dark" ? "Light Studio" : "Dark Studio" }}
        </button>

        <div class="fd-subtle-card fd-studio-linkbar flex items-center justify-center gap-2 rounded-xl px-2.5 py-2 text-[12px]">
          <a
            class="fd-text-body underline-offset-2 transition-colors hover:text-rose-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/80"
            href="/privacy.html"
          >
            Privacy
          </a>
          <span aria-hidden="true" class="fd-text-caption">|</span>
          <a
            class="fd-text-body underline-offset-2 transition-colors hover:text-rose-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/80"
            href="/changelog.html"
          >
            Changelog
          </a>
        </div>
      </aside>
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
