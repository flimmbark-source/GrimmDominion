import Phaser from "phaser";

import { BootScene } from "./scenes/BootScene";
import { MapScene } from "./scenes/MapScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#120b22",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720
  },
  scene: [BootScene, MapScene]
};

// eslint-disable-next-line no-new
new Phaser.Game(config);
