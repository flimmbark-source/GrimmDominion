import type { Vec2 } from '../types';

export const toIso = (x: number, y: number, til = 32): Vec2 => ({
  x: ((x - y) * til) / 2,
  y: ((x + y) * til) / 4
});

export function placeGrid(cols: number, rows: number, til = 32): Vec2[] {
  const out: Vec2[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      out.push({ x: x * til, y: y * til });
    }
  }
  return out;
}
