import Phaser from "phaser";

import { isoTileCenter, isoToScreen, screenToIso, TileSize } from "../iso/coordinates";

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

type TileType =
  | "void"
  | "cliff"
  | "plateau"
  | "castle"
  | "gate"
  | "road"
  | "village"
  | "forest"
  | "shrine"
  | "camp";

interface MapFeature {
  type: string;
  label: string;
  description: string;
  tile: {
    x: number;
    y: number;
  };
}

interface HeroSquadDefinition {
  id: string;
  label: string;
  tile: {
    x: number;
    y: number;
  };
  color: string;
  speed: number;
}

interface MapConfig {
  name: string;
  tileSize: TileSize;
  width: number;
  height: number;
  tiles: TileType[][];
  features: MapFeature[];
  heroSquads: HeroSquadDefinition[];
}

interface TilePaletteEntry {
  fill: number;
  stroke: number;
  walkable: boolean;
}

interface HeroRuntime {
  id: string;
  label: string;
  color: number;
  isoPosition: Phaser.Math.Vector2;
  targetIso: Phaser.Math.Vector2 | null;
  speed: number;
  container: Phaser.GameObjects.Container;
  selectionRing: Phaser.GameObjects.Arc;
}

const TILE_PALETTE: Record<TileType, TilePaletteEntry> = {
  void: { fill: 0x08070f, stroke: 0x08070f, walkable: false },
  cliff: { fill: 0x2b243b, stroke: 0x1a1426, walkable: false },
  plateau: { fill: 0x43375c, stroke: 0x2d2141, walkable: true },
  castle: { fill: 0x2f223a, stroke: 0x1e1827, walkable: false },
  gate: { fill: 0x7a513d, stroke: 0x4c2f24, walkable: true },
  road: { fill: 0x90734a, stroke: 0x4f3d24, walkable: true },
  village: { fill: 0xa56b4f, stroke: 0x553722, walkable: true },
  forest: { fill: 0x255036, stroke: 0x142c1d, walkable: true },
  shrine: { fill: 0x4f3c94, stroke: 0x352861, walkable: true },
  camp: { fill: 0x805534, stroke: 0x4c311a, walkable: true }
};

const FEATURE_COLORS: Record<string, number> = {
  "castle-gate": 0xd97757,
  "haunted-village": 0xf2a65a,
  "ancient-shrine": 0x8b6cff,
  "shadowed-forest": 0x5cc08a,
  "tavern-camp": 0xf4d35e
};

export const MapSceneKey = "map";

export class MapScene extends Phaser.Scene {
  private quests: QuestDefinition[] = [];

  private worldConfig: WorldConfig | null = null;

  private mapConfig!: MapConfig;

  private tileSize!: TileSize;

  private mapOrigin!: Phaser.Math.Vector2;

  private diamondPoints: number[] = [];

  private walkableTiles = new Set<string>();

  private heroUnits: HeroRuntime[] = [];

  private selectedHeroes = new Set<HeroRuntime>();

  private tileHighlight!: Phaser.GameObjects.Polygon;

  private commandMarker!: Phaser.GameObjects.Polygon;

  private commandTween?: Phaser.Tweens.Tween;

  constructor() {
    super(MapSceneKey);
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0c0818");
    this.input.mouse?.disableContextMenu();

    this.mapConfig = this.cache.json.get("battlefield-config") as MapConfig;
    if (!this.mapConfig) {
      throw new Error("Missing battlefield configuration");
    }

    this.tileSize = this.mapConfig.tileSize;
    this.mapOrigin = new Phaser.Math.Vector2(this.scale.width / 2, 160);
    this.diamondPoints = [
      0,
      -this.tileSize.height / 2,
      this.tileSize.width / 2,
      0,
      0,
      this.tileSize.height / 2,
      -this.tileSize.width / 2,
      0
    ];

    this.worldConfig = this.cache.json.get("world-config") as WorldConfig;
    this.quests = this.cache.json.get("quest-deck") as QuestDefinition[];

    this.renderGround();
    this.renderFeatures();
    this.createHeroUnits();
    this.createTileHighlight();
    this.createCommandMarker();
    this.createUiOverlay();
    this.registerInputHandlers();
  }

  update(_time: number, delta: number): void {
    const deltaSeconds = delta / 1000;
    this.heroUnits.forEach((hero) => {
      this.updateHero(hero, deltaSeconds);
    });
  }

  private renderGround(): void {
    for (let y = 0; y < this.mapConfig.height; y += 1) {
      for (let x = 0; x < this.mapConfig.width; x += 1) {
        const tileType = this.mapConfig.tiles[y][x];
        const palette = TILE_PALETTE[tileType];
        if (!palette) {
          continue;
        }

        const screenPoint = this.projectIso({ x, y });
        const polygon = this.add.polygon(
          screenPoint.x,
          screenPoint.y,
          this.diamondPoints,
          palette.fill,
          1
        );
        polygon.setStrokeStyle(1, palette.stroke, 0.6);
        polygon.setDepth(screenPoint.y);

        if (palette.walkable) {
          this.walkableTiles.add(this.getTileKey(x, y));
        }
      }
    }
  }

  private renderFeatures(): void {
    this.mapConfig.features.forEach((feature) => {
      const color = FEATURE_COLORS[feature.type] ?? 0xffffff;
      const isoCenter = isoTileCenter(feature.tile.x, feature.tile.y);
      const screenPoint = this.projectIso(isoCenter);

      const marker = this.add.polygon(
        screenPoint.x,
        screenPoint.y,
        this.diamondPoints,
        color,
        0.25
      );
      marker.setStrokeStyle(2, color, 0.9);
      marker.setDepth(screenPoint.y + 2);

      const label = this.add.text(screenPoint.x, screenPoint.y - 48, feature.label, {
        fontFamily: "serif",
        fontSize: "20px",
        color: "#f7f3ff",
        stroke: "#150b2c",
        strokeThickness: 3
      });
      label.setOrigin(0.5, 1);
      label.setDepth(screenPoint.y + 10);

      const description = this.add.text(
        screenPoint.x,
        screenPoint.y - 24,
        feature.description,
        {
          fontFamily: "monospace",
          fontSize: "14px",
          color: "#dcd6ff",
          wordWrap: { width: 220 }
        }
      );
      description.setOrigin(0.5, 0);
      description.setDepth(screenPoint.y + 10);
    });
  }

  private createHeroUnits(): void {
    this.heroUnits = this.mapConfig.heroSquads.map((definition) => {
      const isoPosition = new Phaser.Math.Vector2(
        definition.tile.x + 0.5,
        definition.tile.y + 0.5
      );
      const heroColor = Phaser.Display.Color.HexStringToColor(definition.color).color;

      const container = this.add.container(0, 0);
      const body = this.add.circle(0, 0, 18, heroColor, 1);
      body.setStrokeStyle(2, 0x08070f, 0.8);

      const ring = this.add.circle(0, 0, 24, 0xffffff, 0);
      ring.setStrokeStyle(3, 0xffffff, 0);

      const label = this.add.text(0, -30, definition.label, {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#f9f5ff",
        align: "center"
      });
      label.setOrigin(0.5, 1);

      container.add([body, ring, label]);
      container.setSize(48, 48);
      container.setDepth(0);
      container.setData("heroId", definition.id);
      container.setInteractive({
        hitArea: new Phaser.Geom.Circle(0, 0, 26),
        hitAreaCallback: Phaser.Geom.Circle.Contains,
        useHandCursor: true
      });

      const heroRuntime: HeroRuntime = {
        id: definition.id,
        label: definition.label,
        color: heroColor,
        isoPosition,
        targetIso: null,
        speed: definition.speed,
        container,
        selectionRing: ring
      };

      this.syncHeroPosition(heroRuntime);
      return heroRuntime;
    });
  }

  private createTileHighlight(): void {
    this.tileHighlight = this.add.polygon(0, 0, this.diamondPoints, 0xffffff, 0.18);
    this.tileHighlight.setStrokeStyle(2, 0xffffff, 0.8);
    this.tileHighlight.setDepth(10000);
    this.tileHighlight.setVisible(false);
  }

  private createCommandMarker(): void {
    this.commandMarker = this.add.polygon(0, 0, this.diamondPoints, 0xffd166, 0.25);
    this.commandMarker.setStrokeStyle(2, 0xffd166, 1);
    this.commandMarker.setDepth(10001);
    this.commandMarker.setVisible(false);
  }

  private createUiOverlay(): void {
    this.add.text(32, 28, this.mapConfig.name, {
      fontFamily: "serif",
      fontSize: "32px",
      color: "#f5e9d7"
    });

    if (this.worldConfig) {
      const regionSummary = this.worldConfig.regions
        .map((region) => `${region.label} — Threat ${region.threat}`)
        .join("\n");
      const panel = this.add.rectangle(32, 86, 320, 140, 0x0f0a1d, 0.65);
      panel.setOrigin(0, 0);
      panel.setStrokeStyle(1, 0x473a6b, 0.7);
      panel.setDepth(20000);

      const regionText = this.add.text(48, 100, regionSummary, {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#d3c9ff",
        lineSpacing: 8
      });
      regionText.setDepth(20001);
    }

    const controlsPanel = this.add.rectangle(
      32,
      this.scale.height - 170,
      360,
      140,
      0x0f0a1d,
      0.65
    );
    controlsPanel.setOrigin(0, 0);
    controlsPanel.setStrokeStyle(1, 0x473a6b, 0.7);
    controlsPanel.setDepth(20000);

      const controlsCopy = [
        "Controls:",
        "• Left click: select squad",
        "• Shift+Click: multi-select",
        "• Right click: move order"
      ].join("\n");
      const controlsText = this.add.text(
        48,
        this.scale.height - 154,
        controlsCopy,
        {
          fontFamily: "monospace",
          fontSize: "16px",
          color: "#f8f3ff",
          lineSpacing: 10
        }
      );
    controlsText.setDepth(20001);

    if (this.quests?.length) {
      const questSummary = this.quests
        .map((quest) => `• ${quest.title} (+${quest.reward} dread)\n  ${quest.description}`)
        .join("\n\n");

      const questPanel = this.add.rectangle(
        this.scale.width - 380,
        80,
        340,
        360,
        0x0f0a1d,
        0.65
      );
      questPanel.setOrigin(0, 0);
      questPanel.setStrokeStyle(1, 0x473a6b, 0.7);
      questPanel.setDepth(20000);

      const questText = this.add.text(
        this.scale.width - 360,
        96,
        `Quest Deck\n${questSummary}`,
        {
          fontFamily: "monospace",
          fontSize: "16px",
          color: "#f6d6ff",
          lineSpacing: 8,
          wordWrap: { width: 300 }
        }
      );
      questText.setDepth(20001);
    }
  }

  private registerInputHandlers(): void {
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.button !== 0) {
        return;
      }

      const shiftKey = pointer.event instanceof MouseEvent && pointer.event.shiftKey;
      const hero = this.findHeroUnderPointer(pointer);

      if (hero) {
        if (shiftKey && this.selectedHeroes.has(hero)) {
          this.selectedHeroes.delete(hero);
          this.updateSelectionVisuals();
          return;
        }

        if (!shiftKey && !this.selectedHeroes.has(hero)) {
          this.clearSelection();
        }

        this.selectHero(hero);
        return;
      }

      if (!shiftKey) {
        this.clearSelection();
      }
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      const picked = this.pickTileFromPointer(pointer);
      if (!picked) {
        this.tileHighlight.setVisible(false);
        return;
      }

      const tileKey = this.getTileKey(picked.tileX, picked.tileY);
      const isoCenter = isoTileCenter(picked.tileX, picked.tileY);
      const screenPoint = this.projectIso(isoCenter);
      this.tileHighlight.setPosition(screenPoint.x, screenPoint.y);
      this.tileHighlight.setVisible(true);

      if (this.walkableTiles.has(tileKey)) {
        this.tileHighlight.setFillStyle(0xffffff, 0.15);
        this.tileHighlight.setStrokeStyle(2, 0xffffff, 0.9);
      } else {
        this.tileHighlight.setFillStyle(0xff6b6b, 0.12);
        this.tileHighlight.setStrokeStyle(2, 0xff6b6b, 0.9);
      }
    });

    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (pointer.button !== 2) {
        return;
      }
      if (this.selectedHeroes.size === 0) {
        return;
      }

      const picked = this.pickTileFromPointer(pointer);
      if (!picked) {
        return;
      }

      if (!this.walkableTiles.has(this.getTileKey(picked.tileX, picked.tileY))) {
        this.showCommandMarker(isoTileCenter(picked.tileX, picked.tileY), true);
        return;
      }

      this.issueMoveOrders(picked.tileX, picked.tileY);
    });
  }

  private findHeroUnderPointer(pointer: Phaser.Input.Pointer): HeroRuntime | null {
    return (
      this.heroUnits.find((hero) => {
        const dx = pointer.worldX - hero.container.x;
        const dy = pointer.worldY - hero.container.y;
        return Math.sqrt(dx * dx + dy * dy) <= 26;
      }) ?? null
    );
  }

  private issueMoveOrders(tileX: number, tileY: number): void {
    const selected = Array.from(this.selectedHeroes);
    if (selected.length === 0) {
      return;
    }

    const formationOffsets = this.computeFormationOffsets(selected.length);
    const tileCenter = isoTileCenter(tileX, tileY);
    selected.forEach((hero, index) => {
      const offset = formationOffsets[index];
      hero.targetIso = new Phaser.Math.Vector2(
        tileCenter.x + offset.x,
        tileCenter.y + offset.y
      );
    });

    this.showCommandMarker(tileCenter);
  }

  private computeFormationOffsets(count: number): Phaser.Math.Vector2[] {
    if (count === 1) {
      return [new Phaser.Math.Vector2(0, 0)];
    }

    const offsets: Phaser.Math.Vector2[] = [];
    const radius = 0.35 + count * 0.04;
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2;
      offsets.push(
        new Phaser.Math.Vector2(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius * 0.6
        )
      );
    }
    return offsets;
  }

  private showCommandMarker(targetIso: { x: number; y: number }, isError = false): void {
    const screenPoint = this.projectIso(targetIso);
    this.commandMarker.setPosition(screenPoint.x, screenPoint.y);
    this.commandMarker.setVisible(true);
    this.commandMarker.setFillStyle(isError ? 0xff6b6b : 0xffd166, 0.3);
    this.commandMarker.setStrokeStyle(2, isError ? 0xff6b6b : 0xffd166, 1);

    this.commandTween?.remove();
    this.commandMarker.setAlpha(1);
    this.commandTween = this.tweens.add({
      targets: this.commandMarker,
      alpha: 0,
      duration: 600,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.commandMarker.setVisible(false);
      }
    });
  }

  private selectHero(hero: HeroRuntime): void {
    this.selectedHeroes.add(hero);
    this.updateSelectionVisuals();
  }

  private clearSelection(): void {
    this.selectedHeroes.clear();
    this.updateSelectionVisuals();
  }

  private updateSelectionVisuals(): void {
    this.heroUnits.forEach((hero) => {
      const isSelected = this.selectedHeroes.has(hero);
      hero.selectionRing.setVisible(isSelected);
      hero.selectionRing.setStrokeStyle(3, 0xffffff, isSelected ? 1 : 0);
      hero.container.list.forEach((child) => {
        child.setDepth?.(isSelected ? 2 : 0);
      });
    });
  }

  private updateHero(hero: HeroRuntime, deltaSeconds: number): void {
    if (!hero.targetIso) {
      return;
    }

    const toTarget = hero.targetIso.clone().subtract(hero.isoPosition);
    const distance = toTarget.length();
    if (distance < 0.01) {
      hero.isoPosition.copy(hero.targetIso);
      hero.targetIso = null;
      this.syncHeroPosition(hero);
      return;
    }

    const step = Math.min(hero.speed * deltaSeconds, distance);
    hero.isoPosition.add(toTarget.normalize().scale(step));
    this.syncHeroPosition(hero);
  }

  private syncHeroPosition(hero: HeroRuntime): void {
    const screenPoint = this.projectIso(hero.isoPosition);
    hero.container.setPosition(screenPoint.x, screenPoint.y - 10);
    hero.container.setDepth(screenPoint.y + 20);
  }

  private projectIso(point: { x: number; y: number }): Phaser.Math.Vector2 {
    const projected = isoToScreen(point, this.tileSize);
    return new Phaser.Math.Vector2(
      this.mapOrigin.x + projected.x,
      this.mapOrigin.y + projected.y
    );
  }

  private pickTileFromPointer(pointer: Phaser.Input.Pointer):
    | { tileX: number; tileY: number; iso: Phaser.Math.Vector2 }
    | null {
    const iso = screenToIso(
      {
        x: pointer.worldX - this.mapOrigin.x,
        y: pointer.worldY - this.mapOrigin.y
      },
      this.tileSize
    );

    const tileX = Math.floor(iso.x);
    const tileY = Math.floor(iso.y);
    if (!this.isWithinBounds(tileX, tileY)) {
      return null;
    }

    return {
      tileX,
      tileY,
      iso: new Phaser.Math.Vector2(iso.x, iso.y)
    };
  }

  private isWithinBounds(tileX: number, tileY: number): boolean {
    return (
      tileX >= 0 &&
      tileX < this.mapConfig.width &&
      tileY >= 0 &&
      tileY < this.mapConfig.height
    );
  }

  private getTileKey(x: number, y: number): string {
    return `${x},${y}`;
  }
}
