import Phaser from 'phaser';
import { HUD } from '../ui/HUD';
import type { Vec2, Stats } from '../types';
import { addChest } from '../world/chest';
import { Noise, emitFootsteps } from '../systems/noise';
import { DarkLordAI } from '../ai/darkLord';
import { stepDLUnits } from '../ai/search';

type HeroSprite = Phaser.GameObjects.Sprite & {
  stats: Stats;
  target?: Vec2;
  speed: number;
};

export class World extends Phaser.Scene {
  hero!: Phaser.GameObjects.Sprite & { stats: Stats; target?: Vec2; speed: number };
  marker!: Phaser.GameObjects.Rectangle;
  private noiseOff?: () => void;
  private _stepAccumulator = 0;
  private darkLord!: DarkLordAI;

  constructor() {
    super('world');
  }

  async create(): Promise<void> {
    const groundWidth = 2000;
    const groundHeight = 1200;
    this.add
      .rectangle(groundWidth / 2, groundHeight / 2, groundWidth, groundHeight, 0x1f2a1f)
      .setOrigin(0.5)
      .setDepth(-100);

    this.cameras.main.setBounds(0, 0, groundWidth, groundHeight);

    this.hero = this.add.sprite(groundWidth / 2, groundHeight / 2, 'hero-placeholder') as HeroSprite;
    this.hero.setOrigin(0.5, 0.9);
    this.physics.add.existing(this.hero);
    this.hero.speed = 3.5;
    this.hero.stats = {
      hp: 20,
      maxHp: 20,
      mana: 10,
      maxMana: 10,
      gold: 0,
      stealth: 100,
      stealthMax: 100
    };
    this.hero.setDepth(this.hero.y + 10);

    this.cameras.main.startFollow(this.hero, true, 0.15, 0.15);
    this.cameras.main.setZoom(1.5);

    this.input.mouse?.disableContextMenu();

    this.marker = this.add.rectangle(0, 0, 8, 8, 0xffffff).setVisible(false);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.rightButtonDown()) {
        this.hero.target = undefined;
        this.marker.setVisible(false);
        return;
      }

      this.hero.target = { x: p.worldX, y: p.worldY };
      this.marker
        .setPosition(p.worldX, p.worldY)
        .setDepth(p.worldY + 1)
        .setVisible(true);
    });

    this.scene.launch('hud', { world: this });

    this.populateProps();

    const castle = this.add.image(480, 240, 'tiles').setFrame(7).setScale(1.3);
    this.darkLord = new DarkLordAI(this, { x: castle.x, y: castle.y });
    this.time.addEvent({ delay: 2000, loop: true, callback: () => this.darkLord.directorTick() });
    this.darkLord.spawn('Scout');
    const { spawnVillage, spawnFauna } = await import('../world/spawners');
    spawnVillage(this, 320, 160);
    spawnFauna(this, 6);

    addChest(this, 320, 140);
    addChest(this, 340, 180);

    this.events.on('loot:gold', (gold: number) => {
      this.hero.stats.gold += gold;
    });

    (this as any).DL = undefined;
    this.noiseOff = Noise.on((event) => {
      (this as any).DL?.units?.forEach((unit: any) => {
        unit.lastHeard = event.pos;
      });
      (this.game as any).setAlert(event.kind === 'chest' ? 'Chest noise!' : 'Footsteps!');
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.noiseOff?.();
    });
  }

  update(_time: number, dt: number): void {
    const hero = this.hero;

    if (this.darkLord) {
      this.darkLord.step(dt);
      stepDLUnits(this.darkLord.units, this.hero, dt, (message) =>
        (this.game as any).setAlert(message)
      );
    }

    if (!hero.target) {
      this.marker.setVisible(false);
      this._stepAccumulator = 0;
      hero.setDepth(hero.y + 10);
      return;
    }

    const dx = hero.target.x - hero.x;
    const dy = hero.target.y - hero.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 0.001) {
      hero.setPosition(hero.target.x, hero.target.y);
      hero.target = undefined;
      this._stepAccumulator = 0;
      this.marker.setVisible(false);
      hero.setDepth(hero.y + 10);
      return;
    }

    const step = (hero.speed * dt) / 1000;
    if (step >= distance) {
      hero.setPosition(hero.target.x, hero.target.y);
      hero.target = undefined;
      this.marker.setVisible(false);
      this._stepAccumulator = 0;
    } else {
      hero.setPosition(hero.x + (dx / distance) * step, hero.y + (dy / distance) * step);
    }

    hero.setDepth(hero.y + 10);

    if (hero.target) {
      this.marker.setPosition(hero.target.x, hero.target.y);
    }

    this._stepAccumulator += dt;
    if (this._stepAccumulator > 500) {
      emitFootsteps({ x: hero.x, y: hero.y });
      this._stepAccumulator = 0;
    }
  }

  private populateProps(): void {
    const decorLayer = this.add.layer();
    const props = [
      { key: 'prop-stone-placeholder', count: 6, depthOffset: 5 },
      { key: 'prop-shrub-placeholder', count: 4, depthOffset: 12 }
    ];

    props.forEach(({ key, count, depthOffset }) => {
      for (let i = 0; i < count; i++) {
        const x = Phaser.Math.Between(200, 1800);
        const y = Phaser.Math.Between(200, 1000);
        decorLayer.add(
          this.add.image(x, y, key).setOrigin(0.5, 1).setDepth(y + depthOffset)
        );
      }
    });
  }
}
