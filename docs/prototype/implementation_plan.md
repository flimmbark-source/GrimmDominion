# Vertical Slice Implementation Plan

## Overview
This plan consolidates the cross-discipline Markdown documentation for the Grimm Dominion vertical slice into an executable
development roadmap. It translates the design intent into buildable epics, outlines feature acceptance criteria, and flags
integration checkpoints so engineering, design, and content teams can stay aligned.

## Playable Experience Outline
1. **Match Setup:** Players queue into a single map variant (castle plateau + three biome chunks). Dark Lord selects two minion
   loadouts; heroes confirm role-specific starter kits.
2. **Early Game (0–5 min):** Knight pursues Rescue Villagers quest while Goblin scouts gold caches. Dark Lord scouts via scout
   imps and Shadow Pulse pings. Tutorial tips surface contextual controls.
3. **Mid Game (5–10 min):** Valor and gold unlock second-tier abilities. Castle defenses escalate with tower upgrades and
   Bonecrusher unlock. Heroes coordinate to pressure the gate.
4. **Late Game (10–15 min):** Gate breach triggers Defend the Gate quest, Ritual Node becomes available, and match resolves via
   castle destruction or hero wipe.

## Feature Development Epics
### 1. Shared Systems
- **Stealth & Detection Framework**
  - Author networked fog-of-war service with per-faction visibility masks.
  - Implement noise signature events feeding Dark Lord alert UI and Goblin stealth indicator.
- **Resource Economies**
  - Track Evil Energy, Valor, and Gold as replicated stats with UI bindings described in role docs.
  - Build economy sinks (summoning pads, valor abilities, tavern upgrades) with server validation.
- **Match Progression & Telemetry**
  - Capture match duration, role selections, ability usage, and win/loss events for success metric review.

### 2. Dark Lord Commander
- Tactical UI with unit roster, ability bar, and alert log per `roles.md`.
- Minion portal placement and upgrade flow aligned with escalation rules in `systems.md`.
- Castle fortification interactions (gate repairs, tower upgrades, ritual trigger) using castle specs from `world.md`.

### 3. Exiled Knight Hero
- Third-person controller with Valor quest tracker and Bulwark Ward deployable behavior.
- Quest scripting for Rescue Villagers, Retrieve Relic, and Defend the Gate per `world.md` objectives.
- Valor Surge area buff with networked effect indicators.

### 4. Goblin Outlaw Hero
- Stealth movement model including disguise mechanic from `systems.md`.
- Lootable gold cache props seeded along economy routes defined in `world.md`.
- Tavern upgrade radial matching `roles.md` ability cadence (Smoke Bomb CDR, speed boots, noise charm).

### 5. World Assembly
- Procedural chunk assembler choosing variants for Haunted Village, Ancient Shrine, and Shadowed Forest.
- Navigation mesh baking hooks per chunk and path stitching between them.
- Event triggers: patrol ambush, tavern rumors, shrine control bonuses.

### 6. UX & Controls
- Mobile-friendly control profiles for commander (tap-to-command) and heroes (dual-stick + abilities) per `ux.md`.
- HUD widgets: valor tracker, gold counter, stealth/noise meters, objective pips.
- Contextual tutorials for onboarding (movement, economy loops, gate pressure).

### 7. Art & Audio Integration
- Blockout asset list for castle, biome chunks, minions, and hero VFX based on `art_audio.md` tone guidelines.
- Audio cues for noise events, ability activations, and gate damage aligned with stealth readability goals.
- Performance targets: optimize materials and VFX budgets to sustain 30 FPS on reference hardware.

### 8. Technology & Infrastructure
- Client-hosted authoritative server with rollback corrections as defined in `technology.md`.
- Stub matchmaking flow funneling into single playlist; telemetry uploads at match end.
- Build automation for Android/iOS test devices and PC editor validation.

## Milestone Checkpoints
1. **Foundation Sprint (Weeks 1–3):** Establish core systems (fog-of-war, resources), implement commander UI shell, assemble
   greybox map chunks, and integrate telemetry scaffolding.
2. **Role Feature Sprint (Weeks 4–6):** Complete Knight and Goblin ability kits, finalize Dark Lord minion behaviors, and polish
   hero HUD elements.
3. **Content & Polish Sprint (Weeks 7–9):** Populate quest scripting, event triggers, art blockouts, and performance tuning.
4. **Stability & Playtest Sprint (Weeks 10–12):** Run internal playtests, triage stability issues, iterate on UX pain points, and
   lock scope for submission.

## Cross-Discipline Dependencies
- **AI & Networking:** Behavior tree authoring requires synchronized intention packets; coordinate with netcode team for
  predictive simulation hooks.
- **UI/UX & Engineering:** Ensure data bindings for Valor, Gold, and Evil Energy are exposed before HUD polish sprint.
- **Art & Level Design:** Chunk variants must respect navmesh and stealth cover metrics to preserve gameplay beats.

## Open Questions
> **Open Question:** Do we require mid-match role swap tooling for playtests, or is lobby reseat sufficient?
> **Open Question:** Should telemetry capture hero noise events individually to study stealth readability?

## Acceptance Criteria Snapshot
- All success metrics in `vision.md` are measurable via telemetry dashboards.
- Match flow reliably produces early/mid/late beats with configured quest triggers.
- Heroes and Dark Lord each have complete, responsive control schemes on reference mobile hardware.
- No blocker bugs during three consecutive 15-minute internal sessions.
