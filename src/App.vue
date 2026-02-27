<template>
  <component :is="activeRootComponent" />
</template>

<script setup>
import { defineAsyncComponent } from "vue";

const HostSessionApp = defineAsyncComponent(() => import("./components/HostSessionApp.vue"));
const RemoteClientApp = defineAsyncComponent(() => import("./components/RemoteClientApp.vue"));

const isRemoteClientView =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("remote") === "1";

const activeRootComponent = isRemoteClientView ? RemoteClientApp : HostSessionApp;
</script>
