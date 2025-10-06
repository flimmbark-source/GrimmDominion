import Phaser from "phaser";

import { MapSceneKey } from "./MapScene";

export const BootSceneKey = "boot";

export class BootScene extends Phaser.Scene {
  constructor() {
    super(BootSceneKey);
  }

  preload(): void {
    this.load.setPath("/content");
    this.load.json("world-config", "world.json");
    this.load.json("quest-deck", "quests.json");
  }

  create(): void {
    this.scene.start(MapSceneKey);
  }
}
