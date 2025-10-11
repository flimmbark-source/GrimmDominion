// Procedural map generation for Grimm Dominion
// Returns width and height of the map
export default function generateMap(scene: Phaser.Scene) {
  const gridSize = 20;
  const tileSize = 64;
  const width = gridSize * tileSize;
  const height = gridSize * tileSize;

  // Set a dark background color
  scene.cameras.main.setBackgroundColor(0x222222);

  // Draw grid lines using graphics
  const graphics = scene.add.graphics({ lineStyle: { width: 1, color: 0x444444 } });
  for (let i = 0; i <= gridSize; i++) {
    // horizontal lines
    graphics.lineBetween(0, i * tileSize, width, i * tileSize);
    // vertical lines
    graphics.lineBetween(i * tileSize, 0, i * tileSize, height);
  }

  return { width, height };
}
