# Art & Audio Direction

## Visual Targets
- **Style:** Cartoony-gothic with exaggerated silhouettes and saturated accents inspired by storybook illustrations.
- **Characters:**
  - Dark Lord: Ornate armor, elongated proportions, cape with animated shadow tendrils.
  - Exiled Knight: Heavy armor with scorched heraldry, glowing valor sigil on shield.
  - Goblin Outlaw: Patchwork leather, jingling coin bags, oversized goggles.
- **Environments:** Modular biome kits with re-usable props (gnarled trees, crooked houses, rune stones). Shared texture atlas for performance.
- **UI:** Storybook frames with parchment textures, bold iconography for readability on mobile.

## Animation Priorities
- Hero locomotion blends (idle, jog, sprint) with additive combat swings.
- Dark Lord spellcasting loops for ritual node interactions.
- Minion behavior specific idles and alerts to telegraph AI state.
- Gate destruction stages with debris FX.

## VFX & Lighting
- Foggy volumetrics around castle, contrasting warm lighting near villages.
- Ability FX to reinforce gameplay clarity (e.g., Smoke Bomb opacity drop, Valor Surge aura).
- Low-poly particle systems tuned for mobile budgets; LOD swaps beyond 30m camera distance.

## Audio Pillars
- **Music:** Layered tracks that intensify as match escalates; bossy organ motifs during late-game assaults.
- **SFX:**
  - Goblin gold jingle, Knight shield clang, minion spawn whoosh.
  - UI sounds for alerts, pings, and resource gains.
- **VO:** Limited taunts for Dark Lord, hero exertions, contextual callouts for critical events.

## Technical Requirements
- Use FMOD middleware for adaptive music layers.
- Implement audio occlusion and distance falloff for spatial awareness.
- Budget: <40MB total audio footprint for mobile builds.
