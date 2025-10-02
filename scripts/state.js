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
    SCOUT_STATS,
    MILITIA_STATS
} from './constants.js';

export const gameState = {
    canvas: null,
    ctx: null,
    world: { ...WORLD },
    camera: { x: 0, y: 0, width: CAMERA.width, height: CAMERA.height },
    castle: { ...CASTLE },
    hero: null,
    shop: { ...SHOP },
    shopItems: SHOP_ITEMS,
    scouts: [],
    projectiles: [],
    militiaProjectiles: [],
    forests: [],
    villages: [],
    worldTextEffects: [],
    spawnTimer: GAME_CONFIG.darkLordSpawnCooldown,
    gameOver: false,
    elapsedTime: 0,
    villagesLost: 0,
    totalVillageSaves: 0,
    heroVillageSaves: 0,
    castleBreached: false,
    runSummary: null
};

function createHero() {
    return {
        ...HERO_BASE_STATS,
        targetX: HERO_BASE_STATS.x,
        targetY: HERO_BASE_STATS.y,
        attackTimer: 0,
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
        isFallen: false,
        timesSaved: 0
    };

    for (let i = 0; i < HUTS_PER_VILLAGE; i += 1) {
        village.huts.push({
            x: village.x + (Math.random() - 0.5) * 150,
            y: village.y + (Math.random() - 0.5) * 150,
            width: 50,
            height: 40,
            hp: 200,
            maxHp: 200,
            destroyed: false
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
    gameState.camera.width = canvas.width;
    gameState.camera.height = canvas.height;
    gameState.spawnTimer = GAME_CONFIG.darkLordSpawnCooldown;
    gameState.gameOver = false;
    gameState.elapsedTime = 0;
    gameState.villagesLost = 0;
    gameState.totalVillageSaves = 0;
    gameState.heroVillageSaves = 0;
    gameState.castleBreached = false;
    gameState.runSummary = null;

    gameState.forests = Array.from({ length: FOREST_COUNT }, createForest);
    gameState.villages = Array.from({ length: VILLAGE_COUNT }, createVillage);
    gameState.scouts = [];
    gameState.projectiles = [];
    gameState.militiaProjectiles = [];
    gameState.worldTextEffects = [];
    cloneShopItems();
}

export function resetHeroTarget() {
    gameState.hero.targetX = gameState.hero.x;
    gameState.hero.targetY = gameState.hero.y;
}

export function cloneShopItems() {
    gameState.shopItems = SHOP_ITEMS.map((item) => ({ ...item, effect: { ...item.effect } }));
}

export function endRun(result, reason) {
    if (gameState.gameOver) {
        return;
    }

    gameState.gameOver = true;
    gameState.runSummary = {
        result,
        reason,
        elapsedTime: gameState.elapsedTime,
        villagesLost: gameState.villagesLost,
        totalVillageSaves: gameState.totalVillageSaves,
        heroVillageSaves: gameState.heroVillageSaves,
        castleBreached: gameState.castleBreached
    };

    const screen = document.getElementById('runEndScreen');
    const title = document.getElementById('runEndTitle');
    const subtitle = document.getElementById('runEndSubtitle');
    const statsContainer = document.getElementById('runEndStats');

    if (screen && title && subtitle && statsContainer) {
        const isVictory = result === 'win';
        title.textContent = isVictory ? 'Victory!' : 'Defeat';
        title.classList.toggle('text-green-400', isVictory);
        title.classList.toggle('text-red-500', !isVictory);
        subtitle.textContent = reason;

        const minutes = Math.floor(gameState.elapsedTime / 60);
        const seconds = Math.floor(gameState.elapsedTime % 60)
            .toString()
            .padStart(2, '0');

        statsContainer.innerHTML = `
            <p><span class="font-semibold">Time Survived:</span> ${minutes}:${seconds}</p>
            <p><span class="font-semibold">Villages Saved:</span> ${gameState.totalVillageSaves}</p>
            <p><span class="font-semibold">Hero-Assisted Saves:</span> ${gameState.heroVillageSaves}</p>
            <p><span class="font-semibold">Villages Lost:</span> ${gameState.villagesLost}</p>
        `;

        screen.classList.remove('hidden');
    }
}

export function createScout() {
    return {
        id: Math.random(),
        x: gameState.castle.x + gameState.castle.width / 2,
        y: gameState.castle.y + gameState.castle.height / 2,
        radius: 10,
        color: '#e24a4a',
        hp: SCOUT_STATS.maxHp,
        maxHp: SCOUT_STATS.maxHp,
        speed: SCOUT_STATS.baseSpeed,
        isBuffed: false,
        state: 'PATROLLING',
        targetX: Math.random() * WORLD.width,
        targetY: Math.random() * WORLD.height,
        patrolCenterX: Math.random() * WORLD.width,
        patrolCenterY: Math.random() * WORLD.height,
        villageAttackTarget: null,
        villageAttackCooldown: 0,
        heroAttackCooldown: 0
    };
}
