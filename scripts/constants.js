export const WORLD = { width: 3000, height: 2000 };
export const CAMERA = { width: 1280, height: 720 };

export const GAME_CONFIG = {
    darkLordSpawnCooldown: 6,
    villageGoldReward: 100,
    inventorySize: 6,
    sellPriceModifier: 0.5
};

export const DIRECTOR_CONFIG = {
    targetPatrolCount: 6,
    initialPatrolCount: 4,
    spawnCost: 3,
    startingEnergy: 6,
    maxEnergy: 24,
    energyTricklePerSecond: 0.9,
    energyDeficitBoost: 1.1,
    energyVillageUnderAttackBoost: 0.7,
    baseSpawnCooldown: 7,
    minSpawnCooldown: 2.5,
    deficitCooldownBonus: 1,
    redVillageCooldownBonus: 0.8,
    basePatrolWeight: 1,
    patrolDeficitWeight: 0.85,
    baseRaidWeight: 0.55,
    multiVillageRaidMultiplier: 2.2,
    maxBatchSpawns: 3,
    initialDelay: 3.5
};

export const HERO_BASE_STATS = {
    x: WORLD.width / 2 + 400,
    y: WORLD.height / 2 + 300,
    width: 25,
    height: 25,
    color: '#4a90e2',
    hp: 100,
    maxHp: 100,
    gold: 500,
    speed: 3.5,
    sprintMultiplier: 1.6,
    sprintNoiseCooldown: 0.75,
    sprintNoiseRadius: 280,
    attackNoiseRadius: 360,
    attackDamage: 20,
    attackCooldown: 1,
    attackRange: 300,
    projectileSpeed: 7
};

export const CASTLE = {
    x: WORLD.width / 2,
    y: WORLD.height / 2,
    width: 150,
    height: 150,
    color: '#2c1e1e'
};

export const SHOP = {
    x: 500,
    y: 500,
    radius: 75,
    interactionRadius: 150
};

export const SHOP_ITEMS = [
    { id: 'dmg1', name: 'Sharpen Blade', cost: 150, effect: { stat: 'attackDamage', value: 5 }, description: '+5 Damage', icon: '⚔️' },
    { id: 'spd1', name: 'Swift Boots', cost: 200, effect: { stat: 'speed', value: 0.5 }, description: '+0.5 Speed', icon: '👢' },
    { id: 'aspd1', name: 'Quick Gloves', cost: 250, effect: { stat: 'attackCooldown', value: -0.1 }, description: '-0.1s Atk Time', icon: '🧤' },
    { id: 'hp1', name: 'Tough Jerky', cost: 100, effect: { stat: 'maxHp', value: 25 }, description: '+25 Max HP', icon: '🍖' }
];

export const MINION_TYPES = {
    scout: {
        role: 'scout',
        color: '#e24a4a',
        radius: 10,
        maxHp: 40,
        damage: 10,
        sightRange: 400,
        criticalSightRange: 80,
        visionCone: Math.PI * 0.6,
        detectionRate: 1.15,
        detectionDecay: 0.55,
        detectionLoseRate: 1.5,
        patrolRadius: 200,
        baseSpeed: 1.8,
        speedBuffMultiplier: 1.5,
        hpBuffBonus: 60,
        villageAttackDamage: 5,
        villageAttackCooldown: 1,
        heroAttackCooldown: 1.5,
        attackRange: 30,
        damageMultipliers: {
            militia: 1,
            hero: 1
        }
    },
    tank: {
        role: 'tank',
        color: '#6b4b2d',
        radius: 14,
        maxHp: 220,
        damage: 18,
        sightRange: 320,
        criticalSightRange: 60,
        visionCone: Math.PI * 0.7,
        detectionRate: 1,
        detectionDecay: 0.4,
        detectionLoseRate: 1.2,
        patrolRadius: 160,
        baseSpeed: 1.1,
        villageAttackDamage: 15,
        villageAttackCooldown: 1.2,
        heroAttackCooldown: 2.8,
        attackRange: 45,
        swingRadius: 70,
        structureDamageMultiplier: 1.35,
        damageMultipliers: {
            militia: 0.35,
            hero: 1
        }
    },
    priest: {
        role: 'priest',
        color: '#b6a6ff',
        radius: 10,
        maxHp: 70,
        damage: 6,
        sightRange: 380,
        criticalSightRange: 90,
        visionCone: Math.PI * 0.65,
        detectionRate: 1,
        detectionDecay: 0.45,
        detectionLoseRate: 1.4,
        patrolRadius: 180,
        baseSpeed: 1.6,
        villageAttackDamage: 3,
        villageAttackCooldown: 1.5,
        heroAttackCooldown: 2.2,
        attackRange: 28,
        healAmount: 15,
        healRadius: 150,
        healCooldown: 3.5,
        revealDuration: 1.5,
        revealCooldown: 5,
        followDistance: 55,
        damageMultipliers: {
            militia: 1,
            hero: 1
        }
    }
};

export const MINION_SPAWN_TABLE = [
    { type: 'scout', weight: 0.55 },
    { type: 'tank', weight: 0.25 },
    { type: 'priest', weight: 0.2 }
];

export const SCOUT_STATS = MINION_TYPES.scout;

export const MILITIA_STATS = {
    maxHp: 60,
    damage: 8,
    attackRange: 250,
    attackCooldown: 2,
    speed: 2
};

export const MILITIA_PROJECTILE_SPEED = 5;

export const FOREST_COUNT = 15;
export const VILLAGE_COUNT = 4;
export const HUTS_PER_VILLAGE = 3;
export const VILLAGERS_PER_VILLAGE = 5;
export const MILITIA_PER_VILLAGE = 2;

export const RUN_OBJECTIVES = {
    survivalMinutes: 15,
    hardTimeLimitMinutes: 18,
    villagesToSave: 3,
    maxVillageLosses: 2,
    castleProbeRadius: 220,
    castleProbeDuration: 12,
    castleProbeDecayRate: 0.6
};
