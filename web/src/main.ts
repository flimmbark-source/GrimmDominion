import { AUTO, Game, Scale, type Types } from "phaser";

import { BootScene } from "./scenes/BootScene";
import { MapScene } from "./scenes/MapScene";

const config: Types.Core.GameConfig = {
  type: AUTO,
  parent: "game",
  backgroundColor: "#120b22",
  scale: {
    mode: Scale.FIT,
    autoCenter: Scale.CENTER_BOTH,
    width: 1280,
    height: 720
  },
  scene: [BootScene, MapScene]
};

// eslint-disable-next-line no-new
new Game(config);
