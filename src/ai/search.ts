import type { DLUnit } from './darkLord';
import type { Vec2, Stats } from '../types';
import { seenBy } from '../systems/stealth';

type HeroLike = {
  x: number;
  y: number;
  stats: Pick<Stats, 'stealth' | 'stealthMax'>;
};

export function stepDLUnits(
  units: DLUnit[],
  hero: HeroLike,
  dt: number,
  setAlert: (message: string) => void
) {
  for (const unit of units) {
    const spotted = seenBy(
      { x: unit.sprite.x, y: unit.sprite.y, vision: unit.vision },
      hero
    );

    if (spotted) {
      if (unit.state !== 'Chase') {
        setAlert('Spotted!');
      }
      unit.state = 'Chase';
      unit.lastHeard = { x: hero.x, y: hero.y };
    } else if (unit.state === 'Chase') {
      unit.state = 'Investigate';
    }

    if (unit.state === 'Patrol') {
      const target: Vec2 = {
        x: unit.sprite.x + Math.cos(performance.now() / 600) * 8,
        y: unit.sprite.y + Math.sin(performance.now() / 600) * 8
      };
      moveToward(unit, target, dt);
    } else if (unit.state === 'Investigate' && unit.lastHeard) {
      const distanceToNoise = Math.hypot(
        unit.lastHeard.x - unit.sprite.x,
        unit.lastHeard.y - unit.sprite.y
      );
      if (distanceToNoise <= 12) {
        unit.state = 'Patrol';
        unit.lastHeard = undefined;
      } else {
        moveToward(unit, unit.lastHeard, dt, 1.15);
      }
    } else if (unit.state === 'Chase') {
      unit.lastHeard = { x: hero.x, y: hero.y };
      moveToward(unit, { x: hero.x, y: hero.y }, dt, 1.3);
    }
  }
}

function moveToward(unit: DLUnit, target: Vec2, dt: number, multiplier = 1) {
  const dx = target.x - unit.sprite.x;
  const dy = target.y - unit.sprite.y;
  const distance = Math.hypot(dx, dy) || 1;
  const step = (unit.speed * multiplier * dt) / 1000;
  if (distance > 1) {
    unit.sprite.x += (dx / distance) * step;
    unit.sprite.y += (dy / distance) * step;
  }
}
