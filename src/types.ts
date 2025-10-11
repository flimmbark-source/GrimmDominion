export type Team = 'Heroes' | 'DarkLord' | 'Neutral';

export type Vec2 = { x: number; y: number };

export type NoiseEvent = {
  pos: Vec2;
  radius: number;
  kind: 'steps' | 'chest' | 'combat';
};

export interface Stats {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  gold: number;
  stealth: number;
  stealthMax: number;
  atk?: number;
  speedMult?: number;
}

export type NormalizedPosition = { x: number; y: number };

export type HeroMoveEventDetail = {
  normalized: NormalizedPosition;
  world: { x: number; z: number };
};

declare global {
  interface WindowEventMap {
    'hero-move': CustomEvent<HeroMoveEventDetail>;
  }
}
