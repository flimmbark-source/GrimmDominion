export const SpriteKeys = {
  heroes: 'heroes',
  enemies: 'enemies',
  settlements: 'settlements',
  effects: 'effects'
} as const;

export const HeroFrames = {
  goblinIdle: 30
} as const;

export const VillagerFrames = [32, 33, 34] as const;

export const EnemyFrames = {
  Scout: 0,
  Tank: 8,
  Priest: 16
} as const;

export const SettlementFrames = {
  farmland: 0,
  forest: 1,
  hut: 2,
  house: 18,
  castle: 17,
  shrub: 9,
  stone: 48
} as const;

export const EffectFrames = {
  chest: 9,
  heroPortrait: 12,
  heroPanel: 13,
  hudPanel: 14,
  abilityTray: 15,
  abilitySlot: 16,
  abilitySmokeBomb: 17,
  abilityDagger: 18,
  abilityShadowStep: 19,
  abilityValorSurge: 20,
  keyTag: 21,
  inventorySlot: 22,
  inventoryPlaceholder: 23,
  tavernPanel: 24
} as const;
