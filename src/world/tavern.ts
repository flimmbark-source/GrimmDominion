import Phaser from 'phaser';
import type { Stats } from '../types';

/** Tavern inventory item description. */
export type TavernItem = {
  name: string;
  cost: number;
  apply: (state: Stats) => void;
};

const STOCK: TavernItem[] = [
  {
    name: 'Shadow Cloak +20 Stealth',
    cost: 30,
    apply: (state) => {
      state.stealthMax += 20;
    }
  },
  {
    name: 'Dagger +1 ATK',
    cost: 20,
    apply: (state) => {
      state.atk = (state.atk || 1) + 1;
    }
  },
  {
    name: 'Boots +10% Speed',
    cost: 25,
    apply: (state) => {
      state.speedMult = (state.speedMult || 1) * 1.1;
    }
  }
];

/**
 * Adds a goblin tavern to the world that toggles a small shop interface when clicked.
 *
 * @param scene - The Phaser scene to add the tavern to.
 * @param x - Horizontal position of the tavern sprite.
 * @param y - Vertical position of the tavern sprite.
 * @param onBuy - Callback invoked when an item is selected for purchase.
 */
export function addTavern(
  scene: Phaser.Scene,
  x: number,
  y: number,
  onBuy: (item: TavernItem) => void
): Phaser.GameObjects.Sprite {
  const tavernSprite = scene.add
    .sprite(x, y, 'tiles')
    .setFrame(10)
    .setScale(1.2)
    .setDepth(y + 10);
  const panel = scene.add
    .rectangle(x, y - 60, 220, 90, 0x000000, 0.7)
    .setStrokeStyle(1, 0x666666)
    .setVisible(false)
    .setDepth(y + 20);

  const lines = STOCK.map((item, idx) =>
    scene.add
      .text(x - 100, y - 80 + idx * 18, `${item.name} — ${item.cost}g`, {
        fontSize: '12px'
      })
      .setVisible(false)
      .setDepth(y + 21 + idx)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => onBuy(item))
  );

  tavernSprite
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => {
      const visible = !panel.visible;
      panel.setVisible(visible);
      lines.forEach((line) => line.setVisible(visible));
    });

  return tavernSprite;
}
