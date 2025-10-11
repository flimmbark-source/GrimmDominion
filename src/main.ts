import Phaser from 'phaser';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { Boot } from './scenes/Boot';
import { World } from './scenes/World';
import { HUD } from './ui/HUD';
import World3D from './three/World3D';

const appElement = document.getElementById('app');

if (!appElement) {
  throw new Error('App root element not found.');
}

const wrapper = document.createElement('div');
wrapper.style.position = 'relative';
wrapper.style.width = '100%';
wrapper.style.height = '100%';
wrapper.style.overflow = 'hidden';

const phaserContainer = document.createElement('div');
phaserContainer.id = 'phaser-root';
phaserContainer.style.position = 'absolute';
phaserContainer.style.inset = '0';
phaserContainer.style.width = '100%';
phaserContainer.style.height = '100%';
phaserContainer.style.zIndex = '0';

const world3dContainer = document.createElement('div');
world3dContainer.id = 'world3d-root';
world3dContainer.style.position = 'absolute';
world3dContainer.style.inset = '0';
world3dContainer.style.width = '100%';
world3dContainer.style.height = '100%';
world3dContainer.style.zIndex = '1';

wrapper.appendChild(phaserContainer);
wrapper.appendChild(world3dContainer);
appElement.replaceChildren(wrapper);

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: phaserContainer,
  backgroundColor: '#0f0f13',
  width: window.innerWidth,
  height: window.innerHeight,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [Boot, World, HUD],
};

const game = new Phaser.Game(config);

const root = createRoot(world3dContainer);
root.render(createElement(World3D));

window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});

(window as any).game = game;
