import Phaser from 'phaser';
import { EffectFrames, SpriteKeys } from '../assets/sprites';
import type { World } from '../scenes/World';

export class HUD extends Phaser.Scene {
  world!: World;
  hpBar!: Phaser.GameObjects.Rectangle;
  manaBar!: Phaser.GameObjects.Rectangle;
  stealthBar!: Phaser.GameObjects.Rectangle;
  alert!: Phaser.GameObjects.Text;
  statsText!: Phaser.GameObjects.Text;
  slots: Phaser.GameObjects.Sprite[] = [];

  private static readonly BAR_WIDTH = 120;
  private static readonly BAR_HEIGHT = 10;
  private static readonly BAR_LERP = 0.2;

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
    const bottom = height - 36;

    const hpY = bottom - 32;
    const manaY = bottom - 14;
    const hpLabel = add
      .text(16, hpY, 'HP', { fontSize: '12px', color: '#fceaea' })
      .setOrigin(0, 0.5)
      .setAlpha(0.85);
    const hpBg = add
      .rectangle(48, hpY, HUD.BAR_WIDTH, HUD.BAR_HEIGHT, 0x111111)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x2a2a2a)
      .setAlpha(0.85);
    this.hpBar = add
      .rectangle(48, hpY, HUD.BAR_WIDTH, HUD.BAR_HEIGHT, 0xe74c3c)
      .setOrigin(0, 0.5)
      .setAlpha(0.9);

    const manaLabel = add
      .text(16, manaY, 'Mana', { fontSize: '12px', color: '#e0f0ff' })
      .setOrigin(0, 0.5)
      .setAlpha(0.85);
    const manaBg = add
      .rectangle(48, manaY, HUD.BAR_WIDTH, HUD.BAR_HEIGHT, 0x111111)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x2a2a2a)
      .setAlpha(0.85);
    this.manaBar = add
      .rectangle(48, manaY, HUD.BAR_WIDTH, HUD.BAR_HEIGHT, 0x3498db)
      .setOrigin(0, 0.5)
      .setAlpha(0.9);

    hpLabel.setDepth(1);
    manaLabel.setDepth(1);
    hpBg.setDepth(0);
    manaBg.setDepth(0);

    const inventoryY = bottom - 26;
    const slotSpacing = 36;
    const slotStartX = width / 2 - slotSpacing * 1.5;
    add
      .text(width / 2, inventoryY - 22, 'Inventory', {
        fontSize: '12px',
        color: '#f4f1de'
      })
      .setOrigin(0.5, 0.5)
      .setAlpha(0.9);

    this.slots = [];
    for (let i = 0; i < 4; i++) {
      const slot = add
        .sprite(slotStartX + i * slotSpacing, inventoryY, SpriteKeys.effects, EffectFrames.chest)
        .setDisplaySize(32, 32)
        .setOrigin(0.5, 0.5)
        .setTint(0x555555)
        .setAlpha(0.85);
      this.slots.push(slot);
    }

    const statsX = slotStartX + slotSpacing * 2 + 64;
    add
      .text(statsX, inventoryY - 22, 'Stats', { fontSize: '12px', color: '#dcdcdc' })
      .setOrigin(0, 0.5)
      .setAlpha(0.9);
    this.statsText = add
      .text(statsX, inventoryY + 2, '', { fontSize: '12px', color: '#f4f1de' })
      .setOrigin(0, 0.5)
      .setAlpha(0.9);

    const stealthY = bottom - 28;
    const stealthLabelX = width - 220;
    add
      .text(stealthLabelX, stealthY - 16, 'Stealth', { fontSize: '12px', color: '#c8f7c5' })
      .setOrigin(0, 0.5)
      .setAlpha(0.9);
    const stealthBg = add
      .rectangle(stealthLabelX, stealthY, HUD.BAR_WIDTH, HUD.BAR_HEIGHT, 0x111111)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x2a2a2a)
      .setAlpha(0.85);
    this.stealthBar = add
      .rectangle(stealthLabelX, stealthY, HUD.BAR_WIDTH, HUD.BAR_HEIGHT, 0x2ecc71)
      .setOrigin(0, 0.5)
      .setAlpha(0.9);
    stealthBg.setDepth(0);

    this.alert = add
      .text(width - 160, bottom - 8, 'No alerts', { fontSize: '12px', color: '#ffffff' })
      .setOrigin(0, 0.5)
      .setAlpha(0.8);

    const setAlert = (msg: string) => this.alert.setText(msg);
    (this.game as unknown as { setAlert?: (msg: string) => void }).setAlert = setAlert;
    (globalThis as { setAlert?: (msg: string) => void }).setAlert = setAlert;

    this.cameras.main.setScroll(0, 0);
  }

  update(): void {
    const stats = this.world.hero.stats;
    const hpTarget = HUD.BAR_WIDTH * (stats.hp / stats.maxHp);
    const manaTarget = HUD.BAR_WIDTH * (stats.mana / stats.maxMana);
    const stealthTarget = HUD.BAR_WIDTH * (stats.stealth / stats.stealthMax);

    this.hpBar.width = this.lerpBar(this.hpBar.width, hpTarget);
    this.manaBar.width = this.lerpBar(this.manaBar.width, manaTarget);
    this.stealthBar.width = this.lerpBar(this.stealthBar.width, stealthTarget);

    this.statsText.setText(
      `Gold ${stats.gold} | SPD ${this.world.hero.speed.toFixed(1)} | Mana ${stats.mana}/${stats.maxMana}`
    );
  }

  private lerpBar(current: number, target: number): number {
    const lerped = Phaser.Math.Linear(current, target, HUD.BAR_LERP);
    return Math.abs(lerped - target) < 0.5 ? target : lerped;
  }
}
