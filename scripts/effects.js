import { gameState } from './state.js';

export function updateWorldTextEffects(deltaTime) {
    for (let i = gameState.worldTextEffects.length - 1; i >= 0; i -= 1) {
        const effect = gameState.worldTextEffects[i];
        effect.lifespan -= deltaTime;
        effect.y -= 10 * deltaTime;
        const alpha = Math.max(0, effect.lifespan / 2);
        effect.color = effect.color.replace(/rgba\((\d+,\s*\d+,\s*\d+,\s*)[^)]+\)/, `rgba($1${alpha})`);
        if (effect.lifespan <= 0) {
            gameState.worldTextEffects.splice(i, 1);
        }
    }
}
