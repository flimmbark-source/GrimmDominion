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
    MINION_TYPES,
    SCOUT_STATS
} from './constants.js';

const DEFAULT_ENCOUNTER_PHASES = [
    {
        id: 'calm_watch',
        name: 'Calm Watch',
        duration: 90,
        spawnCount: 1,
        accentColor: '#38bdf8'
    },
    {
        id: 'gathering_storm',
        name: 'Gathering Storm',
        duration: 120,
        spawnCount: 2,
        accentColor: '#facc15'
    },
    {
        id: 'nightfall_onslaught',
        name: 'Nightfall Onslaught',
        duration: 150,
        spawnCount: 3,
        accentColor: '#ef4444'
    }
];


const FALLBACK_PHASE = {
    id: 'unknown',
    name: 'Calm',
    duration: 0,
    spawnCount: 0,
    accentColor: '#64748b'
};

function createEncounterState() {
    return {
        phases: DEFAULT_ENCOUNTER_PHASES.map((phase) => ({ ...phase })),
        currentIndex: 0,
        phaseElapsed: 0,
        totalElapsed: 0
    };
}

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
    gameOver: false,
    noisePings: [],
    noisePingIdCounter: 0,
    elapsedTime: 0,
    villagesLost: 0,
    villagesSaved: 0,
    castleProbeTimer: 0,
    castleProbeSourceId: null,
    runOutcome: null,
    runOutcomeReason: null,
    encounter: createEncounterState()
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
        inventory: new Array(GAME_CONFIG.inventorySize).fill(null),
        isSprinting: false,
        noiseCooldown: 0
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
        hasFallen: false,
        saveCount: 0
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
    gameState.noisePings = [];
    gameState.noisePingIdCounter = 0;
    gameState.elapsedTime = 0;
    gameState.villagesLost = 0;
    gameState.villagesSaved = 0;
    gameState.castleProbeTimer = 0;
    gameState.castleProbeSourceId = null;
    gameState.runOutcome = null;
    gameState.runOutcomeReason = null;
    gameState.encounter = createEncounterState();
    cloneShopItems();
}

function getMinionSpawnPoint() {
    const castleCenterX = gameState.castle.x + gameState.castle.width / 2;
    const castleCenterY = gameState.castle.y + gameState.castle.height / 2;
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.max(gameState.castle.width, gameState.castle.height) * 0.75 + 40 + Math.random() * 60;
    const x = clamp(castleCenterX + Math.cos(angle) * radius, 0, gameState.world.width);
    const y = clamp(castleCenterY + Math.sin(angle) * radius, 0, gameState.world.height);
    return { x, y };
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
        const patrolRadius = SCOUT_STATS.patrolRadius ?? 200;
        patrolCenterX = clamp(patrolCenterX + (Math.random() - 0.5) * patrolRadius, 0, WORLD.width);
        patrolCenterY = clamp(patrolCenterY + (Math.random() - 0.5) * patrolRadius, 0, WORLD.height);
        targetX = clamp(
            patrolCenterX + (Math.random() - 0.5) * 2 * patrolRadius,
            0,
            WORLD.width
        );
        targetY = clamp(
            patrolCenterY + (Math.random() - 0.5) * 2 * patrolRadius,
            0,
            WORLD.height
        );
    }

    return createMinion('scout', {
        assignment,
        targetVillageId,
        patrolCenterX,
        patrolCenterY,
        targetX,
        targetY,
        spawnPoint
    });
}

export function createMinion(role = 'scout', overrides = {}) {
    const config = MINION_TYPES[role] || MINION_TYPES.scout;
    const spawnPoint = overrides.spawnPoint || getMinionSpawnPoint();

    const assignment = overrides.assignment ?? 'PATROL';
    const targetVillageId = overrides.targetVillageId ?? null;
    const patrolCenterX = overrides.patrolCenterX ?? spawnPoint.x;
    const patrolCenterY = overrides.patrolCenterY ?? spawnPoint.y;
    const targetX = overrides.targetX ?? patrolCenterX;
    const targetY = overrides.targetY ?? patrolCenterY;

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
        state: overrides.state ?? 'PATROLLING',
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
        healCooldownTimer: 0,
        revealDuration: config.revealDuration ?? null,
        revealCooldown: config.revealCooldown ?? null,
        revealCooldownTimer: 0,
        followDistance: config.followDistance ?? 0,
        speedBuffMultiplier: config.speedBuffMultiplier ?? 1,
        hpBuffBonus: config.hpBuffBonus ?? 0,
        detectionLevel: 0,
        noiseInvestigationTimer: 0,
        searchTimer: 0,
        facingAngle: Math.random() * Math.PI * 2,
        sightRange: config.sightRange,
        criticalSightRange: config.criticalSightRange,
        visionCone: config.visionCone,
        detectionRate: config.detectionRate,
        detectionDecayRate: config.detectionDecay,
        detectionLoseRate: config.detectionLoseRate
    };
}

export function getDetectionThreat() {
    let highest = 0;
    gameState.scouts.forEach((scout) => {
        if (typeof scout.detectionLevel === 'number' && scout.detectionLevel > highest) {
            highest = scout.detectionLevel;
        }
    });
    highest = Math.max(0, Math.min(1, highest));
    let label = 'Hidden';
    if (highest >= 1) {
        label = 'Spotted';
    } else if (highest >= 0.75) {
        label = 'Compromised';
    } else if (highest >= 0.5) {
        label = 'Hunted';
    } else if (highest > 0.25) {
        label = 'Suspicious';
    }
    return { level: highest, label };
}

export function getEncounterPhaseStatus() {
    const encounter = gameState.encounter;
    if (!encounter || !Array.isArray(encounter.phases) || encounter.phases.length === 0) {
        return { phase: FALLBACK_PHASE, remaining: 0 };
    }

    const safeIndex = Math.min(
        Math.max(encounter.currentIndex ?? 0, 0),
        encounter.phases.length - 1
    );
    const phase = encounter.phases[safeIndex] ?? FALLBACK_PHASE;

    if (!Number.isFinite(phase.duration)) {
        return { phase, remaining: 0 };
    }

    const elapsed = Math.max(0, encounter.phaseElapsed ?? 0);
    const remaining = Math.max(0, phase.duration - elapsed);

    return { phase, remaining };
}
