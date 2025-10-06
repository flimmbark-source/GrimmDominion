# Technology & Infrastructure

## Engine & Platform
- Browser-first vertical slice built with Phaser 3 and TypeScript, compiled with Vite for modern
  bundling and hot module replacement.
- WebGL 2 is the primary rendering backend, with Canvas fallback for lower powered devices.
- The prototype scene renders a fully navigable isometric battlefield representing the castle
  plateau, haunted village, ancient shrine, and shadowed forest described in the world brief.
- Target platforms: desktop browsers (Chrome, Firefox, Edge, Safari) with responsive layout support
  for tablets.

## Architecture Overview
- **Client-Simulated, Server-Optional:** All gameplay logic currently runs client-side. Scene code is
  organized so future lockstep or rollback networking can hook into the selection/command routines
  without rewriting rendering.
- **Data-Driven Battlefield:** `web/content/map.json` defines the tile grid, hero squads, and
  landmark descriptions. MapScene consumes the JSON at runtime and paints tiles based on palette
  metadata, so designers can iterate on layout and pacing without touching TypeScript.
- **Isometric Projection Helpers:** `web/src/iso/coordinates.ts` converts between tile-space and
  screen-space. The helpers keep hero movement, selection rings, and command markers synchronized.
- **Hero Command Loop:** The RTS input layer supports marquee-style multi-select via Shift + Click
  and formation-aware move orders. Target pings surface invalid moves when players right-click
  blocked tiles.

## Tooling & Pipelines
- TypeScript-first workflow with ESLint and Prettier enforcing code quality and formatting.
- Vite dev server exposes the slice on port `5173` with hot reload, enabling rapid iteration in
  Codespaces and local environments.
- GitHub Actions matrix builds (planned) will run `npm run lint`, `npm run test`, and `npm run build`
  to guarantee deterministic production bundles.
- Static JSON content resides under `web/content/`; sprites, audio, and shaders can drop into
  `web/public/` when art assets arrive.

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
- Telemetry hooks are not yet implemented in the browser prototype. The Phaser scenes expose
  extension points where session summaries (role, objectives cleared, time-to-complete) can be
  dispatched once the reporting endpoint is defined.
- Privacy expectations remain unchanged: collect anonymized UUIDs only after explicit opt-in.

## QA & Testing
- Vitest runs lightweight unit tests. Initial coverage verifies the isometric projection helpers so
  tile picking and hero movement stay deterministic across browsers.
- Playwright (planned follow-up) will drive scripted hero/dark-lord flows in headless Chromium for
  regression coverage.
- Performance budgets: maintain 60 FPS on a 4-core Codespaces VM with Chrome, logging frame metrics
  via the browser devtools performance API.
