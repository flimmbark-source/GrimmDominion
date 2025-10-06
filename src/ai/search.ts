import type { DLUnit } from './darkLord';
import type { Vec2 } from '../types';

export function stepDLUnits(
  units: DLUnit[],
  hero: { x: number; y: number },
  dt: number,
  setAlert: (message: string) => void
) {
  for (const unit of units) {
    const dx = hero.x - unit.sprite.x;
    const dy = hero.y - unit.sprite.y;
    const distance = Math.hypot(dx, dy);
    if (distance < unit.vision) {
      unit.state = 'Chase';
      unit.lastHeard = { x: hero.x, y: hero.y };
      setAlert('Spotted!');
    }
    if (unit.state === 'Patrol') {
      const target: Vec2 = {
        x: unit.sprite.x + Math.cos(performance.now() / 600) * 8,
        y: unit.sprite.y + Math.sin(performance.now() / 600) * 8
      };
      moveToward(unit, target, dt);
    } else if (unit.state === 'Chase' && unit.lastHeard) {
      moveToward(unit, unit.lastHeard, dt, 1.3);
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
