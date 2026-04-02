import { expect, test } from "@playwright/test";

const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X4NwAAAAASUVORK5CYII=",
  "base64"
);
const TEMPLATE_SYNC_ENDPOINT_PATH = "/__e2e-class-template-sync/templates/";

function createPngFilePayload(name) {
  return {
    name,
    mimeType: "image/png",
    buffer: ONE_PIXEL_PNG
  };
}

async function uploadFromStudio(page, files) {
  await page.goto("/studio");
  await page.locator("#studioPhotoInput").setInputFiles(files);
}

test("quick session flow starts from studio without a wizard", async ({ page }) => {
  await uploadFromStudio(page, [
    createPngFilePayload("pose-1.png"),
    createPngFilePayload("pose-2.png"),
    createPngFilePayload("pose-3.png")
  ]);

  await expect(page.locator("main .fd-button-primary:visible")).toHaveCount(1);
  await expect(page.locator("main .fd-button-primary:visible")).toContainText("Start Session");
  await page.getByLabel("Seconds per photo").fill("5");
  await page.getByLabel("Seconds per photo").blur();
  await page.getByRole("button", { name: "Start Session" }).click();

  await expect(page.getByRole("button", { name: "End" })).toBeVisible();
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
  await page.getByRole("button", { name: "End" }).click();
  await expect(page.getByText("Session stopped.")).toBeVisible();
});

test("manage library drawer supports reorder, bulk tags, and close-reopen persistence", async ({
  page
}) => {
  await uploadFromStudio(page, [
    createPngFilePayload("library-1.png"),
    createPngFilePayload("library-2.png"),
    createPngFilePayload("library-3.png")
  ]);

  await page.getByRole("button", { name: "Manage Library" }).click();
  const libraryDialog = page.getByRole("dialog", { name: "Manage library" });
  await expect(libraryDialog).toBeVisible();

  const photoCards = libraryDialog.locator('[aria-label="Source photo order"] article');
  await expect(photoCards.nth(0)).toContainText("library-1.png");
  await libraryDialog.getByRole("button", { name: "Move library-3.png up" }).click();
  await libraryDialog.getByRole("button", { name: "Move library-3.png up" }).click();
  await expect(photoCards.nth(0)).toContainText("library-3.png");

  await libraryDialog.getByRole("checkbox", { name: "Select library-1.png for bulk tag actions" }).check();
  await libraryDialog.getByRole("checkbox", { name: "Select library-2.png for bulk tag actions" }).check();
  await libraryDialog.getByLabel("Tag Name").fill("gesture");
  await libraryDialog.getByRole("button", { name: "Apply Tag" }).click();

  await expect(libraryDialog.getByLabel("Tag for library-1.png")).toHaveValue("gesture");
  await expect(libraryDialog.getByLabel("Tag for library-2.png")).toHaveValue("gesture");

  await libraryDialog.getByRole("button", { name: "Close" }).click();
  await expect(libraryDialog).toBeHidden();

  await page.getByRole("button", { name: "Manage Library" }).click();
  await expect(page.getByRole("dialog", { name: "Manage library" }).getByLabel("Tag for library-1.png")).toHaveValue(
    "gesture"
  );
});

test("class planner launches from review and opens the class review grid", async ({ page }) => {
  await uploadFromStudio(page, [
    createPngFilePayload("class-1.png"),
    createPngFilePayload("class-2.png"),
    createPngFilePayload("class-3.png")
  ]);

  await page.getByRole("button", { name: "Class Planning" }).click();
  await expect(page.getByRole("button", { name: "Open Class Planner" })).toHaveCount(1);
  await expect(page.getByText("No duplicate launch action here.")).toBeVisible();
  await page.getByRole("button", { name: "Open Class Planner" }).click();
  await expect(page).toHaveURL(/\/class$/);

  await expect(page.getByRole("button", { name: "Start Class" })).toHaveCount(0);
  await page.getByRole("button", { name: /Review/ }).click();
  await page.getByRole("button", { name: "Start Class" }).click();

  const reviewDialog = page.getByRole("dialog", { name: "Review Class Pose Grid" });
  await expect(reviewDialog).toBeVisible();
  await reviewDialog.getByRole("button", { name: "Start Class" }).click();
  await expect(page.getByRole("button", { name: "End" })).toBeVisible();
});

test("history rerun and named snapshots save from the history route", async ({ page }) => {
  const seededHistory = [
    {
      id: "seed-rerun-quick",
      sessionMode: "quick",
      result: "completed",
      startedAt: "2026-03-01T10:00:00.000Z",
      endedAt: "2026-03-01T10:05:00.000Z",
      elapsedSeconds: 300,
      plannedSlides: 5,
      completedSlides: 5,
      templateName: "",
      appliedTags: [],
      rerunSettings: {
        sessionMode: "quick",
        durationSeconds: 95,
        classPresetId: "class-3h",
        classBlocks: [
          {
            blockType: "pose",
            label: "Gesture Drill",
            durationSeconds: 45,
            poseCount: 8,
            photoTag: "all"
          }
        ],
        classPhotoOrder: "sequential",
        avoidImmediateRepeats: false
      }
    }
  ];

  await page.addInitScript((historyPayload) => {
    window.localStorage.setItem("figureDrawing.history.v1", JSON.stringify(historyPayload));
    window.localStorage.removeItem("figureDrawing.runSnapshots.v1");
  }, seededHistory);

  await page.goto("/history");
  await expect(page.getByText("Recent runs")).toBeVisible();
  await expect(page.getByLabel("Mode")).toBeHidden();

  const historyCard = page.getByRole("listitem").filter({ hasText: "Quick Run" }).first();
  await expect(historyCard.getByLabel("Snapshot Name")).toHaveCount(0);
  await historyCard.getByRole("button", { name: "Save Snapshot" }).click();
  await historyCard.getByLabel("Snapshot Name").fill("Quick 95 Snapshot");
  await historyCard.getByRole("button", { name: "Confirm Save" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "Quick 95 Snapshot" }).first()).toBeVisible();

  await page.getByRole("button", { name: "Runs" }).click();
  await historyCard.getByRole("button", { name: "Rerun Setup" }).click();
  await expect(page).toHaveURL(/\/studio$/);
  await expect(page.getByLabel("Seconds per photo")).toHaveValue("95");
});

test("history snapshots can restore the saved quick draft", async ({ page }) => {
  const seededSnapshots = [
    {
      id: "snapshot-quick-95",
      name: "Quick 95 Snapshot",
      sessionMode: "quick",
      sourceSessionId: "seed-session",
      templateName: "",
      appliedTags: [],
      updatedAt: "2026-03-01T10:05:00.000Z",
      createdAt: "2026-03-01T10:05:00.000Z",
      rerunSettings: {
        sessionMode: "quick",
        durationSeconds: 95,
        classPresetId: "class-3h",
        classBlocks: [
          {
            blockType: "pose",
            label: "Gesture Drill",
            durationSeconds: 45,
            poseCount: 8,
            photoTag: "all"
          }
        ],
        classPhotoOrder: "sequential",
        avoidImmediateRepeats: false
      }
    }
  ];

  await page.addInitScript((runSnapshots) => {
    window.localStorage.setItem("figureDrawing.runSnapshots.v1", JSON.stringify(runSnapshots));
  }, seededSnapshots);

  await page.goto("/history");
  await page.getByRole("button", { name: "Snapshots" }).click();
  await page.getByRole("listitem").filter({ hasText: "Quick 95 Snapshot" }).first().getByRole("button", { name: "Restore Snapshot" }).click();
  await expect(page).toHaveURL(/\/studio$/);
  await expect(page.getByLabel("Seconds per photo")).toHaveValue("95");
});

test("class template sync persists sync key and pushes and pulls templates from review", async ({
  page
}) => {
  const remoteSyncState = {
    templates: [
      {
        id: "remote-template-initial",
        name: "Remote Gesture Set",
        blocks: [
          {
            blockType: "pose",
            label: "Remote Gestures",
            durationSeconds: 30,
            poseCount: 6,
            photoTag: "all"
          }
        ],
        createdAt: "2026-03-04T10:00:00.000Z",
        updatedAt: "2026-03-04T10:00:00.000Z"
      }
    ]
  };

  await page.route(`**${TEMPLATE_SYNC_ENDPOINT_PATH}*`, async (route) => {
    const request = route.request();
    const requestUrl = new URL(request.url());
    const syncKey = decodeURIComponent(requestUrl.pathname.split("/").pop() || "");

    if (syncKey !== "studio-sync") {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ error: "unknown-sync-key" })
      });
      return;
    }

    if (request.method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ templates: remoteSyncState.templates })
      });
      return;
    }

    if (request.method() === "PUT") {
      const payload = JSON.parse(request.postData() || "{}");
      remoteSyncState.templates = Array.isArray(payload.templates) ? payload.templates : [];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ synced: true })
      });
      return;
    }

    await route.fulfill({
      status: 405,
      contentType: "application/json",
      body: JSON.stringify({ error: "method-not-allowed" })
    });
  });

  await page.addInitScript(() => {
    const localTemplates = [
      {
        id: "local-template-1",
        name: "Local Warmups",
        blocks: [
          {
            blockType: "pose",
            label: "Warm-up",
            durationSeconds: 60,
            poseCount: 5,
            photoTag: "all"
          }
        ],
        createdAt: "2026-03-03T08:00:00.000Z",
        updatedAt: "2026-03-03T08:00:00.000Z"
      }
    ];
    window.__FD_CLASS_TEMPLATE_SYNC_ENDPOINT__ = "http://127.0.0.1:4173/__e2e-class-template-sync";
    window.localStorage.setItem("figureDrawing.classTemplates.v1", JSON.stringify(localTemplates));
    window.localStorage.removeItem("figureDrawing.classTemplateSyncKey.v1");
  });

  await uploadFromStudio(page, [createPngFilePayload("sync-pose-1.png")]);
  await page.getByRole("button", { name: "Class Planning" }).click();
  await page.getByRole("button", { name: "Open Class Planner" }).click();
  await page.getByRole("button", { name: /Review/ }).click();

  await page.getByText(/Templates & Sync/).click();

  const syncKeyInput = page.getByLabel("Sync Key");
  await syncKeyInput.fill("studio-sync");
  await expect(syncKeyInput).toHaveValue("studio-sync");

  const pushRequestPromise = page.waitForRequest((request) => {
    return request.method() === "PUT" && request.url().includes(`${TEMPLATE_SYNC_ENDPOINT_PATH}studio-sync`);
  });
  await page.getByRole("button", { name: "Push To Sync" }).click();
  const pushRequest = await pushRequestPromise;
  const pushedPayload = JSON.parse(pushRequest.postData() || "{}");
  expect(
    pushedPayload.templates.some((template) => template.name === "Local Warmups")
  ).toBe(true);

  remoteSyncState.templates = [
    {
      id: "remote-template-new",
      name: "Remote Long Poses",
      blocks: [
        {
          blockType: "pose",
          label: "Remote Long Pose",
          durationSeconds: 300,
          poseCount: 2,
          photoTag: "all"
        }
      ],
      createdAt: "2026-03-04T10:05:00.000Z",
      updatedAt: "2026-03-04T10:05:00.000Z"
    }
  ];

  const pullResponsePromise = page.waitForResponse((response) => {
    const request = response.request();
    return (
      request.method() === "GET" &&
      request.url().includes(`${TEMPLATE_SYNC_ENDPOINT_PATH}studio-sync`) &&
      response.ok()
    );
  });
  await page.getByRole("button", { name: "Pull From Sync" }).click();
  await pullResponsePromise;

  const templateNameValues = await page
    .getByLabel("Template Name")
    .evaluateAll((inputs) => inputs.map((input) => input.value));
  expect(templateNameValues).toContain("Remote Long Poses");

  const persistedSyncKey = await page.evaluate(() =>
    window.localStorage.getItem("figureDrawing.classTemplateSyncKey.v1")
  );
  expect(persistedSyncKey).toBe("studio-sync");
});

test("mode and duration persist after reload on the studio route", async ({ page }) => {
  await page.goto("/studio");

  await page.getByLabel("Seconds per photo").fill("75");
  await page.getByLabel("Seconds per photo").blur();

  await page.reload();

  await expect(page.getByLabel("Seconds per photo")).toHaveValue("75");
});

test("top bar stays minimal and route identity lives in the page content", async ({ page }) => {
  await page.goto("/history");

  await expect(page.getByRole("heading", { name: "Review runs, rerun setups, restore snapshots." })).toBeVisible();
  await expect(page.locator("header").getByText("Figure Drawing")).toBeVisible();
  await expect(page.locator("header").getByRole("heading")).toHaveCount(0);
});

test("remote route supports compatibility redirect and invalid manual pairing", async ({ page }) => {
  await page.goto("/?remote=1&offer=test-offer-token-123");
  await expect(page).toHaveURL(/\/remote\?offer=test-offer-token-123$/);

  await page.goto("/remote");
  await expect(page.getByLabel("Desktop offer token")).toBeHidden();
  await page.getByText("Use token exchange instead").click();
  await page.getByLabel("Desktop offer token").fill("not-a-valid-token");
  await page.getByRole("button", { name: "Generate Answer Token" }).click();

  await expect(page.getByText("Invalid desktop offer token.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry Connection" })).toBeVisible();
  await expect(page.getByLabel("Desktop offer token")).toBeHidden();
});

test("live host phone pairing handles reconnect and manual retry flow", async ({ page }) => {
  await page.addInitScript(() => {
    class FakeDataChannel {
      constructor(label) {
        this.label = label;
        this.readyState = "connecting";
        this.onopen = null;
        this.onclose = null;
        this.onerror = null;
        this.onmessage = null;
      }

      send() {}

      close() {
        if (this.readyState === "closed") {
          return;
        }

        this.readyState = "closed";
        this.onclose?.();
      }

      open() {
        if (this.readyState === "open") {
          return;
        }

        this.readyState = "open";
        this.onopen?.();
      }
    }

    const peers = [];
    let offerSequence = 0;

    class FakeRTCPeerConnection extends EventTarget {
      constructor() {
        super();
        this.connectionState = "new";
        this.iceConnectionState = "new";
        this.iceGatheringState = "complete";
        this.localDescription = null;
        this.remoteDescription = null;
        this.onconnectionstatechange = null;
        this.oniceconnectionstatechange = null;
        this.ondatachannel = null;
        this._hostChannel = null;
        peers.push(this);
      }

      createDataChannel(label) {
        this._hostChannel = new FakeDataChannel(label);
        return this._hostChannel;
      }

      async createOffer() {
        this.connectionState = "connecting";
        this.iceConnectionState = "checking";
        this.#emitConnectionState();
        offerSequence += 1;
        return {
          type: "offer",
          sdp: `fake-offer-${offerSequence}`
        };
      }

      async setLocalDescription(description) {
        this.localDescription = description;
      }

      async setRemoteDescription(description) {
        this.remoteDescription = description;
        this.connectionState = "connected";
        this.iceConnectionState = "connected";
        this.#emitConnectionState();
        this._hostChannel?.open();
      }

      restartIce() {
        this.connectionState = "connecting";
        this.iceConnectionState = "checking";
        this.#emitConnectionState();
      }

      close() {
        this.connectionState = "closed";
        this.iceConnectionState = "closed";
        this.#emitConnectionState();
        this._hostChannel?.close();
      }

      forceDisconnect() {
        this.connectionState = "disconnected";
        this.iceConnectionState = "disconnected";
        this.#emitConnectionState();
        this._hostChannel?.close();
      }

      #emitConnectionState() {
        this.onconnectionstatechange?.();
        this.oniceconnectionstatechange?.();
      }
    }

    window.RTCPeerConnection = FakeRTCPeerConnection;
    window.RTCSessionDescription = class {
      constructor(init) {
        Object.assign(this, init || {});
      }
    };
    window.__remoteTestHarness = {
      buildAnswerToken() {
        return btoa(
          encodeURIComponent(
            JSON.stringify({
              type: "answer",
              sdp: "fake-answer"
            })
          )
        );
      },
      disconnectLatestPeer() {
        peers.at(-1)?.forceDisconnect();
      }
    };
  });

  await uploadFromStudio(page, [createPngFilePayload("remote-pose-1.png")]);
  await page.getByRole("button", { name: "Start Session" }).click();
  await expect(page.getByRole("button", { name: "Pair Phone" })).toBeVisible();

  await page.getByRole("button", { name: "Pair Phone" }).click();
  const pairDialog = page.getByRole("dialog", { name: "Pair phone" });
  await expect(pairDialog).toBeVisible();
  await pairDialog.getByText("Use token exchange instead").click();

  const offerTokenBeforeReconnect = await pairDialog.getByLabel("Offer token").inputValue();
  expect(offerTokenBeforeReconnect.length).toBeGreaterThan(0);

  const answerToken = await page.evaluate(() => window.__remoteTestHarness.buildAnswerToken());
  await pairDialog.getByLabel("Answer token").fill(answerToken);
  await pairDialog.getByRole("button", { name: "Apply Answer" }).click();
  await expect(pairDialog.getByText("Phone connected")).toBeVisible();

  await page.evaluate(() => {
    window.__remoteTestHarness.disconnectLatestPeer();
  });

  await expect(pairDialog.getByText("Phone connection dropped. Waiting for automatic reconnect.")).toBeVisible();
  await pairDialog.getByRole("button", { name: "Retry Reconnect" }).click();
  await expect(pairDialog.getByText("Reconnect offer ready. Generate a new answer token on phone.")).toBeVisible();

  const offerTokenAfterReconnect = await pairDialog.getByLabel("Offer token").inputValue();
  expect(offerTokenAfterReconnect).not.toBe(offerTokenBeforeReconnect);
});
