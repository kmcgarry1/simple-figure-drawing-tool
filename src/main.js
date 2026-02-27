import { createApp } from "vue";
import App from "./App.vue";
import "./tailwind.css";

const app = createApp(App);

if (import.meta.env.PROD) {
  void import("@vercel/analytics")
    .then(({ inject }) => {
      inject();
    })
    .catch(() => {});

  void import("@vercel/speed-insights")
    .then(({ injectSpeedInsights }) => {
      injectSpeedInsights();
    })
    .catch(() => {});
}

if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  const tracesSampleRate = Number.parseFloat(
    import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || "0"
  );

  void import("@sentry/vue")
    .then((Sentry) => {
      Sentry.init({
        app,
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.MODE,
        tracesSampleRate: Number.isFinite(tracesSampleRate)
          ? Math.max(0, Math.min(1, tracesSampleRate))
          : 0
      });
    })
    .catch(() => {});
}

app.mount("#app");
