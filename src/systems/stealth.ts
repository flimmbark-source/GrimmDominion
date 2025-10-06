import type { Vec2 } from '../types';

type Terrain = 'grass' | 'forest' | 'road';

type TileClassifier = (pos: Vec2) => Terrain;

type HeroLike = {
  x: number;
  y: number;
  stats: {
    stealth: number;
    stealthMax: number;
  };
};

type UnitLike = {
  x: number;
  y: number;
  vision: number;
};

export function applyTerrainStealth(hero: HeroLike, tileAt: TileClassifier): void {
  const terrain = tileAt({ x: hero.x, y: hero.y });
  const multiplier = terrain === 'forest' ? 1.015 : terrain === 'road' ? 0.985 : 1.0;
  const value = hero.stats.stealth * multiplier;
  hero.stats.stealth = Math.min(hero.stats.stealthMax, Math.max(0, value));
}

export function seenBy(unit: UnitLike, hero: HeroLike): boolean {
  const distance = Math.hypot(hero.x - unit.x, hero.y - unit.y);
  const stealthThreshold = hero.stats.stealthMax * 0.6;
  const visibilityMultiplier = hero.stats.stealth > stealthThreshold ? 0.6 : 1.0;
  return distance < unit.vision * visibilityMultiplier;
}
