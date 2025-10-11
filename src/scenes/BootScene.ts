import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Preload assets if necessary
  }

  create() {
    // Start the main game scene
    this.scene.start('GameScene');
  }
}
