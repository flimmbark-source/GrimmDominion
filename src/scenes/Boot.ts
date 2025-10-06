import Phaser from 'phaser';

export class Boot extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    this.createPlaceholderTextures();
  }

  create(): void {
    this.scene.start('world');
  }

  private createPlaceholderTextures(): void {
    if (this.textures.exists('hero-placeholder')) {
      return;
    }

    const hero = this.make.graphics({ x: 0, y: 0, add: false });
    const heroSize = 48;
    hero.fillStyle(0x3b82f6, 1);
    hero.fillCircle(heroSize / 2, heroSize / 2, 18);
    hero.lineStyle(4, 0xffffff, 0.8);
    hero.strokeCircle(heroSize / 2, heroSize / 2, 18);
    hero.generateTexture('hero-placeholder', heroSize, heroSize);
    hero.destroy();

    const shrub = this.make.graphics({ x: 0, y: 0, add: false });
    const shrubWidth = 64;
    const shrubHeight = 48;
    shrub.fillStyle(0x14532d, 1);
    shrub.fillEllipse(shrubWidth / 2, shrubHeight * 0.75, shrubWidth / 2, shrubHeight / 2);
    shrub.fillStyle(0x22c55e, 1);
    shrub.fillEllipse(shrubWidth / 2, shrubHeight / 2, shrubWidth / 2.5, shrubHeight / 2.5);
    shrub.generateTexture('prop-shrub-placeholder', shrubWidth, shrubHeight);
    shrub.destroy();

    const stone = this.make.graphics({ x: 0, y: 0, add: false });
    const stoneSize = 32;
    stone.fillStyle(0x6b7280, 1);
    stone.fillRoundedRect(0, stoneSize / 2, stoneSize, stoneSize / 2, 6);
    stone.lineStyle(2, 0x94a3b8, 0.8);
    stone.strokeRoundedRect(2, stoneSize / 2 + 2, stoneSize - 4, stoneSize / 2 - 4, 6);
    stone.generateTexture('prop-stone-placeholder', stoneSize, stoneSize);
    stone.destroy();
  }
}
