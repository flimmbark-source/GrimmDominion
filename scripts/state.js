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
    MINION_TYPES
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
    spawnTimer: 0,
    director: null,
    gameOver: false
};

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
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
        heroHasHelped: false
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
    gameState.camera.width = canvas.width;
    gameState.camera.height = canvas.height;
    gameState.spawnTimer = 0;
    gameState.gameOver = false;

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

    let patrolCenterX = Math.random() * WORLD.width;
    let patrolCenterY = Math.random() * WORLD.height;
    let targetX = Math.random() * WORLD.width;
    let targetY = Math.random() * WORLD.height;

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
        x: gameState.castle.x + gameState.castle.width / 2,
        y: gameState.castle.y + gameState.castle.height / 2
    };
}

export function createMinion(role = 'scout') {
    const config = MINION_TYPES[role] || MINION_TYPES.scout;
    const spawnPoint = getMinionSpawnPoint();
    return {
        id: Math.random(),
        role: config.role,
        x: spawnPoint.x,
        y: spawnPoint.y,
        radius: config.radius,
        color: config.color,
        hp: config.maxHp,
        maxHp: config.maxHp,
        speed: config.baseSpeed,
        baseSpeed: config.baseSpeed,
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
        villageAttackCooldownMax: config.villageAttackCooldown,
        villageAttackDamage: config.villageAttackDamage,
        heroAttackCooldown: 0,
        heroAttackCooldownMax: config.heroAttackCooldown,
        attackRange: config.attackRange ?? config.radius + 20,
        damage: config.damage,
        damageMultipliers: { militia: 1, hero: 1, ...(config.damageMultipliers || {}) },
        swingRadius: config.swingRadius ?? null,
        structureDamageMultiplier: config.structureDamageMultiplier ?? 1,
        healAmount: config.healAmount ?? null,
        healRadius: config.healRadius ?? null,
        healCooldown: config.healCooldown ?? null,
        healCooldownTimer: config.healCooldown ?? 0,
        revealDuration: config.revealDuration ?? null,
        revealCooldown: config.revealCooldown ?? null,
        revealCooldownTimer: 0,
        followDistance: config.followDistance ?? 0,
        speedBuffMultiplier: config.speedBuffMultiplier ?? 1,
        hpBuffBonus: config.hpBuffBonus ?? 0
    };
}
