# Core Systems

## Shared Stealth & Detection
- **Fog of War:** Server maintains authoritative visibility. Heroes see in a 120° cone with 25m radius, Dark Lord sees via minion vision and castle sensors.
- **Noise Events:** Movement, combat, and interactions emit noise signatures stored for 5 seconds. Dark Lord receives pings based on minion proximity and active Shadow Pulse.
- **Disguises & Deception:** Goblin can disguise as villagers when stationary; detection requires minion inspection within 5m.

## Resource Economies
- **Evil Energy:** Passive trickle plus bonus from captured shrines. Spent on unit spawns (cost scaling by tier) and spells. Cap at 100 to encourage spending.
- **Valor:** Quest completions grant 1–3 Valor; used to unlock Knight abilities and consumables at campfires.
- **Gold:** Goblin collects from caches (5–15 each) and chest events; spent at tavern for stat boosts and utility items.

## AI Minions
- **Archetypes:**
  - *Scout Imp:* Fast, low damage, high vision. Patrol paths and report sightings.
  - *Bonecrusher:* Tanky melee unit with gate-guard behavior. Reacts to pings by converging.
  - *Hex Priest:* Ranged support that channels debuffs, vulnerable when interrupted.
- **Behavior Trees:** Authored in Unity using scriptable nodes. Server sends intention packets; clients simulate for responsiveness with reconciliation.
- **Escalation Rules:** Unlock stronger minion waves at 5 and 10-minute marks, triggered by castle energy thresholds.

## Combat & Progression
- **Hero Downed State:** Heroes fall into a 20-second revival window. Dark Lord can execute via spell; allies can revive with channel.
- **Damage Model:** Light action combat with cooldown abilities, no friendly fire. Armor types (cloth, leather, plate) interact with minion damage modifiers.
- **Progression Hooks:** Track match XP and account progression for post-match screens; placeholder UI suffices.
