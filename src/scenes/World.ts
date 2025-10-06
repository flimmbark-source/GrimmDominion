import Phaser from 'phaser';
import { HUD } from '../ui/HUD';
import type { Vec2, Stats } from '../types';

export class World extends Phaser.Scene {
  map!: Phaser.Tilemaps.Tilemap;
  layer!: Phaser.Tilemaps.TilemapLayer;
  hero!: Phaser.GameObjects.Sprite & { stats: Stats; target?: Vec2; speed: number };

  constructor() {
    super('world');
  }

  create(): void {
    this.map = this.make.tilemap({ key: 'map' });
    const tiles = this.map.addTilesetImage('tiles', 'tiles', 32, 32, 0, 0);
    this.layer = this.map.createLayer('ground', tiles!, 0, 0)!;

    this.hero = this.add.sprite(160, 160, 'tiles').setFrame(1) as any;
    this.physics.add.existing(this.hero);
    this.hero.speed = 100;
    this.hero.stats = {
      hp: 20,
      maxHp: 20,
      mana: 10,
      maxMana: 10,
      gold: 0,
      stealth: 100,
      stealthMax: 100
    };

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.hero.target = { x: p.worldX, y: p.worldY };
    });

    this.scene.launch('hud', { world: this });
  }

  update(_time: number, dt: number): void {
    const hero = this.hero;
    if (!hero.target) {
      return;
    }

    const dx = hero.target.x - hero.x;
    const dy = hero.target.y - hero.y;
    const dist = Math.hypot(dx, dy);
    const step = (hero.speed * dt) / 1000;

    if (dist > 2) {
      hero.x += (dx / dist) * step;
      hero.y += (dy / dist) * step;
    } else {
      hero.target = undefined;
    }
  }
}
