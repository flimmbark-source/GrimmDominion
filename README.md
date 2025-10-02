# Grimm Dominion Prototype

## Running in GitHub Codespaces

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server (Codespaces will automatically forward the port):
   ```bash
   npm start
   ```
3. Open the forwarded URL in your browser to play the game.

The server uses Express to serve the static game assets from `index.html`, `scripts/`, and `styles/` so the prototype runs reliably inside Codespaces.
## Overview
Grimm Dominion is a top-down strategy prototype where players defend the realm from encroaching Dark Lord scouts. The project currently targets **Milestone 2: Inventory Management**, focusing on core combat, village defense, and player progression loops.

## Gameplay Summary
- **Hero Control** – Click anywhere on the map to send the hero moving toward that location. The hero automatically attacks nearby scouts with ranged projectiles when they enter attack range.
- **Dark Lord Scouts** – Scouts patrol the wilderness, rally to attack discovered villages, and chase the hero when they spot them. They gain combat buffs after engaging a target, making quick responses critical.
- **Villages & Militia** – Villages contain huts, villagers, and militia defenders. When under attack, militia rally toward invading scouts and fire projectiles to protect their homes.
- **Reward Loop** – Saving a village rewards the hero with gold and celebratory world text effects. Militia victories without hero aid trigger alternate messages, keeping the world reactive.
- **Shops & Upgrades** – Approach the Secret Tavern to open the shop and purchase permanent stat upgrades that immediately populate the hero’s inventory slots.
- **Inventory Management** – Drag and drop item icons to reorder upgrades within the hero’s inventory grid. Visual feedback tracks the dragged item and slot targets.
- **Stealth Pressure** – A detection meter fills when scouts maintain line of sight. Sprinting or attacking emits noise pings that can lure patrols away, but breaking sight quickly bleeds danger back to safety.

## User Interface
- **HUD** – Displays current gold and a dynamic health bar that updates every frame based on the hero’s stats.
- **World Rendering** – The canvas illustrates forests, villages, the castle, the shop, active projectiles, and warning indicators for off-screen village attacks.
- **Game Over Screen** – If the hero falls, a dedicated overlay informs the player and prompts a restart.

## Running the Prototype
This build is fully client-side. Serve the repository with any static file server or open `index.html` directly in a modern browser that supports ES modules. The game automatically adapts the canvas to the browser window and begins spawning scouts over time.

## Next Steps
Key systems already in place include hero combat, enemy AI, village defense, and item management. Future milestones can build on this foundation by expanding enemy variety, adding mission structure, or deepening economic mechanics.
