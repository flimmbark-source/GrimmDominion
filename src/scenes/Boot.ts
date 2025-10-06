import Phaser from 'phaser';
import { SpriteKeys } from '../assets/sprites';

export class Boot extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    this.load.setPath('assets');
    this.load.spritesheet(SpriteKeys.heroes, 'Heros.png', {
      frameWidth: 128,
      frameHeight: 128
    });
    this.load.spritesheet(SpriteKeys.enemies, 'characters.png', {
      frameWidth: 128,
      frameHeight: 128
    });
    this.load.spritesheet(SpriteKeys.settlements, 'Villages_flora_fauna.png', {
      frameWidth: 128,
      frameHeight: 128
    });
    this.load.spritesheet(SpriteKeys.effects, 'effects_items.png', {
      frameWidth: 128,
      frameHeight: 128
    });
    this.load.setPath('');
  }

  create(): void {
    this.scene.start('world');
  }

}
