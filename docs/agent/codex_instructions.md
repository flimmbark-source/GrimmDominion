codex_instructions.md — Grimm Dominion Agent Script (ChatGPT-5 Agent Mode)
0) SYSTEM CONTEXT (Do not skip)

You are refactoring the Grimm Dominion “Attempt-3” codebase to match the redesigned design document. You must be discerning:

Preserve working, reusable code and assets (helpers, enums, types, existing sprite sheets, any UI fragments that are compatible).

Replace only files explicitly targeted below when they conflict with the design. If uncertain, generate a DIFF preview and choose the safer path (preserve & adapt).

Click-to-move is the canonical control scheme (no WASD)

Grimm Dominion_ Building an Asy…

.

Prefer procedural/shape art first; sprite sheets may be wired later (keep asset hooks intact)

Grimm Dominion_ Building an Asy…

.

Follow the modular structure from the doc: Boot → Game → UI scenes, Hero/DarkLord/Minion entities, map module, UI module

Grimm Dominion_ Building an Asy…

.

Target branch: Attempt-4-agent-rebuild (create it). Do not force-push Attempt-3.

1) PRESERVE / PROHIBIT LIST
Preserve (read, reuse, adapt — don’t delete unless incompatible)

/public/assets/ (sprite sheets, sounds, etc.)

/src/types.ts (enums, shared types)

/src/utils/** (math/geometry/helpers)

Any UI/HUD fragments that do not conflict with the new UIScene (e.g., color/theme constants, positioning helpers)

Prohibit (safe to replace if conflicting with the new spec)

Any single “god scene” files that combine world + UI + AI in one place

“Black box” placeholder art that obscures gameplay readability

Legacy WASD control bindings (we are click-to-move)

2) GLOBAL CONVENTIONS

Language: TypeScript with ES Modules.

Engine: Phaser 3 via CDN for index.html; bundler logic should still compile TS.

Scene order: BootScene → GameScene → UIScene.

Art: Draw shapes w/ Graphics (rect, circle) for MVP; leave sprite hooks.

Map: 20×20 tiles, 50px each; biomes via color palette (forest/mountain/water)

Grimm Dominion_ Building an Asy…

.

Hero: click-to-move, gold pickups, detection meter (increase when seen, decay otherwise)

Grimm Dominion_ Building an Asy…

.

AI: Dark Lord accumulates resource on timers, spawns Minion (Scout) units, minions patrol & chase within range

Grimm Dominion_ Building an Asy…

.

3) EXECUTION PLAN (print each step result, then continue)
3.1 Create working branch

git checkout -b Attempt-4-agent-rebuild

Summarize current /src structure; list files that will be adapted vs replaced.

3.2 Discernment rule (run before each file change)

Open the existing file (if any).

If ≥ 30% of logic matches the new intent (behavioral overlap), reuse and adapt; otherwise rewrite.

Output a brief “Keep/Replace” rationale in comments at the top of the modified file.

4) PER-FILE TASKS (prompts the agent executes sequentially)

For each file: generate new content, then diff against current, apply discernment rule, and write.

4.1 index.html (root)

Goal: Minimal HTML shell that loads Phaser via CDN, mounts to #app.

Spec:

<title>Grimm Dominion</title>

<div id="app"></div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/phaser/3.80.0/phaser.min.js"></script> (or latest stable 3.x)

<script type="module" src="/src/main.ts"></script>

CSS: full-screen, dark background

Rationale: Matches doc sections 1–2 (project setup, Phaser init)

Grimm Dominion_ Building an Asy…

.

4.2 /src/main.ts

Goal: Configure Phaser and register scenes.

Spec:

Arcade physics (no gravity), 800×600

Scenes: BootScene, GameScene, UIScene

new Phaser.Game(config) appended to #app

Export nothing; pure entry file

Doc: Initialization & scene config

Grimm Dominion_ Building an Asy…

.

4.3 /src/scenes/BootScene.ts

Goal: Lightweight preloader → start GameScene.

Spec:

Preload minimal assets (optional)

create() → this.scene.start('GameScene')

4.4 /src/map.ts

Goal: Procedural map generator.

Spec:

export function generateMap(scene: Phaser.Scene): { width: number; height: number }

Draw 20×20 tiles @ 50px; choose biome color per tile (forest/mountain/water) using a fixed palette

Return {width,height} for world bounds

Keep hooks for replacing rects with sprites later

Doc: Section on procedural map

Grimm Dominion_ Building an Asy…

.

4.5 /src/entities/Hero.ts

Goal: Click-to-move hero with gold & detection system.

Spec:

export default class Hero extends Phaser.Physics.Arcade.Sprite

Create a small green circle texture for MVP (or load a basic sprite if present)

Input: on pointerdown, set a target point; in update, move toward it with Arcade velocity; stop within 4px

Properties: gold: number, detectionLevel: number, maxDetection: number

Methods: collectGold(item), seen(dt), updateDetection(dt), update(dt)

Bound check: setCollideWorldBounds(true)

Doc: Movement & pickups (adapted to click-to-move), detection meter

Grimm Dominion_ Building an Asy…

.

4.6 /src/entities/Minion.ts

Goal: Patrol & chase.

Spec:

Red circle sprite (MVP)

Patrol: pick random waypoint every 3s; move there

Chase: if distance(hero) < 150, use this.scene.physics.moveToObject(this.sprite, hero, speed)

Stub canSee(hero) returns true when in range (LOS later)

update(dt, hero)

Doc: Minion AI

Grimm Dominion_ Building an Asy…

.

4.7 /src/entities/DarkLord.ts

Goal: AI controller, spawns minions.

Spec:

Class with gold, minions: Minion[], timers

Every 2s: gold += 1

Every 5s: if gold >= 5, gold -= 5, spawn a Minion at a random valid position

update(dt, hero) loops over minions

Doc: Dark Lord controller & timers

Grimm Dominion_ Building an Asy…

.

4.8 /src/scenes/GameScene.ts

Goal: Main game loop.

Spec:

Generate map; set world bounds based on map size

Create Hero, DarkLord

Gold pickups: physics group; random scatter; physics.add.overlap(hero, gold, hero.collectGold, …)

Input: this.input.on('pointerdown', (pointer)=> hero.setTarget(pointer.worldX, pointer.worldY))

update(time, delta): hero.update(dt), darkLord.update(dt, hero)

Camera follow hero

Doc: Game orchestration, gold overlap usage

Grimm Dominion_ Building an Asy…

.

4.9 /src/scenes/UIScene.ts

Goal: Overlay HUD.

Spec:

Text: “Gold: X” (top-left)

Detection bar (top-center): black bg rect + filled fg rect; width proportional to hero.detectionLevel / hero.maxDetection

Use scene events or scene registry to read hero state from GameScene each frame

Runs in parallel with GameScene (launch as overlay)

Doc: UI bar pattern mirrors “health bar” example

Grimm Dominion_ Building an Asy…

.

4.10 /src/ui/index.ts (optional)

Goal: Keep/reuse any UI constants/helpers from existing repo, re-export for UIScene.

Apply discernment; do not duplicate logic already present in legacy HUD if compatible.

5) VALIDATION & DIFF CHECKS (after each file)

For each file above:

Print a unified diff versus existing file (if existed).

Apply discernment rule (reuse ≥30% or rewrite).

Report:

Imports verified? (list unresolved imports)

Unused symbols?

External asset deps?

Write the file.

After all files:

Build a short report: remaining TODOs (LOS, sprites hookup, lighting).

6) INTEGRATION & RUN CHECK

Ensure BootScene starts GameScene; UIScene overlays GameScene.

Ensure pointer click moves the hero (no WASD).

Ensure dark background canvas is visible; map tiles render; gold spawns and collects; minions spawn & chase.

If a sprite sheet exists in /public/assets, leave hooks (do not break MVP if LFS missing).

7) COMMIT & PR

git add -A

git commit -m "Agent rebuild: modular scenes, click-to-move hero, Dark Lord AI, minion patrol/chase, HUD; preserves assets and helpers"

git push -u origin Attempt-4-agent-rebuild

Open a PR targeting Attempt-3 with a checklist:

 Scenes modularized

 Click-to-move works

 Gold & detection UI updating

 Dark Lord timers, minion spawning

 No reliance on non-present LFS assets for MVP

8) NOTES TO SELF (agent)

When scanning legacy files (e.g., any huge HUD.ts), salvage utility fragments (text styles, alignment helpers) that don’t conflict with UIScene.

Where older code uses WASD, remove bindings and replace with pointer logic.

Where legacy art is opaque (“black boxes”), replace with Graphics shapes and add comments to later slot real sprites.

Keep code comments minimal but clear so future contributors can extend for multiplayer.
