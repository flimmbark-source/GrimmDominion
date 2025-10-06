import Phaser from 'phaser';

export class Boot extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    this.load.image('tiles', '/tiles.png');
    this.load.tilemapTiledJSON('map', '/tilemap.json');
  }

  create(): void {
    this.scene.start('world');
  }
}
