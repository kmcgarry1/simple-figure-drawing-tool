# Figure Drawing Slideshow (Vue)

A Vue 3 app for figure drawing practice with uploaded reference images.

## Features

- Quick session mode:
  - Randomly picks up to 10 images.
  - Uses one editable duration for every slide.
- Life drawing class wizard:
  - Built-in 1 hour, 2 hour, and 3 hour class presets.
  - Final pose defaults:
    - 1 hour class: 10 minutes
    - 2 hour class: 30 minutes
    - 3 hour class: 60 minutes
  - Editable pose blocks (name, seconds per pose, pose count).
  - Shuffle or sequential photo order.
  - Optional back-to-back repeat prevention in shuffle mode.
- Live mode:
  - Full-screen stage.
  - Per-pose countdown with progress bar.
  - Pose counter, active pose label, and total session time remaining.
  - Keyboard shortcuts: `Space` pause/resume, `Right Arrow` next, `Esc` end.

## Technical Notes

- Slideshow/session logic: `src/composables/useFigureSession.js`
- Class preset + block helpers: `src/utils/classPlan.js`
- Upload validation + randomization: `src/utils/photoInput.js`
- Shared constraints: `src/config.js`

## Run

1. Install dependencies:
   `npm install`
2. Start development:
   `npm run dev`

## Build

- Production build:
  `npm run build`
- Preview production build:
  `npm run preview`

## Quality Checks

- Lint:
  `npm run lint`
- Unit tests:
  `npm run test`
- Run all local gates (lint + test + build):
  `npm run check`

## CI

- GitHub Actions workflow: `.github/workflows/ci.yml`
- Runs `npm ci`, then `npm run lint`, `npm run test`, and `npm run build` on pull requests and pushes to `main`.
