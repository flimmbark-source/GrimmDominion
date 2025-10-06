import Phaser from 'phaser';
import { Boot } from './scenes/Boot';
import { World } from './scenes/World';
import { HUD } from './ui/HUD';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: 960,
  height: 540,
  backgroundColor: '#0f0f13',
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: [Boot, World, HUD]
});
