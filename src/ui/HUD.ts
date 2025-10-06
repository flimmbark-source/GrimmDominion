import Phaser from 'phaser';
import { EffectFrames, SpriteKeys } from '../assets/sprites';
import type { World } from '../scenes/World';

export class HUD extends Phaser.Scene {
  world!: World;
  hpBar!: Phaser.GameObjects.Rectangle;
  manaBar!: Phaser.GameObjects.Rectangle;
  stealthBar!: Phaser.GameObjects.Rectangle;
  alert!: Phaser.GameObjects.Text;
  statsText!: Phaser.GameObjects.Text;
  inventorySlots: Phaser.GameObjects.Sprite[] = [];
  private uiRoot?: Phaser.GameObjects.Container;
  private resizeHandler = (gameSize: Phaser.Structs.Size) => {
    this.layoutUI(gameSize);
  };
  private barFillWidth = 0;

  private static readonly BAR_WIDTH = 120;
  private static readonly BAR_HEIGHT = 10;
  private static readonly BAR_LERP = 0.2;
  private static readonly BAR_SCALE = 1.6;
  private static readonly BAR_INSET = 6;

  constructor() {
    super('hud');
  }

  init(data: { world: World }): void {
    this.world = data.world;
  }

  create(): void {
    this.layoutUI(this.scale.gameSize);
    this.scale.on('resize', this.resizeHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.resizeHandler);
    });
    this.cameras.main.setScroll(0, 0);
  }

  private layoutUI(gameSize: Phaser.Structs.Size): void {
    const width = gameSize.width;
    const height = gameSize.height;
    this.uiRoot?.destroy(true);
    const root = this.add.container(0, 0);
    this.uiRoot = root;

    const addRect = (...args: Parameters<Phaser.GameObjects.GameObjectFactory['rectangle']>) => {
      const rect = this.add.rectangle(...args);
      root.add(rect);
      return rect;
    };
    const addSprite = (...args: Parameters<Phaser.GameObjects.GameObjectFactory['sprite']>) => {
      const sprite = this.add.sprite(...args);
      root.add(sprite);
      return sprite;
    };
    const addText = (...args: Parameters<Phaser.GameObjects.GameObjectFactory['text']>) => {
      const text = this.add.text(...args);
      root.add(text);
      return text;
    };

    const panelHeight = 160;
    const panelTop = height - panelHeight;
    const panelCenterY = panelTop + panelHeight / 2;
    const panelPadding = 24;

    const abilityKeys = ['Q', 'W', 'E', 'R'];
    let abilitySlotSize = Phaser.Math.Clamp(width / 9, 64, 140);
    let abilityGap = Phaser.Math.Clamp(abilitySlotSize * 0.18, 12, 32);
    let totalAbilityWidth = abilityKeys.length * abilitySlotSize + (abilityKeys.length - 1) * abilityGap;
    const availableTrayWidth = Math.max(width - panelPadding * 2, 0);
    if (totalAbilityWidth > availableTrayWidth && availableTrayWidth > 0) {
      abilitySlotSize = Phaser.Math.Clamp(
        (availableTrayWidth - abilityGap * (abilityKeys.length - 1)) / abilityKeys.length,
        32,
        abilitySlotSize
      );
      totalAbilityWidth = abilityKeys.length * abilitySlotSize + (abilityKeys.length - 1) * abilityGap;
      if (totalAbilityWidth > availableTrayWidth) {
        abilityGap = Phaser.Math.Clamp(
          (availableTrayWidth - abilitySlotSize * abilityKeys.length) / (abilityKeys.length - 1),
          4,
          abilityGap
        );
        totalAbilityWidth = abilityKeys.length * abilitySlotSize + (abilityKeys.length - 1) * abilityGap;
      }
    }
    abilitySlotSize = Math.min(abilitySlotSize, panelHeight - panelPadding - 12);
    totalAbilityWidth = abilityKeys.length * abilitySlotSize + (abilityKeys.length - 1) * abilityGap;
    let abilityStartX = width / 2 - totalAbilityWidth / 2 + abilitySlotSize / 2;
    let abilityLeftEdge = abilityStartX - abilitySlotSize / 2;
    let abilityRightEdge = abilityLeftEdge + totalAbilityWidth;
    if (abilityLeftEdge < panelPadding) {
      abilityLeftEdge = panelPadding;
      abilityRightEdge = abilityLeftEdge + totalAbilityWidth;
      abilityStartX = abilityLeftEdge + abilitySlotSize / 2;
    }
    if (abilityRightEdge > width - panelPadding) {
      abilityRightEdge = width - panelPadding;
      abilityLeftEdge = abilityRightEdge - totalAbilityWidth;
      abilityStartX = abilityLeftEdge + abilitySlotSize / 2;
    }

    addRect(width / 2, panelCenterY, width, panelHeight, 0x060a12)
      .setStrokeStyle(2, 0x1c2738)
      .setAlpha(0.92);

    const heroPanelX = panelPadding + 60;
    const heroPanelY = height - 92;
    addRect(heroPanelX, heroPanelY, 140, 128, 0x0b1724).setStrokeStyle(2, 0x2c425b).setAlpha(0.95);

    const portrait = addSprite(heroPanelX, heroPanelY - 6, SpriteKeys.effects, EffectFrames.chest)
      .setDisplaySize(96, 96)
      .setTint(0x8ca0bf)
      .setAlpha(0.95);
    addText(heroPanelX, portrait.y + 64, 'Lvl 12', { fontSize: '14px', color: '#f0d080' })
      .setOrigin(0.5, 0.5)
      .setShadow(1, 1, '#000000', 2, true, true);

    const heroPanelRightEdge = heroPanelX + 70;
    const minBarStart = heroPanelRightEdge + 16;
    let barStartX = Math.max(heroPanelX + 96, minBarStart);
    const barEndX = abilityLeftEdge - 28;
    const desiredBarWidth = HUD.BAR_WIDTH * HUD.BAR_SCALE;
    const minBarWidth = 140;
    let availableWidth = barEndX - barStartX;
    let scaledBarWidth = Phaser.Math.Clamp(availableWidth, minBarWidth, desiredBarWidth);

    if (availableWidth < minBarWidth) {
      const fallbackWidth = Phaser.Math.Clamp(barEndX - minBarStart, 96, desiredBarWidth);
      barStartX = Math.max(minBarStart, barEndX - fallbackWidth);
      availableWidth = barEndX - barStartX;
      scaledBarWidth = Math.max(availableWidth, 80);
    }

    scaledBarWidth = Math.min(scaledBarWidth, Math.max(barEndX - barStartX, 0));

    const hpY = panelTop + panelPadding + 12;
    const barVerticalSpacing = 34;
    const manaY = hpY + barVerticalSpacing;
    const stealthY = manaY + barVerticalSpacing;

    const labelStyle = { fontSize: '14px', color: '#f3f5fa' } as Phaser.Types.GameObjects.Text.TextStyle;
    const barBgColor = 0x111a26;

    addText(barStartX, hpY - 12, 'HEALTH', labelStyle).setOrigin(0, 1).setAlpha(0.9);
    const insetWidth = scaledBarWidth - HUD.BAR_INSET;
    const insetOffset = HUD.BAR_INSET / 2;
    this.barFillWidth = Math.max(insetWidth, 0);

    addRect(barStartX, hpY, scaledBarWidth, HUD.BAR_HEIGHT + 6, barBgColor)
      .setOrigin(0, 0.5)
      .setStrokeStyle(2, 0x365d40)
      .setAlpha(0.95);
    this.hpBar = addRect(barStartX + insetOffset, hpY, insetWidth, HUD.BAR_HEIGHT + 2, 0x3fd25d)
      .setOrigin(0, 0.5)
      .setAlpha(0.95);

    addText(barStartX, manaY - 12, 'MANA', labelStyle).setOrigin(0, 1).setAlpha(0.9);
    addRect(barStartX, manaY, scaledBarWidth, HUD.BAR_HEIGHT + 6, barBgColor)
      .setOrigin(0, 0.5)
      .setStrokeStyle(2, 0x2f3f6a)
      .setAlpha(0.95);
    this.manaBar = addRect(barStartX + insetOffset, manaY, insetWidth, HUD.BAR_HEIGHT + 2, 0x48b0f1)
      .setOrigin(0, 0.5)
      .setAlpha(0.95);

    addText(barStartX, stealthY - 12, 'STEALTH', labelStyle).setOrigin(0, 1).setAlpha(0.9);
    addRect(barStartX, stealthY, scaledBarWidth, HUD.BAR_HEIGHT + 6, barBgColor)
      .setOrigin(0, 0.5)
      .setStrokeStyle(2, 0x295746)
      .setAlpha(0.95);
    this.stealthBar = addRect(barStartX + insetOffset, stealthY, insetWidth, HUD.BAR_HEIGHT + 2, 0x59e3a5)
      .setOrigin(0, 0.5)
      .setAlpha(0.95);

    const abilityTrayPadding = 18;
    const abilityTrayHeight = abilitySlotSize + abilityTrayPadding;
    const abilityY = panelTop + panelHeight - abilityTrayHeight / 2 - 12;
    const trayWidth = abilityRightEdge - abilityLeftEdge + abilityTrayPadding * 2;
    addRect(abilityLeftEdge + totalAbilityWidth / 2, abilityY, trayWidth, abilityTrayHeight, 0x08101a)
      .setStrokeStyle(2, 0x284257)
      .setAlpha(0.92);
    const keyTagStyle = { fontSize: '12px', color: '#f9fbff' } as Phaser.Types.GameObjects.Text.TextStyle;
    abilityKeys.forEach((key, index) => {
      const x = abilityStartX + index * (abilitySlotSize + abilityGap);
      addRect(x, abilityY, abilitySlotSize, abilitySlotSize, 0x0d1c29)
        .setStrokeStyle(2, 0x385b7a)
        .setAlpha(0.95);
      const iconSize = Math.max(abilitySlotSize - 12, abilitySlotSize * 0.65, 0);
      const icon = addSprite(x, abilityY, SpriteKeys.effects, EffectFrames.chest)
        .setDisplaySize(iconSize, iconSize)
        .setTint(0xbac3d1)
        .setAlpha(0.92);
      icon.depth = 1;
      const keyTagWidth = Math.max(Math.min(26, abilitySlotSize - 6), 18);
      const keyTagHeight = Math.max(Math.min(18, abilitySlotSize - 8), 12);
      const keyTagHorizontalMargin = Math.max(
        Math.min(abilitySlotSize / 2 - keyTagWidth / 2 - 2, 18),
        4
      );
      const keyTagVerticalMargin = Math.max(Math.min(abilitySlotSize * 0.08, 10), 4);
      const keyTagX = x - abilitySlotSize / 2 + keyTagHorizontalMargin;
      const keyTagY = abilityY + abilitySlotSize / 2 - keyTagHeight / 2 - keyTagVerticalMargin;
      addRect(keyTagX, keyTagY, keyTagWidth, keyTagHeight, 0x1a2b3b)
        .setStrokeStyle(1, 0x385b7a)
        .setOrigin(0, 0.5)
        .setAlpha(0.92);
      addText(keyTagX + keyTagWidth / 2, keyTagY, key, keyTagStyle).setOrigin(0.5, 0.5).setAlpha(0.95);
    });

    const inventoryTitleX = Math.min(width - panelPadding - 260, abilityRightEdge + 48);
    addText(inventoryTitleX, panelTop + 20, 'Inventory', {
      fontSize: '16px',
      color: '#f4e5c3'
    })
      .setOrigin(0, 0.5)
      .setShadow(1, 1, '#000000', 2, true, true);

    this.inventorySlots = [];
    const inventoryRows = 2;
    const inventoryCols = 3;
    const inventorySpacing = 70;
    const inventoryStartX = inventoryTitleX + 20;
    const inventoryStartY = panelTop + panelPadding + 32;
    for (let row = 0; row < inventoryRows; row++) {
      for (let col = 0; col < inventoryCols; col++) {
        const slotX = inventoryStartX + col * inventorySpacing;
        const slotY = inventoryStartY + row * inventorySpacing;
        addRect(slotX, slotY, 64, 64, 0x0d1c29).setStrokeStyle(2, 0x5a441e).setAlpha(0.9);
        const slot = addSprite(slotX, slotY, SpriteKeys.effects, EffectFrames.chest)
          .setDisplaySize(58, 58)
          .setTint(0x8a7343)
          .setAlpha(0.92);
        this.inventorySlots.push(slot);
      }
    }

    const statsX = inventoryStartX + inventorySpacing * inventoryCols + 48;
    addText(statsX, panelTop + 20, 'Hero Stats', { fontSize: '16px', color: '#d0e6ff' })
      .setOrigin(0, 0.5)
      .setShadow(1, 1, '#000000', 2, true, true);
    this.statsText = addText(statsX, panelTop + 58, '', { fontSize: '14px', color: '#f4f8ff' })
      .setOrigin(0, 0)
      .setLineSpacing(6)
      .setAlpha(0.92);

    const alertY = panelTop + panelHeight - panelPadding - 10;
    this.alert = addText(statsX, alertY, 'No alerts', { fontSize: '14px', color: '#ffe29f' })
      .setOrigin(0, 0.5)
      .setShadow(1, 1, '#000000', 2, true, true);

    const setAlert = (msg: string) => this.alert.setText(msg);
    (this.game as unknown as { setAlert?: (msg: string) => void }).setAlert = setAlert;
    (globalThis as { setAlert?: (msg: string) => void }).setAlert = setAlert;
  }

  update(): void {
    const stats = this.world.hero.stats;
    const fullBarWidth = this.barFillWidth;
    const hpTarget = fullBarWidth * (stats.hp / stats.maxHp);
    const manaTarget = fullBarWidth * (stats.mana / stats.maxMana);
    const stealthTarget = fullBarWidth * (stats.stealth / stats.stealthMax);

    this.hpBar.width = this.lerpBar(this.hpBar.width, hpTarget);
    this.manaBar.width = this.lerpBar(this.manaBar.width, manaTarget);
    this.stealthBar.width = this.lerpBar(this.stealthBar.width, stealthTarget);

    this.statsText.setText(
      `Gold ${stats.gold}\nSPD ${this.world.hero.speed.toFixed(1)}\nMana ${stats.mana}/${stats.maxMana}`
    );
  }

  private lerpBar(current: number, target: number): number {
    const lerped = Phaser.Math.Linear(current, target, HUD.BAR_LERP);
    return Math.abs(lerped - target) < 0.5 ? target : lerped;
  }
}
