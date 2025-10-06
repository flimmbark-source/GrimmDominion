export interface IsoPoint {
  x: number;
  y: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface TileSize {
  width: number;
  height: number;
}

export const isoToScreen = (iso: IsoPoint, tileSize: TileSize): ScreenPoint => {
  const halfWidth = tileSize.width / 2;
  const halfHeight = tileSize.height / 2;

  return {
    x: (iso.x - iso.y) * halfWidth,
    y: (iso.x + iso.y) * halfHeight
  };
};

export const screenToIso = (screen: ScreenPoint, tileSize: TileSize): IsoPoint => {
  const halfWidth = tileSize.width / 2;
  const halfHeight = tileSize.height / 2;

  return {
    x: (screen.y / halfHeight + screen.x / halfWidth) / 2,
    y: (screen.y / halfHeight - screen.x / halfWidth) / 2
  };
};

export const isoTileCenter = (tileX: number, tileY: number): IsoPoint => ({
  x: tileX + 0.5,
  y: tileY + 0.5
});
