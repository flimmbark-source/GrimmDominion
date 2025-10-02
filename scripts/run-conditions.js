import { RUN_CONDITIONS } from './constants.js';
import { gameState, endRun } from './state.js';

function formatReasonForVillageLoss(count) {
    return count === 1 ? 'A village has fallen.' : `${count} villages have fallen.`;
}

function announceVillageFall(village) {
    gameState.worldTextEffects.push({
        text: 'Village Lost!',
        x: village.x,
        y: village.y - 30,
        color: 'rgba(255, 99, 71, 1)',
        font: 'bold 28px MedievalSharp',
        lifespan: 3
    });
}

export function tickRunConditions(deltaTime) {
    if (gameState.gameOver) {
        return;
    }

    gameState.elapsedTime += deltaTime;

    gameState.villages.forEach((village) => {
        if (village.isFallen) {
            return;
        }

        const hutsStanding = village.huts.some((hut) => hut.hp > 0);
        if (!hutsStanding) {
            village.isFallen = true;
            village.isUnderAttack = false;
            village.attackers.clear();
            announceVillageFall(village);
            gameState.villagesLost += 1;

            if (gameState.villagesLost >= RUN_CONDITIONS.villageLossThreshold) {
                endRun('loss', formatReasonForVillageLoss(gameState.villagesLost));
            }
        }
    });

    if (gameState.gameOver) {
        return;
    }

    const survivedRequiredTime = gameState.elapsedTime >= RUN_CONDITIONS.survivalTimeToWin;
    const savedEnoughVillages = gameState.heroVillageSaves >= RUN_CONDITIONS.heroVillageSavesToWin;

    if (survivedRequiredTime && savedEnoughVillages) {
        endRun('win', 'You held the line until reinforcements arrived!');
    }
}
