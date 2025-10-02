import {
    WORLD,
    CAMERA,
    CASTLE,
    SHOP,
    SHOP_ITEMS,
    HERO_BASE_STATS,
    GAME_CONFIG,
    FOREST_COUNT,
    VILLAGE_COUNT,
    HUTS_PER_VILLAGE,
    VILLAGERS_PER_VILLAGE,
    MILITIA_PER_VILLAGE,
    MILITIA_STATS,
    SCOUT_STATS,
    RUN_CONFIG
} from './constants.js';

export const gameState = {
    canvas: null,
    ctx: null,
    world: { ...WORLD },
    camera: { x: 0, y: 0, width: CAMERA.width, height: CAMERA.height },
    castle: { ...CASTLE, hp: CASTLE.maxHp },
    hero: null,
    shop: { ...SHOP },
    shopItems: SHOP_ITEMS,
    scouts: [],
    projectiles: [],
    militiaProjectiles: [],
    forests: [],
    villages: [],
    worldTextEffects: [],
    spawnTimer: 0,
    director: null,
    gameOver: false,
    runStats: createDefaultRunStats(),
    runOutcome: null,
    runMessage: '',
    runDetail: ''
};

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function createDefaultRunStats() {
    return {
        timeElapsed: 0,
        uniqueVillagesSaved: new Set(),
        fallenVillages: new Set()
    };
}

function formatTime(seconds) {
    const totalSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(totalSeconds / 60)
        .toString()
        .padStart(2, '0');
    const remainder = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainder}`;
}

function getMinionSpawnPoint() {
    const side = Math.floor(Math.random() * 4);
    const offset = 120;
    switch (side) {
        case 0:
            return { x: Math.random() * WORLD.width, y: offset };
        case 1:
            return { x: WORLD.width - offset, y: Math.random() * WORLD.height };
        case 2:
            return { x: Math.random() * WORLD.width, y: WORLD.height - offset };
        default:
            return { x: offset, y: Math.random() * WORLD.height };
    }
}

function createHero() {
    return {
        ...HERO_BASE_STATS,
        targetX: HERO_BASE_STATS.x,
        targetY: HERO_BASE_STATS.y,
        attackTimer: 0,
        revealTimer: 0,
        inventory: new Array(GAME_CONFIG.inventorySize).fill(null)
    };
}

function createForest() {
    return {
        x: Math.random() * WORLD.width,
        y: Math.random() * WORLD.height,
        width: 200 + Math.random() * 400,
        height: 200 + Math.random() * 400,
        color: 'rgba(15, 51, 15, 0.5)'
    };
}

function createVillage() {
    const baseX = (Math.random() > 0.5 ? 0.25 : 0.75) * WORLD.width + (Math.random() - 0.5) * 500;
    const baseY = (Math.random() > 0.5 ? 0.25 : 0.75) * WORLD.height + (Math.random() - 0.5) * 500;
    const village = {
        id: Math.random(),
        x: baseX,
        y: baseY,
        huts: [],
        villagers: [],
        militia: [],
        isUnderAttack: false,
        attackers: new Set(),
        heroHasHelped: false,
        isDestroyed: false
    };

    for (let i = 0; i < HUTS_PER_VILLAGE; i += 1) {
        village.huts.push({
            x: village.x + (Math.random() - 0.5) * 150,
            y: village.y + (Math.random() - 0.5) * 150,
            width: 50,
            height: 40,
            hp: 200,
            maxHp: 200
        });
    }

    for (let i = 0; i < VILLAGERS_PER_VILLAGE; i += 1) {
        village.villagers.push({
            x: village.x + (Math.random() - 0.5) * 100,
            y: village.y + (Math.random() - 0.5) * 100,
            radius: 8,
            hp: 50,
            maxHp: 50
        });
    }

    for (let i = 0; i < MILITIA_PER_VILLAGE; i += 1) {
        village.militia.push({
            id: Math.random(),
            x: village.x + (Math.random() - 0.5) * 80,
            y: village.y + (Math.random() - 0.5) * 80,
            width: 20,
            height: 20,
            color: '#228B22',
            hp: MILITIA_STATS.maxHp,
            maxHp: MILITIA_STATS.maxHp,
            attackTimer: 0,
            targetScout: null
        });
    }

    return village;
}

export function initializeGameState(canvas) {
    gameState.canvas = canvas;
    gameState.ctx = canvas.getContext('2d');
    gameState.hero = createHero();
    gameState.castle = { ...CASTLE, hp: CASTLE.maxHp };
    gameState.camera.width = canvas.width;
    gameState.camera.height = canvas.height;
    gameState.spawnTimer = 0;
    gameState.gameOver = false;
    gameState.runStats = createDefaultRunStats();
    gameState.runOutcome = null;
    gameState.runMessage = '';
    gameState.runDetail = '';

    gameState.forests = Array.from({ length: FOREST_COUNT }, createForest);
    gameState.villages = Array.from({ length: VILLAGE_COUNT }, createVillage);
    gameState.scouts = [];
    gameState.projectiles = [];
    gameState.militiaProjectiles = [];
    gameState.worldTextEffects = [];
    gameState.director = null;
    cloneShopItems();
}

export function resetHeroTarget() {
    gameState.hero.targetX = gameState.hero.x;
    gameState.hero.targetY = gameState.hero.y;
}

export function cloneShopItems() {
    gameState.shopItems = SHOP_ITEMS.map((item) => ({ ...item, effect: { ...item.effect } }));
}

export function createScout(options = {}) {
    const { assignment = 'PATROL', targetVillageId = null } = options;

    const spawnPoint = getMinionSpawnPoint();
    let patrolCenterX = spawnPoint.x;
    let patrolCenterY = spawnPoint.y;
    let targetX = spawnPoint.x;
    let targetY = spawnPoint.y;

    if (assignment === 'RAID' && targetVillageId) {
        const targetVillage = gameState.villages.find((village) => village.id === targetVillageId);
        if (targetVillage) {
            const approachAngle = Math.random() * Math.PI * 2;
            const approachRadius = 180 + Math.random() * 120;
            patrolCenterX = clamp(targetVillage.x + Math.cos(approachAngle) * approachRadius, 0, WORLD.width);
            patrolCenterY = clamp(targetVillage.y + Math.sin(approachAngle) * approachRadius, 0, WORLD.height);
            targetX = clamp(targetVillage.x + (Math.random() - 0.5) * 120, 0, WORLD.width);
            targetY = clamp(targetVillage.y + (Math.random() - 0.5) * 120, 0, WORLD.height);
        }
    } else {
        targetX = clamp(
            patrolCenterX + (Math.random() - 0.5) * 2 * SCOUT_STATS.patrolRadius,
            0,
            WORLD.width
        );
        targetY = clamp(
            patrolCenterY + (Math.random() - 0.5) * 2 * SCOUT_STATS.patrolRadius,
            0,
            WORLD.height
        );
    }

    return {
        id: Math.random(),
        role: SCOUT_STATS.role,
        x: spawnPoint.x,
        y: spawnPoint.y,
        radius: SCOUT_STATS.radius,
        color: SCOUT_STATS.color,
        hp: SCOUT_STATS.maxHp,
        maxHp: SCOUT_STATS.maxHp,
        speed: SCOUT_STATS.baseSpeed,
        baseSpeed: SCOUT_STATS.baseSpeed,
        isBuffed: false,
        assignment,
        targetVillageId,
        state: 'PATROLLING',
        patrolCenterX,
        patrolCenterY,
        targetX,
        targetY,
        villageAttackTarget: null,
        villageAttackCooldown: 0,
        villageAttackCooldownMax: SCOUT_STATS.villageAttackCooldown,
        villageAttackDamage: SCOUT_STATS.villageAttackDamage,
        heroAttackCooldown: 0,
        heroAttackCooldownMax: SCOUT_STATS.heroAttackCooldown,
        attackRange: SCOUT_STATS.attackRange ?? SCOUT_STATS.radius + 20,
        damage: SCOUT_STATS.damage,
        damageMultipliers: { militia: 1, hero: 1, ...(SCOUT_STATS.damageMultipliers || {}) },
        swingRadius: SCOUT_STATS.swingRadius ?? null,
        structureDamageMultiplier: SCOUT_STATS.structureDamageMultiplier ?? 1,
        healAmount: SCOUT_STATS.healAmount ?? null,
        healRadius: SCOUT_STATS.healRadius ?? null,
        healCooldown: SCOUT_STATS.healCooldown ?? null,
        healCooldownTimer: SCOUT_STATS.healCooldown ?? 0,
        revealDuration: SCOUT_STATS.revealDuration ?? null,
        revealCooldown: SCOUT_STATS.revealCooldown ?? null,
        revealCooldownTimer: 0,
        followDistance: SCOUT_STATS.followDistance ?? 0,
        speedBuffMultiplier: SCOUT_STATS.speedBuffMultiplier ?? 1,
        hpBuffBonus: SCOUT_STATS.hpBuffBonus ?? 0,
        sightRange: SCOUT_STATS.sightRange,
        criticalSightRange: SCOUT_STATS.criticalSightRange,
        patrolRadius: SCOUT_STATS.patrolRadius,
        spawnGraceTimer: RUN_CONFIG.spawnGracePeriod
    };
}

function checkVictoryConditions() {
    if (!gameState.runStats || gameState.gameOver) {
        return;
    }
    const requiredTime = RUN_CONFIG.victoryTimeMinutes * 60;
    const villagesSaved = gameState.runStats.uniqueVillagesSaved.size;
    if (
        villagesSaved >= RUN_CONFIG.victoryVillageSaveRequirement &&
        gameState.runStats.timeElapsed >= requiredTime
    ) {
        endRun(
            'victory',
            'Dominion Secured!',
            `You held for ${formatTime(gameState.runStats.timeElapsed)} and saved ${villagesSaved} villages.`
        );
    }
}

function updateGameOverScreen() {
    const screen = document.getElementById('gameOverScreen');
    if (!screen) {
        return;
    }
    screen.classList.remove('hidden');

    const titleEl = document.getElementById('gameOverTitle');
    if (titleEl) {
        titleEl.textContent = gameState.runMessage || (gameState.runOutcome === 'victory' ? 'Victory!' : 'Defeat');
        titleEl.classList.remove('text-red-500', 'text-green-400');
        titleEl.classList.add(gameState.runOutcome === 'victory' ? 'text-green-400' : 'text-red-500');
    }

    const subtitleEl = document.getElementById('gameOverSubtitle');
    if (subtitleEl) {
        subtitleEl.textContent =
            gameState.runDetail || (gameState.runOutcome === 'victory' ? 'The realm endures.' : 'Darkness engulfs the realm.');
    }

    const detailEl = document.getElementById('gameOverDetails');
    if (detailEl) {
        const status = getRunStatus();
        detailEl.textContent = `Time: ${formatTime(status.timeElapsed)} • Villages Saved: ${status.villagesSaved} • Villages Lost: ${status.villagesLost}`;
        detailEl.classList.remove('hidden');
    }
}

export function advanceRun(deltaTime) {
    if (!gameState.runStats || gameState.gameOver) {
        return;
    }
    gameState.runStats.timeElapsed += deltaTime;
    checkVictoryConditions();
}

export function registerVillageSave(village) {
    if (!gameState.runStats || !village) {
        return;
    }
    if (!gameState.runStats.uniqueVillagesSaved.has(village.id)) {
        gameState.runStats.uniqueVillagesSaved.add(village.id);
    }
    checkVictoryConditions();
}

export function registerVillageLoss(village) {
    if (!gameState.runStats || !village) {
        return;
    }
    if (gameState.runStats.fallenVillages.has(village.id)) {
        return;
    }
    gameState.runStats.fallenVillages.add(village.id);
    if (gameState.runStats.fallenVillages.size >= RUN_CONFIG.defeatVillageThreshold) {
        endRun(
            'defeat',
            'The Frontier Collapses',
            `Too many villages fell (${gameState.runStats.fallenVillages.size}).`
        );
    }
}

export function endRun(outcome, title, subtitle) {
    if (gameState.gameOver) {
        return;
    }
    gameState.gameOver = true;
    gameState.runOutcome = outcome;
    gameState.runMessage = title;
    gameState.runDetail = subtitle;
    updateGameOverScreen();
}

export function getRunStatus() {
    const timeElapsed = gameState.runStats ? gameState.runStats.timeElapsed : 0;
    const villagesSaved = gameState.runStats ? gameState.runStats.uniqueVillagesSaved.size : 0;
    const villagesLost = gameState.runStats ? gameState.runStats.fallenVillages.size : 0;
    return {
        timeElapsed,
        villagesSaved,
        villagesLost,
        outcome: gameState.runOutcome,
        message: gameState.runMessage,
        detail: gameState.runDetail
    };
}
