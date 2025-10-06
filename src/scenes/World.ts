import Phaser from 'phaser';
import { HUD } from '../ui/HUD';
import type { Vec2, Stats } from '../types';

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
  hero!: HeroSprite;
  marker!: Phaser.GameObjects.Polygon;
  ground!: Phaser.GameObjects.Layer;
  iso!: IsoConfig;

  constructor() {
    super('world');
  }

  create(): void {
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

    this.hero = this.add.sprite(0, 0, 'tiles', 1) as HeroSprite;
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

    this.updateHeroScreenPosition();

    const worldWidth = (this.iso.gridWidth + this.iso.gridHeight) * this.iso.halfTileWidth;
    const worldHeight = (this.iso.gridWidth + this.iso.gridHeight) * this.iso.halfTileHeight;

    this.cameras.main.setBounds(0, 0, worldWidth + this.iso.origin.x, worldHeight + this.iso.origin.y + 200);
    this.cameras.main.startFollow(this.hero, true, 0.15, 0.15);
    this.cameras.main.setZoom(1.3);

    this.input.mouse?.disableContextMenu();

    this.marker = this.add
      .polygon(0, 0, this.createDiamondShape(12, 6), 0xffffff, 0.5)
      .setStrokeStyle(1, 0x9bd4ff)
      .setVisible(false);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.rightButtonDown()) {
        this.hero.target = undefined;
        this.marker.setVisible(false);
        return;
      }

      const cart = this.screenToCart({ x: p.worldX, y: p.worldY });
      if (!cart) {
        return;
      }

      this.hero.target = cart;
      const markerPos = this.cartToScreen(cart);
      this.marker
        .setPosition(markerPos.x, markerPos.y)
        .setDepth(markerPos.y + 1)
        .setVisible(true);
    });

    this.scene.launch('hud', { world: this });

    this.populateProps();
  }

  update(_time: number, dt: number): void {
    const hero = this.hero;

    if (hero.target) {
      const dx = hero.target.x - hero.cart.x;
      const dy = hero.target.y - hero.cart.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.02) {
        hero.cart = { ...hero.target };
        hero.target = undefined;
        this.marker.setVisible(false);
      } else {
        const step = hero.speed * (dt / 1000);
        const move = Math.min(step, dist);
        hero.cart.x += (dx / dist) * move;
        hero.cart.y += (dy / dist) * move;
      }
    }

    this.updateHeroScreenPosition();
  }

  private buildIsometricGround(): void {
    const { gridWidth, gridHeight, tileWidth, tileHeight } = this.iso;
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const tileCenter = this.cartToScreen({ x: x + 0.5, y: y + 0.5 });
        const tile = this.add
          .polygon(tileCenter.x, tileCenter.y, this.createDiamondShape(tileWidth, tileHeight / 2), 0x27422d, 0.95)
          .setStrokeStyle(1, 0x1b2b1f, 0.4)
          .setDepth(tileCenter.y);
        this.ground.add(tile);
      }
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
      { frame: 2, count: 8, scale: 1, alpha: 0.9 },
      { frame: 3, count: 3, scale: 1.4, alpha: 1 }
    ];

    props.forEach(({ frame, count, scale, alpha }) => {
      for (let i = 0; i < count; i++) {
        const cart = {
          x: Phaser.Math.FloatBetween(1, this.iso.gridWidth - 1),
          y: Phaser.Math.FloatBetween(1, this.iso.gridHeight - 1)
        };
        const screen = this.cartToScreen(cart);
        decorLayer
          .add(
            this.add
              .image(screen.x, screen.y, 'tiles')
              .setFrame(frame)
              .setOrigin(0.5, 1)
              .setScale(scale)
              .setAlpha(alpha)
              .setDepth(screen.y + 5)
          );
      }
    });
  }
}
