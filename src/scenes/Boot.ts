import Phaser from 'phaser';

export class Boot extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    this.load.spritesheet('tiles', '/tiles.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.tilemapTiledJSON('map', '/tilemap.json');
  }

  create(): void {
    this.scene.start('world');
  }
}
