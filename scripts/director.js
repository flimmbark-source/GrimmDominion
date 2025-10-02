import { DIRECTOR_CONFIG } from './constants.js';
import { gameState, createScout } from './state.js';

function clampEnergy(value) {
    return Math.max(0, Math.min(DIRECTOR_CONFIG.maxEnergy, value));
}

function evaluateSpawnContext() {
    const patrolCount = gameState.scouts.filter((scout) => scout.assignment === 'PATROL').length;
    const redVillages = gameState.villages.filter((village) => village.isUnderAttack || village.attackers.size > 0);
    const patrolDeficit = Math.max(0, DIRECTOR_CONFIG.targetPatrolCount - patrolCount);

    let patrolWeight = DIRECTOR_CONFIG.basePatrolWeight + patrolDeficit * DIRECTOR_CONFIG.patrolDeficitWeight;
    let raidWeight = redVillages.length > 0 ? DIRECTOR_CONFIG.baseRaidWeight : 0;

    if (redVillages.length > 1) {
        raidWeight *= DIRECTOR_CONFIG.multiVillageRaidMultiplier;
    }

    const totalWeight = patrolWeight + raidWeight;

    return { patrolCount, redVillages, patrolDeficit, patrolWeight, raidWeight, totalWeight };
}

function computeCooldown(patrolDeficit, redVillageCount) {
    const dynamicCooldown =
        DIRECTOR_CONFIG.baseSpawnCooldown -
        patrolDeficit * DIRECTOR_CONFIG.deficitCooldownBonus -
        redVillageCount * DIRECTOR_CONFIG.redVillageCooldownBonus;

    return Math.max(DIRECTOR_CONFIG.minSpawnCooldown, dynamicCooldown);
}

function pickRaidVillage(redVillages) {
    const viableVillages = gameState.villages.filter((village) => !village.hasFallen);

    if (redVillages.length > 0) {
        return redVillages[Math.floor(Math.random() * redVillages.length)];
    }
    if (viableVillages.length === 0) {
        return null;
    }
    return viableVillages[Math.floor(Math.random() * viableVillages.length)];
}

export function initializeDirector() {
    gameState.director = {
        energy: DIRECTOR_CONFIG.startingEnergy,
        cooldownRemaining: DIRECTOR_CONFIG.initialDelay,
        cooldownDuration: Math.max(DIRECTOR_CONFIG.minSpawnCooldown, DIRECTOR_CONFIG.initialDelay),
        timeSinceLastSpawn: 0,
        lastSpawnType: null
    };

    gameState.spawnTimer = 0;
}

export function updateDirector(deltaTime) {
    if (!gameState.director || gameState.gameOver) {
        return;
    }

    const director = gameState.director;

    director.energy = clampEnergy(director.energy + DIRECTOR_CONFIG.energyTricklePerSecond * deltaTime);

    const currentContext = evaluateSpawnContext();
    if (currentContext.patrolDeficit > 0) {
        director.energy = clampEnergy(
            director.energy + currentContext.patrolDeficit * DIRECTOR_CONFIG.energyDeficitBoost * deltaTime
        );
    }
    if (currentContext.redVillages.length > 0) {
        director.energy = clampEnergy(
            director.energy +
                currentContext.redVillages.length * DIRECTOR_CONFIG.energyVillageUnderAttackBoost * deltaTime
        );
    }

    director.cooldownRemaining -= deltaTime;
    director.timeSinceLastSpawn += deltaTime;

    let loops = 0;
    while (
        director.energy >= DIRECTOR_CONFIG.spawnCost &&
        director.cooldownRemaining <= 0 &&
        loops < DIRECTOR_CONFIG.maxBatchSpawns
    ) {
        const context = evaluateSpawnContext();
        if (context.totalWeight <= 0) {
            break;
        }

        const roll = Math.random() * context.totalWeight;
        let spawnType = 'PATROL';
        if (roll >= context.patrolWeight) {
            spawnType = 'RAID';
        }

        if (spawnType === 'PATROL') {
            gameState.scouts.push(createScout({ assignment: 'PATROL' }));
        } else {
            const raidVillage = pickRaidVillage(context.redVillages);
            gameState.scouts.push(
                createScout({ assignment: 'RAID', targetVillageId: raidVillage ? raidVillage.id : null })
            );
        }

        director.energy = clampEnergy(director.energy - DIRECTOR_CONFIG.spawnCost);
        const newCooldown = computeCooldown(context.patrolDeficit, context.redVillages.length);
        director.cooldownDuration = newCooldown;
        director.cooldownRemaining += newCooldown;
        director.timeSinceLastSpawn = 0;
        gameState.spawnTimer = 0;
        director.lastSpawnType = spawnType;
        loops += 1;
    }

    gameState.spawnTimer = Math.min(director.cooldownDuration, director.timeSinceLastSpawn);
}
