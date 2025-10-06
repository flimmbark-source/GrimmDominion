import type { Vec2 } from '../types';
import { EnemyFrames, SpriteKeys } from '../assets/sprites';

export type DLUnit = {
  sprite: Phaser.GameObjects.Sprite;
  kind: 'Scout' | 'Tank' | 'Priest';
  speed: number;
  vision: number;
  state: 'Patrol' | 'Investigate' | 'Chase';
  lastHeard?: Vec2;
};

export class DarkLordAI {
  energy = 0;
  cap = 5;
  units: DLUnit[] = [];
  lastPing: Vec2 | null = null;

  constructor(private scene: Phaser.Scene, private castlePos: Vec2) {}

  step(dt: number) {
    this.energy += 0.5 * dt;
  }

  spawn(kind: 'Scout' | 'Tank' | 'Priest') {
    if (this.units.length >= this.cap) {
      return false;
    }
    const cost = { Scout: 10, Tank: 25, Priest: 20 }[kind];
    if (this.energy < cost) {
      return false;
    }
    this.energy -= cost;
    const sprite = this.scene.add
      .sprite(
        this.castlePos.x + 16,
        this.castlePos.y,
        SpriteKeys.enemies,
        EnemyFrames[kind]
      )
      .setOrigin(0.5, 0.9);
    const speed = { Scout: 70, Tank: 40, Priest: 55 }[kind];
    const vision = { Scout: 120, Tank: 80, Priest: 100 }[kind];
    this.units.push({ sprite, kind, speed, vision, state: 'Patrol' });
    return true;
  }

  directorTick() {
    if (this.units.length < 2) {
      this.spawn('Scout');
    }
    if (this.lastPing && this.energy >= 20) {
      this.spawn('Priest');
    }
  }
}
