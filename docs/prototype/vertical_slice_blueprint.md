# Vertical Slice Blueprint

## Purpose
This blueprint converts the design intent captured across the prototype documentation into a buildable vertical slice target. It
summarizes the playable experience, enumerates the required features per discipline, and defines the integration cadence so that
engineering, design, art, and production teams can converge on a cohesive delivery.

## Experience Pillars
- **Asymmetric Tension:** Preserve the push-and-pull between the Dark Lord commander and the two mobile heroes, ensuring each
  role can exert pressure in distinct ways as outlined in [roles.md](roles.md).
- **Readable Stealth & Counterplay:** Maintain clarity in fog-of-war, noise, and disguise interactions per
  [systems.md](systems.md) so both sides understand when they are exposed or hidden.
- **Procedural Variety with Authored Beats:** Assemble the castle plateau and three biome chunks described in
  [world.md](world.md) to create replayable matches that still hit scripted quest moments.
- **Mobile-First Accessibility:** Deliver touch-friendly controls and HUD readability expectations captured in [ux.md](ux.md).

## Match Flow Snapshot
1. **Onboarding & Load-In**
   - Single playlist drops three players (Dark Lord, Exiled Knight, Goblin Outlaw) into the castle plateau map configuration.
   - Tutorial prompts surface first-move guidance for each role, referencing the loops in [roles.md](roles.md).
2. **Early Game (0–5 minutes)**
   - Knight pursues *Rescue Villagers* quest, Goblin scouts initial gold caches, Dark Lord deploys scout imps to establish vision.
   - Stealth indicators and noise pings validate the shared detection framework from [systems.md](systems.md).
3. **Mid Game (5–10 minutes)**
   - Resource thresholds unlock tier-two abilities (Valor Surge, Bonecrusher spawns, tavern upgrades).
   - Castle defenses escalate with the gate upgrade option while the shrine objective shifts Evil Energy income as described in
     [world.md](world.md).
4. **Late Game (10–15 minutes)**
   - Gate breach or ritual trigger forces the *Defend the Gate* quest and concludes the match when the castle falls or heroes wipe.
   - Telemetry marks win conditions for success metrics tracked in [vision.md](vision.md) and [technology.md](technology.md).

## Feature Matrix
| Discipline | Deliverable | Acceptance Notes |
| --- | --- | --- |
| **Engineering** | Fog-of-war service, noise event pipeline, and detection UI hooks | Matches spec in [systems.md](systems.md); latency budget under 150ms round-trip. |
| | Networked resource economies (Evil Energy, Valor, Gold) | Server-authoritative with UI bindings from [roles.md](roles.md) and [ux.md](ux.md). |
| | Photon Fusion room management and reconnection flow | Aligns with architecture guidance in [technology.md](technology.md). |
| **Design** | Quest scripting for Knight objectives and Goblin economy loops | Follows sequencing in [world.md](world.md), validated during milestone playtests. |
| | Minion behavior trees and escalation rules | Behavior authoring per [systems.md](systems.md); integrates with commander toolkit. |
| **Art** | Greybox-to-blockout pass on castle, biome chunks, and hero/minion kits | Supports silhouettes and lighting beats from [art_audio.md](art_audio.md). |
| | HUD theming and iconography | Implements mobile readability goals in [ux.md](ux.md). |
| **Audio** | Reactive music layers, key SFX cues, and VO stingers | Prioritize callouts listed in [art_audio.md](art_audio.md); ensure FMOD integration. |
| **Production** | Sprint tracking, risk register, and milestone reviews | Mirrors cadence defined in [roadmap.md](roadmap.md) with weekly check-ins. |

## Build Increments
- **Increment 1 – Systems Foundation** (Weeks 1–3)
  - Implement fog-of-war, resource replication, and commander UI shell.
  - Assemble greybox castle plateau and biome chunks; bake navigation meshes.
  - Stand up telemetry scaffolding to capture success metrics from [vision.md](vision.md).
- **Increment 2 – Role Feature Complete** (Weeks 4–6)
  - Ship Knight and Goblin ability kits, quests, and economy loops with placeholder art.
  - Finalize Dark Lord minion roster and escalation pacing.
  - Hook up HUD widgets, minimap pings, and contextual tutorials per [ux.md](ux.md).
- **Increment 3 – Content & Polish** (Weeks 7–9)
  - Populate scripted events, art blockouts, SFX/VFX beats, and performance optimization tasks.
  - Conduct cross-discipline playtests to validate match flow and telemetry coverage.
- **Increment 4 – Stability & Demo Readiness** (Weeks 10–12)
  - Focus on bug triage, frame-rate tuning, network soak tests, and final playtest sign-off as defined in
    [implementation_plan.md](implementation_plan.md).

## Playtest Cadence
- **Internal Milestone Reviews:** End of each increment with strike team walkthroughs evaluating feature completeness against
  this blueprint.
- **Weekly Balance Labs:** Designers and QA run focused sessions targeting stealth readability, resource pacing, and commander
  pressure.
- **Pre-Demo Regression:** Final week stress tests match duration, mobile performance, and reconnection handling to satisfy
  [vision.md](vision.md) metrics.

## Risk & Mitigation Highlights
- **Network Desync During Stealth Events:** Mitigate by prioritizing reliable RPCs for state changes and adding telemetry hooks to
  flag mismatches (see [technology.md](technology.md)).
- **Mobile Performance Drops in Large Fights:** Budget VFX and audio per [art_audio.md](art_audio.md) guidelines; add automated
  performance captures.
- **Role Onboarding Complexity:** Expand tutorial prompt coverage and quick chat options from [ux.md](ux.md) to support players.

## Deliverable Definition of Done
- All features in this blueprint trace to verifiable acceptance criteria in [implementation_plan.md](implementation_plan.md).
- Three consecutive 15-minute playtests conclude without blockers, hitting KPI targets in [vision.md](vision.md).
- Build available on Android and iOS test devices via CI pipeline, with release notes summarizing known issues and telemetry
  status.
