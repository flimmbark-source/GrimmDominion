import { Scene } from "phaser";

import { MapSceneKey } from "./MapScene";

export const BootSceneKey = "boot";

export class BootScene extends Scene {
  constructor() {
    super(BootSceneKey);
  }

  preload(): void {
    this.load.setPath("/content");
    this.load.json("world-config", "world.json");
    this.load.json("quest-deck", "quests.json");
    this.load.json("battlefield-config", "map.json");
  }

  create(): void {
    this.scene.start(MapSceneKey);
  }
}
