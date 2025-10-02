# Grimm Dominion Prototype

## Run Instructions (Codespaces or Local Node)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Launch the development server, which serves `index.html`, `scripts/`, and `styles/` through Express:
   ```bash
   npm start
   ```
3. Open the forwarded URL (or `http://localhost:3000`) in a modern browser to play. The layout automatically resizes to the browser window.

You can also serve the repository with any static file server—the build is fully client-side once assets are hosted.

## Prototype Snapshot

Grimm Dominion is currently scoped to **Milestone 2: Inventory Management**. The build focuses on real-time defense of frontier villages, stealth-driven hero movement, and lightweight progression via loot slots and a tavern shop.【F:index.html†L14-L65】【F:scripts/state.js†L42-L137】

### Core Gameplay Loop
- **Command the hero with clicks** – Move the hero by clicking within the canvas; sprint by holding `Shift` to cover ground faster at the cost of generating extra noise for nearby scouts.【F:scripts/main.js†L29-L69】【F:scripts/constants.js†L22-L47】
- **Ranged combat & noise** – The hero auto-fires projectiles at enemies in range and each attack creates noise pings that alert scouts; sprinting does the same, so positioning and timing matter.【F:scripts/main.js†L70-L107】【F:scripts/ai.js†L23-L73】
- **Dynamic encounter phases** – A looping set of encounter phases modulates spawn cadence. Advancing to a new phase triggers fresh patrol waves, keeping pressure on the map.【F:scripts/state.js†L18-L109】
- **Adaptive enemy director** – Behind the scenes, a director spends energy to spawn patrols or village raids based on current pressure, village states, and prior deployments.【F:scripts/director.js†L1-L96】

### World Threats & Objectives
- **Village sieges** – Each village tracks huts, villagers, militia, and attackers. Losing too many structures or residents marks the village as fallen and raises the defeat counter.【F:scripts/state.js†L86-L171】【F:scripts/run-conditions.js†L119-L142】
- **Castle probe escalation** – Scouts that reach the castle perimeter advance a probe meter; letting it fill ends the run with a special defeat state.【F:scripts/run-conditions.js†L63-L115】
- **Run objectives** – Survive 15 minutes, save at least three villages, and keep losses under two to secure victory before the hard 18-minute fail state triggers.【F:scripts/run-conditions.js†L1-L62】【F:scripts/constants.js†L120-L133】
- **Summary overlay** – A dedicated game-over panel details survival time, villages saved/lost, probe progress, and offers a one-click restart.【F:index.html†L66-L123】【F:scripts/run-conditions.js†L15-L62】

### Progression & Interface
- **Secret Tavern shop** – Enter the tavern’s radius to open a modal shop stocked with permanent stat upgrades; purchases populate inventory slots immediately.【F:index.html†L90-L102】【F:scripts/state.js†L42-L137】
- **Inventory management** – Drag-and-drop slots let you reorder upgrades. The UI reflects equipped bonuses in gold, health, and detection meters on the HUD.【F:index.html†L38-L89】【F:scripts/main.js†L110-L148】
- **Militia support** – Villages spawn militia archers that patrol, shoot raiding enemies, and fire their own projectiles with distinct stats to assist your defense.【F:scripts/state.js†L118-L171】【F:scripts/constants.js†L70-L116】

## Project Structure
- `index.html` renders the canvas, HUD overlays, shop modal, and game-over summary.
- `scripts/` contains modular systems for AI, rendering, UI, director logic, drag-and-drop inventory, and run conditions.
- `styles/` holds Tailwind-driven overrides and custom CSS for the medieval HUD.
- `server.js` exposes a minimal Express server used for local development.

## Roadmap Considerations

Future milestones can expand on this foundation by deepening enemy rosters, adding narrative-driven missions, and enriching the economy beyond the initial tavern offerings.
