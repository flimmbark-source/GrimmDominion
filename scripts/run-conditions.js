import { gameState } from './state.js';
import { RUN_OBJECTIVES } from './constants.js';

const victoryMessages = {
    objectives_met: 'You endured the hunt and safeguarded the frontier.'
};

const defeatMessages = {
    hero_fell: 'Your hero fell before the Grimm onslaught.',
    villages_lost: 'Too many villages were lost to darkness.',
    castle_breached: 'Castle scouts slipped past the gate and doomed the realm.',
    time_limit: 'The Grimm mustered overwhelming forces as time expired.'
};

function formatTime(totalSeconds) {
    const seconds = Math.max(0, Math.floor(totalSeconds));
    const minutes = Math.floor(seconds / 60)
        .toString()
        .padStart(2, '0');
    const remainder = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainder}`;
}

function getOutcomeMessage(outcome, reason) {
    if (outcome === 'victory') {
        return victoryMessages[reason] ?? 'Victory! The dominion stands firm.';
    }
    return defeatMessages[reason] ?? 'Defeat. Grimm dominion grows unchecked.';
}

function updateSummaryPanel() {
    const overlay = document.getElementById('gameOverScreen');
    if (!overlay) {
        return;
    }

    const title = document.getElementById('runSummaryTitle');
    const subtitle = document.getElementById('runSummarySubtitle');
    const timeEl = document.getElementById('runSummaryTime');
    const savedEl = document.getElementById('runSummaryVillagesSaved');
    const lostEl = document.getElementById('runSummaryVillagesLost');
    const probeEl = document.getElementById('runSummaryCastleProbe');

    overlay.classList.remove('hidden');

    const outcome = gameState.runOutcome ?? 'defeat';
    const reason = gameState.runOutcomeReason ?? 'hero_fell';

    if (title) {
        title.textContent = outcome === 'victory' ? 'Dominion Secured' : 'Dominion Falls';
        title.classList.remove('text-emerald-400', 'text-red-400');
        title.classList.add(outcome === 'victory' ? 'text-emerald-400' : 'text-red-400');
    }

    if (subtitle) {
        subtitle.textContent = getOutcomeMessage(outcome, reason);
    }

    if (timeEl) {
        timeEl.textContent = formatTime(gameState.elapsedTime);
    }

    if (savedEl) {
        savedEl.textContent = `${gameState.villagesSaved}/${RUN_OBJECTIVES.villagesToSave}`;
    }

    if (lostEl) {
        lostEl.textContent = `${gameState.villagesLost}/${RUN_OBJECTIVES.maxVillageLosses}`;
    }

    if (probeEl) {
        const progress = Math.min(1, gameState.castleProbeTimer / RUN_OBJECTIVES.castleProbeDuration);
        probeEl.textContent = `${Math.round(progress * 100)}%`;
    }
}

function triggerVictory(reason) {
    if (gameState.gameOver) {
        return;
    }
    gameState.gameOver = true;
    gameState.runOutcome = 'victory';
    gameState.runOutcomeReason = reason;
    updateSummaryPanel();
}

function triggerDefeat(reason) {
    if (gameState.gameOver) {
        return;
    }
    gameState.gameOver = true;
    gameState.runOutcome = 'defeat';
    gameState.runOutcomeReason = reason;
    updateSummaryPanel();
}

function checkVictoryCondition() {
    if (
        gameState.elapsedTime >= RUN_OBJECTIVES.survivalMinutes * 60 &&
        gameState.villagesSaved >= RUN_OBJECTIVES.villagesToSave &&
        !gameState.gameOver
    ) {
        triggerVictory('objectives_met');
    }
}

function checkHardTimeLimit() {
    if (
        RUN_OBJECTIVES.hardTimeLimitMinutes &&
        gameState.elapsedTime >= RUN_OBJECTIVES.hardTimeLimitMinutes * 60 &&
        !gameState.gameOver
    ) {
        triggerDefeat('time_limit');
    }
}

function updateCastleProbe(deltaTime) {
    if (gameState.gameOver) {
        return;
    }

    const castleCenterX = gameState.castle.x + gameState.castle.width / 2;
    const castleCenterY = gameState.castle.y + gameState.castle.height / 2;
    const radiusSq = RUN_OBJECTIVES.castleProbeRadius * RUN_OBJECTIVES.castleProbeRadius;

    let probing = false;
    let closestDistSq = radiusSq;
    let probingScoutId = null;

    gameState.scouts.forEach((scout) => {
        const dx = scout.x - castleCenterX;
        const dy = scout.y - castleCenterY;
        const distSq = dx * dx + dy * dy;
        if (distSq <= radiusSq && distSq <= closestDistSq) {
            probing = true;
            closestDistSq = distSq;
            probingScoutId = scout.id;
        }
    });

    if (probing) {
        gameState.castleProbeTimer = Math.min(
            RUN_OBJECTIVES.castleProbeDuration,
            gameState.castleProbeTimer + deltaTime
        );
        gameState.castleProbeSourceId = probingScoutId;
        if (gameState.castleProbeTimer >= RUN_OBJECTIVES.castleProbeDuration) {
            triggerDefeat('castle_breached');
        }
    } else if (gameState.castleProbeTimer > 0) {
        gameState.castleProbeTimer = Math.max(
            0,
            gameState.castleProbeTimer - deltaTime * RUN_OBJECTIVES.castleProbeDecayRate
        );
        if (gameState.castleProbeTimer === 0) {
            gameState.castleProbeSourceId = null;
        }
    }
}

export function updateRunState(deltaTime) {
    if (gameState.gameOver) {
        return;
    }

    gameState.elapsedTime += deltaTime;
    updateCastleProbe(deltaTime);

    if (gameState.gameOver) {
        return;
    }

    checkVictoryCondition();
    checkHardTimeLimit();
}

export function registerVillageSave(village) {
    if (!village || gameState.gameOver) {
        return;
    }
    village.saveCount = (village.saveCount ?? 0) + 1;
    gameState.villagesSaved += 1;
    checkVictoryCondition();
}

export function registerVillageLoss(village, cause = 'structures_destroyed') {
    if (!village || village.hasFallen) {
        return;
    }

    village.hasFallen = true;
    village.isUnderAttack = false;
    village.attackers.clear();

    gameState.villagesLost += 1;

    gameState.worldTextEffects.push({
        text: cause === 'villagers_slain' ? 'Village Massacred!' : 'Village Razed!',
        x: village.x,
        y: village.y - 30,
        color: 'rgba(255, 99, 71, 0.95)',
        font: 'bold 26px MedievalSharp',
        lifespan: 2.5
    });

    if (gameState.villagesLost >= RUN_OBJECTIVES.maxVillageLosses && !gameState.gameOver) {
        triggerDefeat('villages_lost');
    }
}

export function handleHeroDefeat(reason = 'hero_fell') {
    triggerDefeat(reason);
}
