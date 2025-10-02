import { gameState } from './state.js';
import { clamp } from './utils.js';

export function updateCamera() {
    const { hero, camera, world } = gameState;
    camera.x = hero.x - camera.width / 2;
    camera.y = hero.y - camera.height / 2;
    camera.x = clamp(camera.x, 0, world.width - camera.width);
    camera.y = clamp(camera.y, 0, world.height - camera.height);
}
