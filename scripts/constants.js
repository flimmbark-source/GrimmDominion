export const WORLD = { width: 3000, height: 2000 };
export const CAMERA = { width: 1280, height: 720 };

export const GAME_CONFIG = {
    darkLordSpawnCooldown: 6,
    villageGoldReward: 100,
    inventorySize: 6,
    sellPriceModifier: 0.5
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
    {
        id: 'dmg1',
        name: 'Sharpen Blade',
        cost: 150,
        effect: { stat: 'attackDamage', value: 5 },
        description: '+5 Damage',
        icon: '⚔️',
        buildId: null
    },
    {
        id: 'spd1',
        name: 'Swift Boots',
        cost: 200,
        effect: { stat: 'speed', value: 0.5 },
        description: '+0.5 Speed',
        icon: '👢',
        buildId: null
    },
    {
        id: 'aspd1',
        name: 'Quick Gloves',
        cost: 250,
        effect: { stat: 'attackCooldown', value: -0.1 },
        description: '-0.1s Atk Time',
        icon: '🧤',
        buildId: null
    },
    {
        id: 'hp1',
        name: 'Tough Jerky',
        cost: 100,
        effect: { stat: 'maxHp', value: 25 },
        description: '+25 Max HP',
        icon: '🍖',
        buildId: null
    }
];

export const SHOP_BUILDS = [
    {
        id: 'shadow',
        name: 'Shadow Build',
        description: 'cloak+, quiet sprint, backstab bonus',
        color: 'text-purple-300',
        items: [
            {
                id: 'shadow_cloak',
                name: 'Cloak+',
                cost: 220,
                description: 'Reduce scout detection range by 40%',
                icon: '🕶️',
                buildId: 'shadow',
                effect: { type: 'stealth', detectionMultiplier: 0.6 }
            },
            {
                id: 'shadow_sprint',
                name: 'Quiet Sprint',
                cost: 180,
                description: 'Gain +1.2 speed while unseen',
                icon: '🏃‍♂️',
                buildId: 'shadow',
                effect: { type: 'quietSprint', speedBonus: 1.2 }
            },
            {
                id: 'shadow_backstab',
                name: 'Backstab Bonus',
                cost: 240,
                description: 'First strike on each scout deals +60% damage',
                icon: '🗡️',
                buildId: 'shadow',
                effect: { type: 'backstab', multiplier: 1.6 }
            }
        ]
    },
    {
        id: 'skirmish',
        name: 'Skirmish Build',
        description: 'dagger+, parry, stamina burst',
        color: 'text-orange-300',
        items: [
            {
                id: 'skirmish_dagger',
                name: 'Dagger+',
                cost: 210,
                description: 'Increase attack damage by 8',
                icon: '🗡️',
                buildId: 'skirmish',
                effect: { stat: 'attackDamage', value: 8 }
            },
            {
                id: 'skirmish_parry',
                name: 'Parry Stance',
                cost: 190,
                description: 'Reduce melee damage taken by 35%',
                icon: '🛡️',
                buildId: 'skirmish',
                effect: { type: 'parry', reduction: 0.35 }
            },
            {
                id: 'skirmish_stamina',
                name: 'Stamina Burst',
                cost: 260,
                description: 'Rapid strikes after a kill (-0.3s CD for 4s)',
                icon: '💥',
                buildId: 'skirmish',
                effect: { type: 'staminaBurst', cooldownBonus: -0.3, duration: 4 }
            }
        ]
    }
];

export const SCOUT_STATS = {
    maxHp: 40,
    damage: 10,
    sightRange: 400,
    criticalSightRange: 80,
    patrolRadius: 200,
    baseSpeed: 1.8,
    speedBuffMultiplier: 1.5,
    hpBuffBonus: 60,
    villageAttackDamage: 5,
    villageAttackCooldown: 1,
    heroAttackCooldown: 1.5
};

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
