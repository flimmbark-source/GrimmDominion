import Phaser from 'phaser';
import type { World } from '../scenes/World';

export class HUD extends Phaser.Scene {
  world!: World;
  hpBar!: Phaser.GameObjects.Rectangle;
  manaBar!: Phaser.GameObjects.Rectangle;
  stealthBar!: Phaser.GameObjects.Rectangle;

  constructor() {
    super('hud');
  }

  init(data: { world: World }): void {
    this.world = data.world;
  }

  create(): void {
    const add = this.add;
    const width = this.scale.width;
    const height = this.scale.height;

    add.text(12, height - 64, 'HP', { fontSize: '12px' }).setOrigin(0, 0.5);
    this.hpBar = add.rectangle(60, height - 64, 120, 10, 0xe74c3c).setOrigin(0, 0.5);

    add.text(12, height - 44, 'Mana', { fontSize: '12px' }).setOrigin(0, 0.5);
    this.manaBar = add.rectangle(60, height - 44, 120, 10, 0x3498db).setOrigin(0, 0.5);

    add.text(width / 2 - 100, height - 58, 'Inventory [1][2][3][4]', {
      fontSize: '12px'
    });
    add.text(width / 2 + 80, height - 58, 'ATK 2 | SPD 1 | LVL 1', { fontSize: '12px' });

    add.text(width - 160, height - 58, 'Stealth', { fontSize: '12px' });
    this.stealthBar = add.rectangle(width - 90, height - 58, 120, 10, 0x2ecc71).setOrigin(0, 0.5);

    this.cameras.main.setScroll(0, 0);
  }

  update(): void {
    const stats = this.world.hero.stats;
    this.hpBar.width = 120 * (stats.hp / stats.maxHp);
    this.manaBar.width = 120 * (stats.mana / stats.maxMana);
    this.stealthBar.width = 120 * (stats.stealth / stats.stealthMax);
  }
}
