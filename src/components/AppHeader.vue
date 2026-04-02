<template>
  <header class="surface-panel fd-topbar">
    <div class="fd-topbar-row">
      <div class="fd-topbar-brand">
        <p class="fd-topbar-brandmark">Figure Drawing</p>
        <p class="fd-topbar-status">{{ settingsSaveStatusText }}</p>
      </div>

      <div class="fd-topbar-actions">
        <button type="button" class="fd-topbar-button fd-topbar-button-quiet" @click="$emit('toggle-theme')">
          <component :is="themeMode === 'dark' ? Sun : Moon" class="fd-inline-icon" aria-hidden="true" />
          {{ themeMode === "dark" ? "Light" : "Dark" }}
        </button>

        <details class="fd-topbar-menu">
          <summary class="fd-topbar-button fd-topbar-button-quiet">
            <Ellipsis class="fd-inline-icon" aria-hidden="true" />
            More
          </summary>
          <div class="fd-topbar-menu-panel">
            <a class="fd-topbar-menu-link" href="/privacy.html">Privacy</a>
            <a class="fd-topbar-menu-link" href="/changelog.html">Changelog</a>
            <p class="fd-topbar-menu-meta">Version {{ appVersion }}</p>
          </div>
        </details>
      </div>
    </div>

    <nav class="fd-topnav" aria-label="Primary">
      <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" class="fd-topnav-link">
        {{ item.label }}
      </RouterLink>
    </nav>
  </header>
</template>

<script setup>
import { computed } from "vue";
import { Ellipsis, Moon, Sun } from "lucide-vue-next";
import { RouterLink, useRouter } from "vue-router";

const router = useRouter();

defineProps({
  themeMode: {
    type: String,
    required: true
  },
  settingsSaveStatusText: {
    type: String,
    required: true
  }
});

defineEmits(["toggle-theme"]);

const appVersion = __APP_VERSION__;
const navItems = computed(() =>
  router
    .getRoutes()
    .filter((route) => route.meta?.navLabel && route.name)
    .sort((left, right) => Number(left.meta?.navOrder || 0) - Number(right.meta?.navOrder || 0))
    .map((route) => ({
      label: String(route.meta.navLabel),
      to: { name: route.name }
    }))
);
</script>
