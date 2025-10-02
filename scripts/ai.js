import { GAME_CONFIG, MILITIA_STATS } from './constants.js';
import { gameState } from './state.js';
import { distance, isPointInRect } from './utils.js';

function getHeroCenter() {
    return {
        x: gameState.hero.x + gameState.hero.width / 2,
        y: gameState.hero.y + gameState.hero.height / 2
    };
}

function canMinionSeeHero(minion) {
    const heroCenter = getHeroCenter();
    const distToHero = distance(heroCenter.x, heroCenter.y, minion.x, minion.y);
    if (distToHero <= minion.criticalSightRange) {
        return true;
    }
    if (distToHero > minion.sightRange) {
        return false;
    }
    const heroInForest = gameState.forests.some((forest) => isPointInRect(gameState.hero, forest));
    return !heroInForest;
}

function getTargetPosition(target) {
    if (typeof target.width === 'number' && typeof target.height === 'number') {
        return { x: target.x + target.width / 2, y: target.y + target.height / 2 };
    }
    return { x: target.x, y: target.y };
}

function findNearestAlly(minion) {
    let nearest = null;
    let bestScore = Infinity;
    gameState.scouts.forEach((ally) => {
        if (ally.id === minion.id) {
            return;
        }
        const dist = distance(ally.x, ally.y, minion.x, minion.y);
        const weight = ally.role === 'tank' ? 0.6 : 1;
        const score = dist * weight;
        if (score < bestScore) {
            bestScore = score;
            nearest = ally;
        }
    });
    return nearest;
}

function getFollowPoint(minion, ally) {
    if (!ally) {
        return { x: gameState.hero.x, y: gameState.hero.y };
    }
    const followDistance = minion.followDistance || 0;
    if (followDistance <= 0) {
        return { x: ally.x, y: ally.y };
    }
    const dx = ally.x - minion.x;
    const dy = ally.y - minion.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const offsetX = (dx / dist) * followDistance;
    const offsetY = (dy / dist) * followDistance;
    return {
        x: ally.x - offsetX,
        y: ally.y - offsetY
    };
}

function shouldTankSwing(tank) {
    const heroCenter = getHeroCenter();
    if (distance(heroCenter.x, heroCenter.y, tank.x, tank.y) <= tank.swingRadius) {
        return true;
    }
    for (const village of gameState.villages) {
        for (const unit of village.militia) {
            const { x, y } = getTargetPosition(unit);
            if (distance(x, y, tank.x, tank.y) <= tank.swingRadius) {
                return true;
            }
        }
        for (const villager of village.villagers) {
            const { x, y } = getTargetPosition(villager);
            if (distance(x, y, tank.x, tank.y) <= tank.swingRadius + villager.radius) {
                return true;
            }
        }
        for (const hut of village.huts) {
            const { x, y } = getTargetPosition(hut);
            const hutRadius = Math.max(hut.width, hut.height) / 2;
            if (distance(x, y, tank.x, tank.y) <= tank.swingRadius + hutRadius) {
                return true;
            }
        }
    }
    return false;
}

function performTankSwing(tank) {
    const heroCenter = getHeroCenter();
    if (distance(heroCenter.x, heroCenter.y, tank.x, tank.y) <= tank.swingRadius) {
        gameState.hero.hp -= tank.damage;
    }

    gameState.villages.forEach((village) => {
        village.militia.forEach((militiaman) => {
            const { x, y } = getTargetPosition(militiaman);
            if (distance(x, y, tank.x, tank.y) <= tank.swingRadius) {
                militiaman.hp = Math.max(0, militiaman.hp - tank.damage);
            }
        });
        village.villagers.forEach((villager) => {
            const { x, y } = getTargetPosition(villager);
            if (distance(x, y, tank.x, tank.y) <= tank.swingRadius + villager.radius) {
                villager.hp = Math.max(0, villager.hp - tank.damage * 0.75);
            }
        });
        village.huts.forEach((hut) => {
            const { x, y } = getTargetPosition(hut);
            const hutRadius = Math.max(hut.width, hut.height) / 2;
            if (distance(x, y, tank.x, tank.y) <= tank.swingRadius + hutRadius) {
                hut.hp = Math.max(0, hut.hp - tank.damage * tank.structureDamageMultiplier);
            }
        });
    });
}

export function updateHero(deltaTime) {
    gameState.hero.revealTimer = Math.max(0, gameState.hero.revealTimer - deltaTime);

    const dx = gameState.hero.targetX - gameState.hero.x;
    const dy = gameState.hero.targetY - gameState.hero.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > gameState.hero.speed) {
        gameState.hero.x += (dx / dist) * gameState.hero.speed;
        gameState.hero.y += (dy / dist) * gameState.hero.speed;
    }

    gameState.hero.x = Math.max(0, Math.min(gameState.world.width - gameState.hero.width, gameState.hero.x));
    gameState.hero.y = Math.max(0, Math.min(gameState.world.height - gameState.hero.height, gameState.hero.y));

    gameState.hero.attackTimer -= deltaTime;
    if (gameState.hero.attackTimer <= 0) {
        const nearestScout = gameState.scouts.reduce((closest, scout) => {
            const d = distance(gameState.hero.x, gameState.hero.y, scout.x, scout.y);
            if (d < gameState.hero.attackRange && (!closest || d < closest.dist)) {
                return { scout, dist: d };
            }
            return closest;
        }, null);

        if (nearestScout) {
            gameState.projectiles.push({
                x: gameState.hero.x + gameState.hero.width / 2,
                y: gameState.hero.y + gameState.hero.height / 2,
                radius: 5,
                color: '#f0e68c',
                targetId: nearestScout.scout.id
            });
            gameState.hero.attackTimer = gameState.hero.attackCooldown;
        }
    }
}

export function updateMilitiaAI(deltaTime) {
    gameState.villages.forEach((village) => {
        village.militia.forEach((militiaman) => {
            militiaman.attackTimer -= deltaTime;
            if (village.isUnderAttack) {
                if (
                    !militiaman.targetScout ||
                    militiaman.targetScout.hp <= 0 ||
                    !village.attackers.has(militiaman.targetScout.id)
                ) {
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
            const multiplier = target.damageMultipliers?.[owner] ?? 1;
            target.hp = Math.max(0, target.hp - damage * multiplier);
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
    const heroCenter = getHeroCenter();
    gameState.scouts.forEach((scout) => {
        scout.villageAttackCooldown -= deltaTime;
        scout.heroAttackCooldown -= deltaTime;
        if (typeof scout.healCooldownTimer === 'number') {
            scout.healCooldownTimer -= deltaTime;
        }
        if (typeof scout.revealCooldownTimer === 'number') {
            scout.revealCooldownTimer -= deltaTime;
        }

        if (scout.state === 'PATROLLING') {
            if (canMinionSeeHero(scout)) {
                scout.state = 'CHASING';
            } else {
                for (const village of gameState.villages) {
                    const targets =
                        scout.role === 'tank'
                            ? [...village.huts, ...village.villagers]
                            : [...village.villagers, ...village.huts];
                    for (const target of targets) {
                        if (target.hp <= 0) {
                            continue;
                        }
                        const { x: targetX, y: targetY } = getTargetPosition(target);
                        const distToTarget = distance(targetX, targetY, scout.x, scout.y);
                        if (distToTarget <= scout.sightRange) {
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

            if (scout.state !== 'PATROLLING' && !scout.isBuffed && scout.speedBuffMultiplier > 1) {
                scout.isBuffed = true;
                scout.speed *= scout.speedBuffMultiplier;
                scout.maxHp += scout.hpBuffBonus;
                scout.hp += scout.hpBuffBonus;
                scout.color = '#ff3333';
            }
        }

        if (scout.state === 'CHASING') {
            if (scout.role === 'priest') {
                const ally = findNearestAlly(scout);
                const followPoint = getFollowPoint(scout, ally);
                scout.targetX = followPoint.x;
                scout.targetY = followPoint.y;
            } else {
                scout.targetX = gameState.hero.x;
                scout.targetY = gameState.hero.y;
            }
        } else if (scout.state === 'ATTACKING_VILLAGE') {
            if (!scout.villageAttackTarget || scout.villageAttackTarget.hp <= 0) {
                scout.state = 'PATROLLING';
                scout.villageAttackTarget = null;
            } else {
                const { x: targetX, y: targetY } = getTargetPosition(scout.villageAttackTarget);
                scout.targetX = targetX;
                scout.targetY = targetY;
                const distToTarget = distance(targetX, targetY, scout.x, scout.y);
                if (distToTarget < scout.attackRange && scout.villageAttackCooldown <= 0) {
                    const isStructure = typeof scout.villageAttackTarget.width === 'number';
                    const damageMultiplier = isStructure ? scout.structureDamageMultiplier : 1;
                    scout.villageAttackTarget.hp = Math.max(
                        0,
                        scout.villageAttackTarget.hp - scout.villageAttackDamage * damageMultiplier
                    );
                    scout.villageAttackCooldown = scout.villageAttackCooldownMax;
                }
            }
        } else if (scout.state === 'PATROLLING') {
            const distToTarget = distance(scout.targetX, scout.targetY, scout.x, scout.y);
            if (distToTarget < 20) {
                scout.targetX = scout.patrolCenterX + (Math.random() - 0.5) * 2 * scout.patrolRadius;
                scout.targetY = scout.patrolCenterY + (Math.random() - 0.5) * 2 * scout.patrolRadius;
            }
        }

        const dx = scout.targetX - scout.x;
        const dy = scout.targetY - scout.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let shouldMove = true;
        if (scout.role !== 'priest' && scout.state === 'CHASING' && dist < scout.attackRange && scout.heroAttackCooldown > 0) {
            shouldMove = false;
        }

        if (dist > scout.speed && shouldMove) {
            scout.x += (dx / dist) * scout.speed;
            scout.y += (dy / dist) * scout.speed;
        }

        if (
            scout.role === 'priest' &&
            scout.healAmount &&
            scout.healRadius &&
            scout.healCooldown &&
            scout.healCooldownTimer <= 0
        ) {
            let healedAny = false;
            gameState.scouts.forEach((ally) => {
                if (ally.id === scout.id) {
                    return;
                }
                const allyDist = distance(ally.x, ally.y, scout.x, scout.y);
                if (allyDist <= scout.healRadius) {
                    const missingHp = ally.maxHp - ally.hp;
                    if (missingHp > 0) {
                        ally.hp = Math.min(ally.maxHp, ally.hp + scout.healAmount);
                        healedAny = true;
                    }
                }
            });
            if (healedAny) {
                scout.healCooldownTimer = scout.healCooldown;
                gameState.worldTextEffects.push({
                    text: '+',
                    x: scout.x,
                    y: scout.y - 20,
                    color: 'rgba(200, 240, 255, 0.9)',
                    font: 'bold 18px MedievalSharp',
                    lifespan: 0.6
                });
            } else {
                scout.healCooldownTimer = 1;
            }
        }

        if (
            scout.role === 'priest' &&
            scout.revealDuration &&
            scout.revealCooldown &&
            scout.revealCooldownTimer <= 0 &&
            canMinionSeeHero(scout)
        ) {
            gameState.hero.revealTimer = Math.max(gameState.hero.revealTimer, scout.revealDuration);
            scout.revealCooldownTimer = scout.revealCooldown;
            gameState.worldTextEffects.push({
                text: 'Revealed!',
                x: heroCenter.x,
                y: heroCenter.y - 30,
                color: 'rgba(255, 215, 0, 0.9)',
                font: 'bold 18px MedievalSharp',
                lifespan: 1
            });
        }
    });
}

export function handleCollisionsAndDeaths() {
    const heroCenter = getHeroCenter();
    for (let i = gameState.scouts.length - 1; i >= 0; i -= 1) {
        const scout = gameState.scouts[i];
        if (scout.role === 'tank') {
            if (scout.heroAttackCooldown <= 0 && scout.swingRadius && shouldTankSwing(scout)) {
                performTankSwing(scout);
                scout.heroAttackCooldown = scout.heroAttackCooldownMax;
            }
        } else {
            const distToHero = distance(scout.x, scout.y, heroCenter.x, heroCenter.y);
            if (distToHero < scout.attackRange && scout.heroAttackCooldown <= 0) {
                gameState.hero.hp -= scout.damage;
                scout.heroAttackCooldown = scout.heroAttackCooldownMax;
            }
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
        for (let i = village.militia.length - 1; i >= 0; i -= 1) {
            if (village.militia[i].hp <= 0) {
                village.militia.splice(i, 1);
            }
        }
    });
}
