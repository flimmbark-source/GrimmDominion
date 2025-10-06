# Prototype File Creation Checklist

## Purpose
This checklist translates the vertical slice blueprint into concrete browser project files so the
prototype can boot, connect players, and deliver the outlined match flow. Treat each item as a
tracked task in your project board and link completed assets back to their owning discipline.

## Project Bootstrapping
1. **Scaffold Workspace** using `npm create vite@latest web -- --template vanilla-ts`.
2. **Install Dependencies**
   - Runtime: `phaser`, `@pixi/layers`, `howler`, `zustand`, `immer`, `date-fns`.
   - Tooling: `vitest`, `@vitest/coverage-c8`, `@testing-library/dom`, `eslint`,
     `@typescript-eslint/*`, `prettier`, `playwright` (optional follow-up).
3. **Configure Tooling**
   - Add shared ESLint/Prettier configs.
   - Configure `tsconfig.json` paths for `@game/*`, `@content/*`, and `@core/*` aliases.
   - Create `.vscode/settings.json` enabling format on save and pointing to the workspace TypeScript
     version.

## Scenes & Game Flow Modules
- `src/game/scenes/BootScene.ts`: Preloads atlases/audio/JSON, seeds global stores, transitions to
  lobby.
- `src/game/scenes/LobbyScene.ts`: Handles role selection UI, match settings, and tutorial overlays.
- `src/game/scenes/MatchScene.ts`: Instantiates biome tilemaps, unit factories, quest managers, and
  HUD layers.
- `src/game/scenes/SceneRegistry.ts`: Helper for registering/unregistering scenes in tests.
- **Routing**: Add `src/main.ts` entry that mounts Phaser with BootScene as the starting point.

## State & Data Modules
Create strongly typed stores and schema definitions:

| File | Location | Purpose |
| --- | --- | --- |
| `gameStore.ts` | `src/state/` | Central Zustand store for role, phase, and victory state. |
| `resourceSlice.ts` | `src/state/slices/` | Manages Evil Energy, Valor, Gold tick cadence. |
| `questSlice.ts` | `src/state/slices/` | Tracks quest progression and triggers UI updates. |
| `contentSchemas.ts` | `src/content/schemas/` | `zod` schemas validating quest/encounter JSON. |
| `questCatalog.json` | `src/content/quests/` | Defines stealth, escort, and ritual quest flows. |
| `encounterTable.json` | `src/content/encounters/` | Enemy spawn compositions by escalation level. |
| `roleLoadouts.json` | `src/content/roles/` | Ability loadouts and tutorial tips per role. |

## Systems & Gameplay Logic
Implement the following TypeScript modules under `src/game/systems/`:

- `economy/ResourceManager.ts`: Applies income curves, publishes events for HUD updates.
- `fog/FogController.ts`: Maintains visibility textures using WebGL shaders with Canvas fallback.
- `stealth/NoiseField.ts`: Tracks noise pulses, decays them over time, informs commander alerts.
- `quests/QuestManager.ts`: Loads quest definitions, handles objective completion and rewards.
- `units/AbilityExecutor.ts`: Validates targets, plays animations, and schedules cooldowns.
- `units/SpawnFactory.ts`: Instantiates Phaser game objects for minions with physics bodies.
- `telemetry/TelemetryClient.ts`: Buffers match summaries and posts to configured webhook.

Unit-test deterministic logic with Vitest specs under `tests/unit/`.

## UI & UX Assets
- `src/game/ui/hud/HeroHud.ts`: Displays hero health, abilities, stealth meter, quest tracker.
- `src/game/ui/hud/DarkLordHud.ts`: Shows minion roster, Evil Energy, map overview, alert feed.
- `src/game/ui/overlays/TutorialOverlay.ts`: Guides first-match actions with dismissible steps.
- `src/styles/tokens.scss`: Centralized spacing/color/typography tokens for Phaser and DOM overlays.
- Input mapping JSON in `src/config/inputBindings.json` describing keyboard/mouse bindings.

## Audio Implementation Files
- Place ambient/combat/UI tracks in `public/audio/`.
- `src/game/audio/AdaptiveMusicController.ts`: Switches playlists based on quest phase and tension.
- `src/game/audio/SfxBus.ts`: Queues positional SFX and throttles repeats.
- Reference audio assets via Howler wrappers to keep loading async-friendly.

## Build & Automation
- `.github/workflows/web-ci.yml`: Runs `npm ci`, `npm run lint`, `npm run test`, `npm run build`.
- `vitest.config.ts`: Enables `jsdom` environment and coverage thresholds.
- `playwright.config.ts`: Seeds hero/dark-lord smoke flows (optional follow-up).
- `scripts/upload-telemetry.ts`: CLI helper for replaying telemetry payloads to staging (future).

## Verification Checklist
- Vite dev server boots (`npm run dev`) and exposes port `5173` for Codespaces.
- `npm run lint` and `npm run test` succeed locally and in CI.
- Playwright smoke (`npm run test:e2e`) covers lobby -> match -> summary flow (once implemented).
- Build artifact (`npm run build`) deploys via static hosting without missing asset references.
