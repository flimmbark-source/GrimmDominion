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
  cart: Vec2;
};

type IsoConfig = {
  tileWidth: number;
  tileHeight: number;
  halfTileWidth: number;
  halfTileHeight: number;
  gridWidth: number;
  gridHeight: number;
  origin: Vec2;
};

export class World extends Phaser.Scene {
  map!: Phaser.Tilemaps.Tilemap;
  layer!: Phaser.Tilemaps.TilemapLayer;
  hero!: Phaser.GameObjects.Sprite & { stats: Stats; target?: Vec2; speed: number };
  marker!: Phaser.GameObjects.Rectangle;
  private noiseOff?: () => void;
  private _stepAccumulator = 0;
  private darkLord!: DarkLordAI;

  constructor() {
    super('world');
  }

  async create(): Promise<void> {
    this.iso = {
      tileWidth: 64,
      tileHeight: 32,
      halfTileWidth: 32,
      halfTileHeight: 16,
      gridWidth: 16,
      gridHeight: 16,
      origin: { x: 512, y: 96 }
    };

    this.ground = this.add.layer();
    this.buildIsometricGround();

    this.hero = this.add.sprite(0, 0, 'hero-placeholder') as HeroSprite;
    this.hero.setOrigin(0.5, 0.9);
    this.physics.add.existing(this.hero);
    this.hero.speed = 3.5;
    this.hero.cart = {
      x: this.iso.gridWidth / 2,
      y: this.iso.gridHeight / 2
    };
    this.hero.stats = {
      hp: 20,
      maxHp: 20,
      mana: 10,
      maxMana: 10,
      gold: 0,
      stealth: 100,
      stealthMax: 100
    };

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
      this.marker.setPosition(p.worldX, p.worldY).setVisible(true);
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
    this.darkLord.step(dt);
    stepDLUnits(this.darkLord.units, this.hero, dt, (message) =>
      (this.game as any).setAlert(message)
    );
    if (!hero.target) {
      this.marker.setVisible(false);
      this._stepAccumulator = 0;
      return;
    }

    if (!this._stepAccumulator) {
      this._stepAccumulator = 0;
    }

    this._stepAccumulator += dt;
    if (this._stepAccumulator > 500) {
      emitFootsteps({ x: hero.x, y: hero.y });
      this._stepAccumulator = 0;
    }
  }

  private createDiamondShape(width: number, halfHeight: number): number[] {
    const halfWidth = width / 2;
    return [0, -halfHeight, halfWidth, 0, 0, halfHeight, -halfWidth, 0];
  }

  private cartToIso(cart: Vec2): Vec2 {
    return {
      x: (cart.x - cart.y) * this.iso.halfTileWidth,
      y: (cart.x + cart.y) * this.iso.halfTileHeight
    };
  }

  private cartToScreen(cart: Vec2): Vec2 {
    const iso = this.cartToIso(cart);
    return {
      x: iso.x + this.iso.origin.x,
      y: iso.y + this.iso.origin.y
    };
  }

  private isoToCart(iso: Vec2): Vec2 {
    return {
      x: (iso.y / this.iso.halfTileHeight + iso.x / this.iso.halfTileWidth) / 2,
      y: (iso.y / this.iso.halfTileHeight - iso.x / this.iso.halfTileWidth) / 2
    };
  }

  private screenToCart(world: Vec2): Vec2 | undefined {
    const iso = {
      x: world.x - this.iso.origin.x,
      y: world.y - this.iso.origin.y
    };
    const cart = this.isoToCart(iso);
    if (cart.x < 0 || cart.y < 0 || cart.x > this.iso.gridWidth || cart.y > this.iso.gridHeight) {
      return undefined;
    }
    return {
      x: Phaser.Math.Clamp(cart.x, 0, this.iso.gridWidth - 0.0001),
      y: Phaser.Math.Clamp(cart.y, 0, this.iso.gridHeight - 0.0001)
    };
  }

  private updateHeroScreenPosition(): void {
    const screen = this.cartToScreen(this.hero.cart);
    this.hero.setPosition(screen.x, screen.y).setDepth(screen.y + 10);
  }

  private populateProps(): void {
    const decorLayer = this.add.layer();
    const props = [
      { key: 'prop-stone-placeholder', count: 6, depthOffset: 5 },
      { key: 'prop-shrub-placeholder', count: 4, depthOffset: 12 }
    ];

    props.forEach(({ key, count, depthOffset }) => {
      for (let i = 0; i < count; i++) {
        const cart = {
          x: Phaser.Math.FloatBetween(1, this.iso.gridWidth - 1),
          y: Phaser.Math.FloatBetween(1, this.iso.gridHeight - 1)
        };
        const screen = this.cartToScreen(cart);
        decorLayer
          .add(
            this.add
              .image(screen.x, screen.y, key)
              .setOrigin(0.5, 1)
              .setDepth(screen.y + depthOffset)
          );
      }
    });
  }
}
