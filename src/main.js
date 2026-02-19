import { createApp } from "vue";
import * as Sentry from "@sentry/vue";
import { inject } from "@vercel/analytics";
import { injectSpeedInsights } from "@vercel/speed-insights";
import App from "./App.vue";
import "./tailwind.css";

const app = createApp(App);

if (import.meta.env.PROD) {
  inject();
  injectSpeedInsights();
}

if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  const tracesSampleRate = Number.parseFloat(
    import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || "0"
  );

  Sentry.init({
    app,
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: Number.isFinite(tracesSampleRate)
      ? Math.max(0, Math.min(1, tracesSampleRate))
      : 0
  });
}

app.mount("#app");
