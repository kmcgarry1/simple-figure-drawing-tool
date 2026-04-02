import { expect, test } from "@playwright/test";

const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X4NwAAAAASUVORK5CYII=",
  "base64"
);

function createPngFilePayload(name) {
  return {
    name,
    mimeType: "image/png",
    buffer: ONE_PIXEL_PNG
  };
}

const mobileViewport = {
  viewport: {
    width: 390,
    height: 844
  },
  hasTouch: true
};

function installTheme(page, theme) {
  return page.addInitScript((nextTheme) => {
    const fixedNow = new Date("2026-03-01T12:00:00.000Z").valueOf();
    const RealDate = Date;

    class FixedDate extends RealDate {
      constructor(...args) {
        if (args.length === 0) {
          super(fixedNow);
          return;
        }

        super(...args);
      }

      static now() {
        return fixedNow;
      }
    }

    FixedDate.parse = RealDate.parse;
    FixedDate.UTC = RealDate.UTC;
    FixedDate.prototype = RealDate.prototype;
    window.Date = FixedDate;

    let randomState = 123456789;
    const nextRandom = () => {
      randomState = (1664525 * randomState + 1013904223) >>> 0;
      return randomState / 0x100000000;
    };

    Math.random = nextRandom;
    Object.defineProperty(window, "crypto", {
      configurable: true,
      value: new Proxy(window.crypto, {
        get(target, property, receiver) {
          if (property === "getRandomValues") {
            return (typedArray) => {
              for (let index = 0; index < typedArray.length; index += 1) {
                const maxValue = 2 ** (typedArray.BYTES_PER_ELEMENT * 8);
                typedArray[index] = Math.floor(nextRandom() * maxValue);
              }
              return typedArray;
            };
          }

          return Reflect.get(target, property, receiver);
        }
      })
    });

    window.localStorage.setItem("fd-theme-mode", nextTheme);
  }, theme);
}

function installStableHostRemote(page) {
  return page.addInitScript(() => {
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
      }

      createDataChannel(label) {
        this._hostChannel = new FakeDataChannel(label);
        return this._hostChannel;
      }

      async createOffer() {
        this.connectionState = "connecting";
        this.iceConnectionState = "checking";
        this.#emitConnectionState();
        return {
          type: "offer",
          sdp: "visual-offer"
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
  });
}

async function waitForSettledChrome(page) {
  await expect(
    page.getByText(
      /Settings saved at|Settings autosave is ready|Unable to save settings in this browser\./
    ).first()
  ).toBeVisible();
}

async function prepareStudio(page, theme) {
  await installTheme(page, theme);
  await page.goto("/studio");
  await page.locator("#studioPhotoInput").setInputFiles([
    createPngFilePayload("visual-1.png"),
    createPngFilePayload("visual-2.png"),
    createPngFilePayload("visual-3.png")
  ]);
  await waitForSettledChrome(page);
}

async function prepareClass(page, theme) {
  await prepareStudio(page, theme);
  await page.getByRole("button", { name: "Class Planning" }).click();
  await page.getByRole("button", { name: "Open Class Planner" }).click();
  await page.getByRole("button", { name: /Review/ }).click();
}

async function prepareHistory(page, theme) {
  await page.addInitScript((nextTheme) => {
    const fixedNow = new Date("2026-03-01T12:00:00.000Z").valueOf();
    const RealDate = Date;

    class FixedDate extends RealDate {
      constructor(...args) {
        if (args.length === 0) {
          super(fixedNow);
          return;
        }

        super(...args);
      }

      static now() {
        return fixedNow;
      }
    }

    FixedDate.parse = RealDate.parse;
    FixedDate.UTC = RealDate.UTC;
    FixedDate.prototype = RealDate.prototype;
    window.Date = FixedDate;
    window.localStorage.setItem("fd-theme-mode", nextTheme);
    window.localStorage.setItem(
      "figureDrawing.history.v1",
      JSON.stringify([
        {
          id: "visual-history-1",
          sessionMode: "quick",
          result: "completed",
          startedAt: "2026-03-01T10:00:00.000Z",
          endedAt: "2026-03-01T10:05:00.000Z",
          elapsedSeconds: 300,
          plannedSlides: 5,
          completedSlides: 5,
          plannedDurationSeconds: 300,
          completedDurationSeconds: 300,
          durationDeltaSeconds: 0,
          plannedBreakCount: 0,
          completedBreakCount: 0,
          plannedBreakDurationSeconds: 0,
          completedBreakDurationSeconds: 0,
          templateName: "",
          presetId: "quick-session",
          presetLabel: "Quick Session",
          appliedTags: []
        }
      ])
    );
  }, theme);
  await page.goto("/history");
  await waitForSettledChrome(page);
}

async function prepareRemote(page, theme) {
  await installTheme(page, theme);
  await page.goto("/remote");
  await expect(page.getByRole("heading", { name: "Phone control" })).toBeVisible();
}

async function prepareLive(page, theme) {
  await prepareStudio(page, theme);
  await page.getByRole("button", { name: "Start Session" }).click();
  await page.getByRole("button", { name: "Pause" }).click();
}

async function prepareManageLibraryOverlay(page, theme) {
  await prepareStudio(page, theme);
  await page.getByRole("button", { name: "Manage Library" }).click();
  await expect(page.getByRole("dialog", { name: "Manage library" })).toBeVisible();
}

async function prepareClassReviewOverlay(page, theme) {
  await prepareClass(page, theme);
  await page.getByRole("button", { name: "Start Class" }).click();
  await expect(page.getByRole("dialog", { name: "Review Class Pose Grid" })).toBeVisible();
}

async function prepareLivePairOverlay(page, theme) {
  await installStableHostRemote(page);
  await prepareLive(page, theme);
  await page.getByRole("button", { name: "Pair Phone" }).click();
  await expect(page.getByRole("dialog", { name: "Pair phone" })).toBeVisible();
}

async function prepareLiveSettingsOverlay(page, theme) {
  await prepareLive(page, theme);
  await page.getByRole("button", { name: "Session Settings" }).click();
  await expect(page.getByRole("dialog", { name: "Session settings" })).toBeVisible();
}

async function expectVisualSnapshot(page, name) {
  await expect(page).toHaveScreenshot(name, {
    fullPage: true,
    animations: "disabled"
  });
}

function defineCoverageGroup(label, theme) {
  test(`studio ${label}`, async ({ page }) => {
    await prepareStudio(page, theme);
    await expectVisualSnapshot(page, `studio-${label}.png`);
  });

  test(`class ${label}`, async ({ page }) => {
    await prepareClass(page, theme);
    await expectVisualSnapshot(page, `class-${label}.png`);
  });

  test(`history ${label}`, async ({ page }) => {
    await prepareHistory(page, theme);
    await expectVisualSnapshot(page, `history-${label}.png`);
  });

  test(`remote ${label}`, async ({ page }) => {
    await prepareRemote(page, theme);
    await expectVisualSnapshot(page, `remote-${label}.png`);
  });

  test(`live ${label}`, async ({ page }) => {
    await prepareLive(page, theme);
    await expectVisualSnapshot(page, `live-${label}.png`);
  });

  test(`manage-library ${label}`, async ({ page }) => {
    await prepareManageLibraryOverlay(page, theme);
    await expectVisualSnapshot(page, `manage-library-${label}.png`);
  });

  test(`class-review ${label}`, async ({ page }) => {
    await prepareClassReviewOverlay(page, theme);
    await expectVisualSnapshot(page, `class-review-${label}.png`);
  });

  test(`live-pair ${label}`, async ({ page }) => {
    await prepareLivePairOverlay(page, theme);
    await expectVisualSnapshot(page, `live-pair-${label}.png`);
  });

  test(`live-settings ${label}`, async ({ page }) => {
    await prepareLiveSettingsOverlay(page, theme);
    await expectVisualSnapshot(page, `live-settings-${label}.png`);
  });
}

test.describe("desktop light", () => {
  test.use({ viewport: { width: 1440, height: 1200 } });
  defineCoverageGroup("light-desktop", "light");
});

test.describe("desktop dark", () => {
  test.use({ viewport: { width: 1440, height: 1200 } });
  defineCoverageGroup("dark-desktop", "dark");
});

test.describe("mobile light", () => {
  test.use(mobileViewport);
  defineCoverageGroup("light-mobile", "light");
});

test.describe("mobile dark", () => {
  test.use(mobileViewport);
  defineCoverageGroup("dark-mobile", "dark");
});
