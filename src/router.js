import { createRouter, createWebHistory } from "vue-router";
import HostSessionApp from "./components/HostSessionApp.vue";
import RemoteClientApp from "./components/RemoteClientApp.vue";
import ClassPlannerView from "./views/ClassPlannerView.vue";
import HistoryRouteView from "./views/HistoryRouteView.vue";
import StudioView from "./views/StudioView.vue";

function cleanQuery(query, keyToRemove) {
  const nextQuery = { ...query };
  delete nextQuery[keyToRemove];
  return nextQuery;
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: HostSessionApp,
      children: [
        {
          path: "",
          redirect: "/studio"
        },
        {
          path: "studio",
          name: "studio",
          meta: {
            navLabel: "Studio",
            navOrder: 1,
            pageTitle: "Add references, set timing, start drawing.",
            pageDescription: "Quick practice is the default path. Class planning lives in its own workspace.",
            documentTitle: "Studio"
          },
          component: StudioView
        },
        {
          path: "class",
          name: "class",
          meta: {
            navLabel: "Class",
            navOrder: 2,
            pageTitle: "Build the class in four steps.",
            pageDescription: "Set the target, shape the blocks, control the sequence, then launch from review.",
            documentTitle: "Class Planner"
          },
          component: ClassPlannerView
        },
        {
          path: "history",
          name: "history",
          meta: {
            navLabel: "History",
            navOrder: 3,
            pageTitle: "Review runs, rerun setups, restore snapshots.",
            pageDescription: "History and saved snapshots live here, away from the quick-start flow.",
            documentTitle: "History"
          },
          component: HistoryRouteView
        }
      ]
    },
    {
      path: "/remote",
      name: "remote",
      meta: {
        pageTitle: "Phone control",
        pageDescription: "Open this page from the pairing link. Manual token exchange is available if needed.",
        documentTitle: "Remote"
      },
      component: RemoteClientApp
    }
  ]
});

router.beforeEach((to) => {
  if (to.query.remote === "1" && to.path !== "/remote") {
    return {
      path: "/remote",
      query: cleanQuery(to.query, "remote")
    };
  }

  if (to.path === "/" && to.name !== "studio") {
    return {
      path: "/studio",
      query: cleanQuery(to.query, "remote")
    };
  }

  return true;
});

router.afterEach((to) => {
  if (typeof document === "undefined") {
    return;
  }

  const nextTitle = String(to.meta.documentTitle || "Figure Drawing").trim();
  document.title = nextTitle === "Figure Drawing" ? nextTitle : `${nextTitle} | Figure Drawing`;
});

export default router;
