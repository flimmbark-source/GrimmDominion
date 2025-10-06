# Grimm Dominion Browser Prototype

This folder contains the browser-based vertical slice for Grimm Dominion. It replaces the Unity
prototype so the experience can run directly inside GitHub Codespaces or any modern browser.

## Getting Started
1. Install dependencies:
   ```bash
   npm install --prefix web
   ```
2. Launch the Vite dev server (Codespaces requires binding to all interfaces):
   ```bash
   npm run dev --prefix web -- --host 0.0.0.0 --port 5173
   ```
3. Open the forwarded port in the browser to view the slice. The prototype bootstraps a Phaser scene
   that loads the battlefield layout, hero squads, and quest deck from JSON content files.

### Controls
- **Left Click:** Select a squad. Hold **Shift** to add/remove squads from the selection.
- **Right Click:** Issue a move command to the highlighted tile. A warning ping appears if the tile
  is blocked.
   that renders the overworld layout and quest deck from JSON content files.

## Scripts
- `npm run dev --prefix web` – Start the development server with hot reload.
- `npm run build --prefix web` – Produce an optimized production bundle under `web/dist/`.
- `npm run preview --prefix web` – Serve the production build locally.
- `npm run lint --prefix web` – Run ESLint with the project ruleset.
- `npm run test --prefix web` – Execute the Vitest suite (placeholder until gameplay logic matures).

## Project Structure
- `src/` – TypeScript source files. Phaser scenes live under `src/scenes/` and isometric helpers
  under `src/iso/`.
- `content/` – JSON data for quests, world regions, and encounter tuning.
- `public/` – Static assets copied directly into the final bundle (sprites, audio, shaders).
- `tests/` – Unit test entry point (to be filled out as systems migrate).

## Prototype Features
- Isometric ground tiles representing the castle plateau, haunted village, ancient shrine, shadowed
  forest, and forward camp described in the world design doc.
- Three hero squads (Knights, Witches, Goblins) with RTS-style selection and formation-based move
  orders.
- Contextual UI panels summarizing regional threat levels and the active quest deck for quick
  scenario reference.

## Next Steps
- Flesh out additional Phaser scenes for hero stealth runs and dark lord command phases.
- Port resource and stealth systems from the design doc into TypeScript modules with matching tests.
- Integrate lightweight backend telemetry once the Codespaces preview endpoint is available.
