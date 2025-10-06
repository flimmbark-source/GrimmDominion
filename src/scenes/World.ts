import Phaser from 'phaser';
import { HUD } from '../ui/HUD';
import type { Vec2, Stats } from '../types';
import { addChest } from '../world/chest';
import { addTavern } from '../world/tavern';
import { Noise, emitFootsteps } from '../systems/noise';
import { DarkLordAI } from '../ai/darkLord';
import { stepDLUnits } from '../ai/search';
import { HeroFrames, SettlementFrames, SpriteKeys } from '../assets/sprites';

type HeroSprite = Phaser.GameObjects.Sprite & {
  stats: Stats;
  target?: Vec2;
  speed: number;
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
  private iso!: IsoConfig;
  private ground!: Phaser.GameObjects.Layer;
  hero!: Phaser.GameObjects.Sprite & { stats: Stats; target?: Vec2; speed: number };
  marker!: Phaser.GameObjects.Rectangle;
  private noiseOff?: () => void;
  private _stepAccumulator = 0;
  private darkLord!: DarkLordAI;
  private heroBaseSpeed = 3.5;

  constructor() {
    super('world');
  }

  async create(): Promise<void> {
    this.iso = {
      tileWidth: 64,
      tileHeight: 32,
      halfTileWidth: 32,
      halfTileHeight: 16,
      gridWidth: 24,
      gridHeight: 18,
      origin: { x: 512, y: 120 }
    };

    this.ground = this.add.layer();
    const groundBounds = this.buildIsometricGround();

    const heroStart = this.cartToScreen({
      x: this.iso.gridWidth / 2,
      y: this.iso.gridHeight / 2
    });

    this.hero = this.add.sprite(
      heroStart.x,
      heroStart.y,
      SpriteKeys.heroes,
      HeroFrames.goblinIdle
    ) as HeroSprite;
    this.hero.setOrigin(0.5, 0.9);
    this.physics.add.existing(this.hero);
    this.hero.speed = this.heroBaseSpeed;
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
    this.cameras.main.setBounds(
      groundBounds.x,
      groundBounds.y,
      groundBounds.width,
      groundBounds.height
    );

    this.input.mouse?.disableContextMenu();

    this.marker = this.add.rectangle(0, 0, 8, 8, 0xffffff).setVisible(false);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.rightButtonDown()) {
        this.hero.target = undefined;
        this.marker.setVisible(false);
        return;
      }

      const targetCart = this.screenToCart({ x: p.worldX, y: p.worldY });
      if (!targetCart) {
        return;
      }

      const target = this.cartToScreen(targetCart);
      this.hero.target = target;
      this.marker.setPosition(target.x, target.y).setDepth(target.y + 1).setVisible(true);
    });

    this.scene.launch('hud', { world: this });

    this.populateProps();

    const castle = this.add
      .image(480, 240, SpriteKeys.settlements, SettlementFrames.castle)
      .setOrigin(0.5, 0.9)
      .setScale(1.1);
    this.darkLord = new DarkLordAI(this, { x: castle.x, y: castle.y });
    this.time.addEvent({ delay: 2000, loop: true, callback: () => this.darkLord.directorTick() });
    this.darkLord.spawn('Scout');
    const { spawnVillage, spawnFauna } = await import('../world/spawners');
    spawnVillage(this, 320, 160);
    spawnFauna(this, 6);

    addChest(this, 320, 140);
    addChest(this, 340, 180);
    addTavern(this, 160, 320, (item) => {
      if (this.hero.stats.gold >= item.cost) {
        this.hero.stats.gold -= item.cost;
        item.apply(this.hero.stats);
        this.hero.speed = this.heroBaseSpeed * (this.hero.stats.speedMult ?? 1);
        (this.game as any).setAlert(`Bought ${item.name}`);
      } else {
        (this.game as any).setAlert('Not enough gold');
      }
    });

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

  private buildIsometricGround(): Phaser.Geom.Rectangle {
    const top = this.cartToScreen({ x: this.iso.gridWidth / 2, y: 0 });
    const right = this.cartToScreen({ x: this.iso.gridWidth, y: this.iso.gridHeight / 2 });
    const bottom = this.cartToScreen({ x: this.iso.gridWidth / 2, y: this.iso.gridHeight });
    const left = this.cartToScreen({ x: 0, y: this.iso.gridHeight / 2 });

    const groundShape = this.add.graphics();
    groundShape.fillStyle(0x1f2a1f, 1);
    groundShape.beginPath();
    groundShape.moveTo(top.x, top.y);
    groundShape.lineTo(right.x, right.y);
    groundShape.lineTo(bottom.x, bottom.y);
    groundShape.lineTo(left.x, left.y);
    groundShape.closePath();
    groundShape.fillPath();

    groundShape.lineStyle(2, 0x203320, 1);
    groundShape.beginPath();
    groundShape.moveTo(top.x, top.y);
    groundShape.lineTo(right.x, right.y);
    groundShape.lineTo(bottom.x, bottom.y);
    groundShape.lineTo(left.x, left.y);
    groundShape.closePath();
    groundShape.strokePath();
    groundShape.setDepth(-200);

    this.ground.add(groundShape);

    const minX = Math.min(top.x, right.x, bottom.x, left.x);
    const maxX = Math.max(top.x, right.x, bottom.x, left.x);
    const minY = Math.min(top.y, right.y, bottom.y, left.y);
    const maxY = Math.max(top.y, right.y, bottom.y, left.y);
    return new Phaser.Geom.Rectangle(minX, minY, maxX - minX, maxY - minY);
  }

  private populateProps(): void {
    const decorLayer = this.add.layer();
    const props = [
      {
        key: SpriteKeys.settlements,
        frame: SettlementFrames.stone,
        count: 6,
        depthOffset: 5
      },
      {
        key: SpriteKeys.settlements,
        frame: SettlementFrames.shrub,
        count: 4,
        depthOffset: 12
      }
    ];

    props.forEach(({ key, frame, count, depthOffset }) => {
      for (let i = 0; i < count; i++) {
        const cart = {
          x: Phaser.Math.FloatBetween(1, this.iso.gridWidth - 1),
          y: Phaser.Math.FloatBetween(1, this.iso.gridHeight - 1)
        };
        const screen = this.cartToScreen(cart);
        decorLayer.add(
          this.add
            .image(screen.x, screen.y, key, frame)
            .setOrigin(0.5, 1)
            .setDepth(screen.y + depthOffset)
        );
      }
    });
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

    if (
      cart.x < 0 ||
      cart.y < 0 ||
      cart.x > this.iso.gridWidth ||
      cart.y > this.iso.gridHeight
    ) {
      return undefined;
    }

    return {
      x: Phaser.Math.Clamp(cart.x, 0, this.iso.gridWidth - 0.0001),
      y: Phaser.Math.Clamp(cart.y, 0, this.iso.gridHeight - 0.0001)
    };
  }
}
