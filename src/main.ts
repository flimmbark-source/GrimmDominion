import Phaser from 'phaser';
import { Boot } from './scenes/Boot';
import { World } from './scenes/World';
import { HUD } from './ui/HUD';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#0f0f13',
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight
  },
  scene: [Boot, World, HUD]
});

window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});

(window as any).game = game;
