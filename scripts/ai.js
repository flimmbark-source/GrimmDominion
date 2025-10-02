import { GAME_CONFIG, MILITIA_STATS, SCOUT_STATS } from './constants.js';
import { gameState } from './state.js';
import { distance, isPointInRect } from './utils.js';

function canScoutSeeHero(scout) {
    const stealthMultiplier = Math.max(0.2, gameState.hero.stealthDetectionMultiplier);
    const detectionRange = SCOUT_STATS.sightRange * stealthMultiplier;
    const criticalRange = SCOUT_STATS.criticalSightRange * Math.min(1, stealthMultiplier);

    const distToHero = distance(gameState.hero.x, gameState.hero.y, scout.x, scout.y);
    if (distToHero <= criticalRange) {
        return true;
    }
    if (distToHero > detectionRange) {
        return false;
    }
    const heroInForest = gameState.forests.some((forest) => isPointInRect(gameState.hero, forest));
    return !heroInForest;
}

export function updateHero(deltaTime) {
    const hero = gameState.hero;
    const isBeingChased = gameState.scouts.some((scout) => scout.state === 'CHASING');
    const quietBonus = hero.quietSprintBonus && !isBeingChased ? hero.quietSprintBonus : 0;
    hero.speed = hero.baseSpeed + quietBonus;
    hero.attackCooldown = hero.baseAttackCooldown;
    hero.isShadowStealthed = !isBeingChased;

    if (hero.staminaBurstTimer > 0) {
        hero.staminaBurstTimer -= deltaTime;
        if (hero.staminaBurstTimer <= 0) {
            hero.attackCooldownModifier = 0;
            hero.staminaBurstTimer = 0;
        }
    }

    const dx = hero.targetX - hero.x;
    const dy = hero.targetY - hero.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > hero.speed) {
        hero.x += (dx / dist) * hero.speed;
        hero.y += (dy / dist) * hero.speed;
    }

    hero.x = Math.max(0, Math.min(gameState.world.width - hero.width, hero.x));
    hero.y = Math.max(0, Math.min(gameState.world.height - hero.height, hero.y));

    hero.attackTimer -= deltaTime;
    if (hero.attackTimer <= 0) {
        const nearestScout = gameState.scouts.reduce((closest, scout) => {
            const d = distance(hero.x, hero.y, scout.x, scout.y);
            if (d < hero.attackRange && (!closest || d < closest.dist)) {
                return { scout, dist: d };
            }
            return closest;
        }, null);

        if (nearestScout) {
            gameState.projectiles.push({
                x: hero.x + hero.width / 2,
                y: hero.y + hero.height / 2,
                radius: 5,
                color: '#f0e68c',
                targetId: nearestScout.scout.id
            });
            const effectiveCooldown = Math.max(0.2, hero.baseAttackCooldown + hero.attackCooldownModifier);
            hero.attackTimer = effectiveCooldown;
        }
    }
}

export function updateMilitiaAI(deltaTime) {
    gameState.villages.forEach((village) => {
        village.militia.forEach((militiaman) => {
            militiaman.attackTimer -= deltaTime;
            if (village.isUnderAttack) {
                if (!militiaman.targetScout || militiaman.targetScout.hp <= 0 || !village.attackers.has(militiaman.targetScout.id)) {
                    militiaman.targetScout = gameState.scouts.find((scout) => village.attackers.has(scout.id)) || null;
                }

                if (militiaman.targetScout) {
                    const dx = militiaman.targetScout.x - militiaman.x;
                    const dy = militiaman.targetScout.y - militiaman.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > MILITIA_STATS.speed) {
                        militiaman.x += (dx / dist) * MILITIA_STATS.speed;
                        militiaman.y += (dy / dist) * MILITIA_STATS.speed;
                    }

                    if (dist < MILITIA_STATS.attackRange && militiaman.attackTimer <= 0) {
                        gameState.militiaProjectiles.push({
                            x: militiaman.x,
                            y: militiaman.y,
                            radius: 4,
                            color: '#ADD8E6',
                            targetId: militiaman.targetScout.id
                        });
                        militiaman.attackTimer = MILITIA_STATS.attackCooldown;
                    }
                }
            }
        });
    });
}

export function updateProjectiles(projectiles, speed, damage, owner) {
    for (let i = projectiles.length - 1; i >= 0; i -= 1) {
        const projectile = projectiles[i];
        const target = gameState.scouts.find((scout) => scout.id === projectile.targetId);
        if (!target) {
            projectiles.splice(i, 1);
            continue;
        }

        const dx = target.x - projectile.x;
        const dy = target.y - projectile.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > speed) {
            projectile.x += (dx / dist) * speed;
            projectile.y += (dy / dist) * speed;
        } else {
            projectiles.splice(i, 1);
            let appliedDamage = damage;
            if (owner === 'hero') {
                const hero = gameState.hero;
                const canBackstab =
                    hero.backstabMultiplier > 1 &&
                    hero.isShadowStealthed &&
                    !hero.backstabbedTargets.has(target.id);
                if (canBackstab) {
                    appliedDamage *= hero.backstabMultiplier;
                    hero.backstabbedTargets.add(target.id);
                }
                target.lastHitBy = 'hero';
            } else if (owner === 'militia') {
                target.lastHitBy = 'militia';
            }
            target.hp -= appliedDamage;
            if (owner === 'hero') {
                gameState.villages.forEach((village) => {
                    if (village.attackers.has(target.id)) {
                        village.heroHasHelped = true;
                    }
                });
            }
        }
    }
}

export function updateScoutsAI(deltaTime) {
    gameState.scouts.forEach((scout) => {
        scout.villageAttackCooldown -= deltaTime;
        scout.heroAttackCooldown -= deltaTime;

        if (scout.state === 'PATROLLING') {
            if (canScoutSeeHero(scout)) {
                scout.state = 'CHASING';
            } else {
                for (const village of gameState.villages) {
                    const targets = [...village.villagers, ...village.huts];
                    for (const target of targets) {
                        if (target.hp <= 0) {
                            continue;
                        }
                        const distToTarget = distance(target.x, target.y, scout.x, scout.y);
                        if (distToTarget <= SCOUT_STATS.sightRange) {
                            scout.state = 'ATTACKING_VILLAGE';
                            scout.villageAttackTarget = target;
                            village.isUnderAttack = true;
                            village.attackers.add(scout.id);
                            break;
                        }
                    }
                    if (scout.state === 'ATTACKING_VILLAGE') {
                        break;
                    }
                }
            }

            if (scout.state !== 'PATROLLING' && !scout.isBuffed) {
                scout.isBuffed = true;
                scout.speed *= SCOUT_STATS.speedBuffMultiplier;
                scout.maxHp += SCOUT_STATS.hpBuffBonus;
                scout.hp += SCOUT_STATS.hpBuffBonus;
                scout.color = '#ff3333';
            }
        }

        if (scout.state === 'CHASING') {
            scout.targetX = gameState.hero.x;
            scout.targetY = gameState.hero.y;
        } else if (scout.state === 'ATTACKING_VILLAGE') {
            if (!scout.villageAttackTarget || scout.villageAttackTarget.hp <= 0) {
                scout.state = 'PATROLLING';
                scout.villageAttackTarget = null;
            } else {
                scout.targetX = scout.villageAttackTarget.x;
                scout.targetY = scout.villageAttackTarget.y;
                const distToTarget = distance(scout.targetX, scout.targetY, scout.x, scout.y);
                if (distToTarget < 30 && scout.villageAttackCooldown <= 0) {
                    scout.villageAttackTarget.hp -= SCOUT_STATS.villageAttackDamage;
                    scout.villageAttackCooldown = SCOUT_STATS.villageAttackCooldown;
                }
            }
        } else if (scout.state === 'PATROLLING') {
            const distToTarget = distance(scout.targetX, scout.targetY, scout.x, scout.y);
            if (distToTarget < 20) {
                scout.targetX = scout.patrolCenterX + (Math.random() - 0.5) * 2 * SCOUT_STATS.patrolRadius;
                scout.targetY = scout.patrolCenterY + (Math.random() - 0.5) * 2 * SCOUT_STATS.patrolRadius;
            }
        }

        const dx = scout.targetX - scout.x;
        const dy = scout.targetY - scout.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let shouldMove = true;
        if (scout.state === 'CHASING' && dist < 30 && scout.heroAttackCooldown > 0) {
            shouldMove = false;
        }

        if (dist > scout.speed && shouldMove) {
            scout.x += (dx / dist) * scout.speed;
            scout.y += (dy / dist) * scout.speed;
        }
    });
}

function createBuildResolutionEffect(village) {
    const { buildPath } = gameState.hero;
    if (buildPath === 'shadow') {
        return {
            text: 'Shadow Solution: Scouts silenced before the alarm.',
            x: village.x,
            y: village.y + 30,
            color: 'rgba(178, 144, 255, 1)',
            font: 'bold 18px MedievalSharp',
            lifespan: 2.5
        };
    }
    if (buildPath === 'skirmish') {
        return {
            text: 'Skirmish Solution: Parried blades in the square.',
            x: village.x,
            y: village.y + 30,
            color: 'rgba(255, 196, 120, 1)',
            font: 'bold 18px MedievalSharp',
            lifespan: 2.5
        };
    }
    return null;
}

export function handleCollisionsAndDeaths() {
    for (let i = gameState.scouts.length - 1; i >= 0; i -= 1) {
        const scout = gameState.scouts[i];
        const distToHero = distance(scout.x, scout.y, gameState.hero.x + gameState.hero.width / 2, gameState.hero.y + gameState.hero.height / 2);
        if (distToHero < scout.radius + gameState.hero.width / 2 && scout.heroAttackCooldown <= 0) {
            let damage = SCOUT_STATS.damage;
            if (gameState.hero.parryReduction > 0) {
                damage *= 1 - gameState.hero.parryReduction;
            }
            gameState.hero.hp -= damage;
            scout.heroAttackCooldown = SCOUT_STATS.heroAttackCooldown;
        }
    }

    if (gameState.hero.hp <= 0) {
        gameState.hero.hp = 0;
        gameState.gameOver = true;
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }

    for (let i = gameState.scouts.length - 1; i >= 0; i -= 1) {
        if (gameState.scouts[i].hp <= 0) {
            const deadScout = gameState.scouts.splice(i, 1)[0];
            if (deadScout.lastHitBy === 'hero' && gameState.hero.staminaBurstDuration > 0) {
                gameState.hero.attackCooldownModifier = gameState.hero.staminaBurstBonus;
                gameState.hero.staminaBurstTimer = gameState.hero.staminaBurstDuration;
            }
            gameState.villages.forEach((village) => {
                if (village.attackers.has(deadScout.id)) {
                    village.attackers.delete(deadScout.id);
                    if (village.attackers.size === 0 && village.isUnderAttack) {
                        village.isUnderAttack = false;
                        if (village.heroHasHelped) {
                            gameState.hero.gold += GAME_CONFIG.villageGoldReward;
                            gameState.worldTextEffects.push({
                                text: 'Saved!',
                                x: village.x,
                                y: village.y - 20,
                                color: 'rgba(76, 212, 76, 1)',
                                font: 'bold 24px MedievalSharp',
                                lifespan: 2
                            });
                            gameState.worldTextEffects.push({
                                text: `+${GAME_CONFIG.villageGoldReward} Gold!`,
                                x: village.x,
                                y: village.y,
                                color: 'rgba(255, 215, 0, 1)',
                                font: 'bold 20px MedievalSharp',
                                lifespan: 2
                            });
                            const buildEffect = createBuildResolutionEffect(village);
                            if (buildEffect) {
                                gameState.worldTextEffects.push(buildEffect);
                            }
                        } else {
                            gameState.worldTextEffects.push({
                                text: 'Militia Saved the Day!',
                                x: village.x,
                                y: village.y - 20,
                                color: 'rgba(173, 216, 230, 1)',
                                font: 'bold 18px MedievalSharp',
                                lifespan: 2.5
                            });
                        }
                        village.heroHasHelped = false;
                    }
                }
            });
        }
    }

    gameState.villages.forEach((village) => {
        for (let i = village.villagers.length - 1; i >= 0; i -= 1) {
            if (village.villagers[i].hp <= 0) {
                village.villagers.splice(i, 1);
            }
        }
    });
}
