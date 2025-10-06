# Technology & Infrastructure

## Engine & Platform
- Browser-first vertical slice built with Phaser 3 and TypeScript, compiled with Vite for modern
  bundling and hot module replacement.
- WebGL 2 is the primary rendering backend, with Canvas fallback for lower powered devices.
- Target platforms: desktop browsers (Chrome, Firefox, Edge, Safari) with responsive layout support
  for tablets.

## Architecture Overview
- **Client-Simulated, Server-Optional:** All core gameplay systems run client-side to streamline the
  prototype. Networking hooks are abstracted through a lightweight service layer so future
  multiplayer can slot in without rewriting scene logic.
- **State Management:** Phaser scenes coordinate gameplay state via a central `GameStore` module that
  tracks objectives, stealth values, and resource ticks. Deterministic update loops make future
  lockstep or rollback netcode viable.
- **Content Pipelines:** Narrative beats, enemy loadouts, and quest templates live as JSON data files
  under `web/content/`. Phaser data loaders ingest the files at boot so designers can iterate without
  code changes.

## Tooling & Pipelines
- TypeScript-first workflow with ESLint and Prettier enforcing code quality and formatting.
- Vite dev server exposes the slice on port `5173` with hot reload, enabling rapid iteration in
  Codespaces and local environments.
- GitHub Actions matrix builds run `npm run lint`, `npm run test`, and `npm run build` to guarantee
  deterministic production bundles.
- Static assets (sprites, audio, shaders) live under `web/public/` and are referenced through Vite's
  asset pipeline for hashed production filenames.

## Codespaces Environment
- The devcontainer uses the `typescript-node` base image with Node.js 20 and forwards port `5173`
  automatically for the Vite preview server.
- Launch the repository in GitHub Codespaces; the post-create script installs web dependencies so the
  workspace is ready to run without extra setup.
- Start development with `npm run dev --prefix web -- --host 0.0.0.0 --port 5173` so the Vite server
  binds to all interfaces, making it accessible through the Codespaces forwarded port UI.
- Use `npm run build --prefix web` to generate the production bundle under `web/dist/`. Serve the
  output via `npm run preview --prefix web` or any static host for validation.
- Environment variables for future backend integration are stored in `.env.local` (ignored by Git).
  The client reads them through Vite's `import.meta.env` bridge.

## Telemetry & Analytics
- Lightweight telemetry stub posts session summaries (role played, victory state, time-to-complete,
  optional feedback text) to a configurable webhook endpoint.
- Privacy compliant; the browser build stores only anonymized UUIDs in `localStorage` for session
  stitching.

## QA & Testing
- Jest runs unit tests for deterministic gameplay math, resource tick cadence, and stealth detection
  thresholds.
- Playwright (planned follow-up) will drive scripted hero/dark-lord flows in headless Chromium for
  regression coverage.
- Performance budgets: maintain 60 FPS on a 4-core Codespaces VM with Chrome, logging frame metrics
  via the browser devtools performance API.
