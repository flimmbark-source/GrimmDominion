# Project Bootstrapping Plan

## Overview
This guide translates the Grimm Dominion vertical slice requirements into a concrete browser project
setup checklist. Follow the steps sequentially when configuring the production repository so the
team shares identical tooling, package baselines, and asset scaffolding.

## 1. Workspace Creation
1. From the repository root run `npm create vite@latest web -- --template vanilla-ts` to scaffold a
   Vite+TypeScript workspace named `web/`.
2. Accept the prompts to install dependencies, then run `npm install` so the root manifest pulls the
   child workspace packages (Phaser, state management, testing utilities).
3. Initialize a Git commit to capture the generated baseline before layering custom systems.

## 2. Source Control & Tooling
1. Enable `core.autocrlf=input` in Git to keep line endings consistent across operating systems.
2. Add `.vscode/settings.json` with the shared TypeScript version and ESLint auto-fix-on-save for the
   team.
3. Configure Husky or a lightweight `lint-staged` hook to run `npm run lint -- --fix` on staged
   TypeScript, CSS, and JSON files.
4. Verify the repository `.npmrc` enables deterministic installs (`engine-strict=true`, `save-exact`).

## 3. Package Configuration
Install the core runtime and development dependencies:

- `npm install --save phaser@^3 @pixi/layers howler`
- `npm install --save zustand immer date-fns` for gameplay/state utilities.
- `npm install --save-dev eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser prettier`
- `npm install --save-dev vitest @vitest/coverage-c8 jsdom @testing-library/dom`
- `npm install --save-dev playwright @playwright/test` (headless regression, optional for follow-up).

Update `web/package.json` scripts:

```json
{
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 5173",
    "build": "vite build",
    "preview": "vite preview --host 0.0.0.0 --port 4173",
    "lint": "eslint \"src/**/*.{ts,tsx}\" --max-warnings=0",
    "format": "prettier --write \"src/**/*.{ts,tsx,scss,css,json}\"",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

## 4. Directory Structure
Mirror the following structure inside `web/` to keep gameplay, content, and tooling concerns
isolated:

```
web/
  public/
    audio/
    fonts/
    sprites/
    shaders/
  src/
    assets/
      atlases/
      data/
      maps/
    content/
      encounters/
      quests/
      roles/
    core/
      config/
      telemetry/
      utils/
    game/
      scenes/
        boot/
        lobby/
        match/
      systems/
        economy/
        fog/
        quests/
        stealth/
        units/
      ui/
        hud/
        overlays/
    state/
    styles/
    index.html
    main.ts
  tests/
    unit/
    integration/
  e2e/
```

Document any deviations from this structure inside `docs/prototype/technology.md` so downstream
contributors can align.

## 5. Core Scene Scaffolding
1. Implement `src/game/scenes/BootScene.ts` to preload shared atlases, audio, and JSON content before
   transitioning to the lobby.
2. Add `LobbyScene.ts` for role selection, hero onboarding tutorials, and session configuration.
3. Create `MatchScene.ts` that composes biome tilemaps, unit factories, quest controllers, and HUD
   overlays.
4. Expose a `SceneRegistry` utility that lazily registers scenes so automated tests can load them in
   isolation.

## 6. Systems & Services
Author the foundational services under `src/game/systems/`:

- `economy/ResourceManager.ts` manages Evil Energy, Valor, and Gold ticks with event emitters for the
  HUD.
- `fog/FogController.ts` renders visibility masks via a full-screen fragment shader.
- `quests/QuestManager.ts` loads quest JSON and orchestrates chained objectives.
- `stealth/NoiseField.ts` tracks transient noise events and dispatches commander alerts.
- `units/AbilityExecutor.ts` handles cooldown validation, targeting helpers, and animation triggers.
- `telemetry/TelemetryClient.ts` (in `src/core/telemetry/`) batches match metrics to a webhook.

Provide Vitest unit coverage for deterministic systems such as resource tick cadence and stealth
threshold calculations.

## 7. Content & Data
1. Store quest, encounter, and role configuration JSON under `src/content/` with schema definitions in
   `src/content/schemas/` (use `zod` for runtime validation if available).
2. Define texture atlas manifests under `src/assets/atlases/` and wire them through Phaser's loader in
   `BootScene`.
3. Place ambient/dialogue audio clips under `public/audio/` and reference them with Howler wrappers.

## 8. UI & HUD Layer
1. Build HUD components in `src/game/ui/hud/` using Phaser's Scene Graph for in-canvas widgets and a
   lightweight DOM overlay (e.g., Svelte or Lit) if richer forms are required.
2. Centralize shared styling tokens in `src/styles/tokens.scss` and import them into HUD components.
3. Expose accessible focus states for any DOM overlays to keep the experience keyboard friendly.

## 9. Build & Automation
1. Add `.github/workflows/web-ci.yml` running `npm ci`, `npm run lint`, `npm run test`, and
   `npm run build` on pull requests.
2. Publish Vitest coverage reports as workflow artifacts.
3. Configure Playwright smoke tests to run nightly against the deployed preview environment once it
   exists.

## 10. Verification Checklist
Run the following before merging feature work:

- ✅ `npm run lint` and `npm run test` succeed locally and in CI.
- ✅ Vite development server loads the slice on port `5173` with hot reload functioning.
- ✅ Match loop flows from lobby to victory/defeat with telemetry payload emitted.
- ✅ Performance captures in Chrome DevTools show 60 FPS on the Codespaces reference VM.

Document deviations or blockers in `docs/prototype/roadmap.md` to keep stakeholders informed.
