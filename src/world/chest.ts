import Phaser from 'phaser';

import { EffectFrames, SpriteKeys } from '../assets/sprites';
import { Noise } from '../systems/noise';

export function addChest(scene: Phaser.Scene, x: number, y: number) {
  const chest = scene.add
    .sprite(x, y, SpriteKeys.effects, EffectFrames.chest)
    .setOrigin(0.5, 0.9)
    .setInteractive({ useHandCursor: true });
  const bar = scene.add.rectangle(x, y - 20, 0, 6, 0xf1c40f).setOrigin(0.5, 0.5).setVisible(false);

  let progress = 0;
  let open = false;

  chest.on('pointerdown', () => {
    if (open) return;
    bar.setVisible(true);
    progress = 0;
  });

  scene.input.on('pointerup', () => {
    progress = 0;
    bar.setVisible(false);
  });

  scene.events.on('update', (_: unknown, dt: number) => {
    if (!bar.visible || open) return;

    progress += dt;
    bar.width = Phaser.Math.Clamp((progress / 1500) * 32, 0, 32);

    if (progress >= 1500) {
      open = true;
      bar.setVisible(false);
      chest.setFrame(EffectFrames.chest + 1);
      Noise.emit({ pos: { x, y }, radius: 120, kind: 'chest' });
      scene.events.emit('loot:gold', 15);
    }
  });

  return chest;
}
