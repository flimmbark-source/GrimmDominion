import Phaser from "phaser";

interface QuestDefinition {
  id: string;
  title: string;
  description: string;
  reward: number;
}

interface WorldConfig {
  name: string;
  regions: Array<{
    id: string;
    label: string;
    threat: number;
  }>;
}

export const MapSceneKey = "map";

export class MapScene extends Phaser.Scene {
  private quests: QuestDefinition[] = [];
  private worldConfig: WorldConfig | null = null;

  constructor() {
    super(MapSceneKey);
  }

  create(): void {
    this.worldConfig = this.cache.json.get("world-config") as WorldConfig;
    this.quests = this.cache.json.get("quest-deck") as QuestDefinition[];

    this.add.text(32, 32, "Grimm Dominion Prototype", {
      fontFamily: "serif",
      fontSize: "36px",
      color: "#f8e9d3"
    });

    const regionText = this.worldConfig.regions
      .map((region) => `${region.label} — threat ${region.threat}`)
      .join("\n");
    this.add.text(32, 96, `Regions:\n${regionText}`, {
      fontFamily: "monospace",
      fontSize: "20px",
      color: "#b1a7f6",
      lineSpacing: 12
    });

    const questLines = this.quests
      .map((quest) => `• ${quest.title} (+${quest.reward} dread)\n  ${quest.description}`)
      .join("\n\n");
    this.add.text(640, 96, `Quest Deck\n${questLines}`, {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#f6d6ff",
      wordWrap: { width: 520 },
      lineSpacing: 10
    });
  }
}
