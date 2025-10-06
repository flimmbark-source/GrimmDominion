import { describe, expect, it } from "vitest";

import { isoTileCenter, isoToScreen, screenToIso } from "../src/iso/coordinates";

describe("isometric projection", () => {
  const tileSize = { width: 128, height: 64 } as const;

  it("round-trips tile centers between iso and screen space", () => {
    const iso = isoTileCenter(4, 7);
    const screen = isoToScreen(iso, tileSize);
    const result = screenToIso(screen, tileSize);

    expect(result.x).toBeCloseTo(iso.x);
    expect(result.y).toBeCloseTo(iso.y);
  });

  it("preserves origin coordinates", () => {
    const iso = { x: 0, y: 0 };
    const screen = isoToScreen(iso, tileSize);
    const result = screenToIso(screen, tileSize);

    expect(result).toEqual({ x: 0, y: 0 });
  });

  it("handles fractional offsets used for formation spacing", () => {
    const iso = { x: 6.35, y: 9.2 };
    const screen = isoToScreen(iso, tileSize);
    const result = screenToIso(screen, tileSize);

    expect(result.x).toBeCloseTo(iso.x, 5);
    expect(result.y).toBeCloseTo(iso.y, 5);
  });
});
