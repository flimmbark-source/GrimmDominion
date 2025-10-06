import Phaser from 'phaser';
import type { World } from '../scenes/World';
import { SpriteKeys, SettlementFrames, VillagerFrames } from '../assets/sprites';

export function spawnVillage(w: World, x: number, y: number) {
  w.add
    .image(x, y, SpriteKeys.settlements, SettlementFrames.house)
    .setOrigin(0.5, 0.9)
    .setScale(1.05);
  for (let i = 0; i < 3; i++) {
    const vx = x + Math.random() * 40 - 20;
    const vy = y + Math.random() * 40 - 20;
    const villagerFrame = Phaser.Utils.Array.GetRandom(VillagerFrames);
    const vill = w.add
      .sprite(vx, vy, SpriteKeys.heroes, villagerFrame)
      .setOrigin(0.5, 0.9)
      .setDepth(vy + 2);
    w.tweens.add({
      targets: vill,
      x: vx + 20 * Math.sin(Math.random() * 6),
      y: vy + 20 * Math.cos(Math.random() * 6),
      duration: 4000,
      yoyo: true,
      repeat: -1
    });
  }
}

export function spawnFauna(w: World, n = 6) {
  for (let i = 0; i < n; i++) {
    const fx = 100 + Math.random() * 400;
    const fy = 100 + Math.random() * 400;
    const crit = w.add
      .sprite(fx, fy, SpriteKeys.settlements, SettlementFrames.forest)
      .setOrigin(0.5, 0.9)
      .setDepth(fy + 1)
      .setAlpha(0.8);
    w.tweens.add({
      targets: crit,
      x: fx + 30 * Math.sin(Math.random() * 6),
      y: fy + 30 * Math.cos(Math.random() * 6),
      duration: 6000,
      yoyo: true,
      repeat: -1
    });
  }
}
