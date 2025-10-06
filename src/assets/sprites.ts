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
  chest: 9
} as const;
