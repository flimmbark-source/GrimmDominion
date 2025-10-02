import { GAME_CONFIG, MILITIA_STATS, SCOUT_STATS, MINION_TYPES } from './constants.js';
import { gameState } from './state.js';
import { distance, isPointInRect } from './utils.js';
import { handleHeroDefeat, registerVillageLoss, registerVillageSave } from './run-conditions.js';

function getHeroCenter() {
    return {
        x: gameState.hero.x + gameState.hero.width / 2,
        y: gameState.hero.y + gameState.hero.height / 2
    };
}

function normalizeAngle(angle) {
    let result = angle;
    while (result <= -Math.PI) {
        result += Math.PI * 2;
    }
    while (result > Math.PI) {
        result -= Math.PI * 2;
    }
    return result;
}

function angleDifference(a, b) {
    return Math.abs(normalizeAngle(a - b));
}

function emitNoisePing(x, y, radius, intensity = 1, lifespan = 1.5) {
    gameState.noisePingIdCounter += 1;
    gameState.noisePings.push({
        id: gameState.noisePingIdCounter,
        x,
        y,
        radius,
        intensity,
        lifespan,
        age: 0
    });
}

function updateNoisePings(deltaTime) {
    for (let i = gameState.noisePings.length - 1; i >= 0; i -= 1) {
        const ping = gameState.noisePings[i];
        ping.age += deltaTime;
        if (ping.age >= ping.lifespan) {
            gameState.noisePings.splice(i, 1);
        }
    }
}

function findNoiseTargetForScout(scout) {
    let best = null;
    let bestScore = Infinity;
    gameState.noisePings.forEach((ping) => {
        const dist = distance(ping.x, ping.y, scout.x, scout.y);
        if (dist > ping.radius) {
            return;
        }
        const remaining = Math.max(0.1, ping.lifespan - ping.age);
        const score = dist / (ping.intensity * remaining);
        if (score < bestScore) {
            bestScore = score;
            best = ping;
        }
    });
    return best;
}

function updateScoutDetection(scout, heroCenter, deltaTime) {
    scout.detectionLevel = Math.max(0, Math.min(1, scout.detectionLevel ?? 0));
    const heroVisible = canMinionSeeHero(scout, heroCenter);
    if (heroVisible) {
        let gain = scout.detectionRate ?? 1;
        const dist = distance(heroCenter.x, heroCenter.y, scout.x, scout.y);
        if (dist <= scout.criticalSightRange) {
            gain *= 2.4;
        } else {
            const proximity = 1 - dist / scout.sightRange;
            gain *= Math.max(0.35, proximity);
        }
        scout.detectionLevel = Math.min(1, scout.detectionLevel + gain * deltaTime);
        scout.lastKnownHeroX = heroCenter.x;
        scout.lastKnownHeroY = heroCenter.y;
    } else {
        const decay = scout.state === 'CHASING' ? scout.detectionLoseRate : scout.detectionDecayRate;
        if (decay) {
            scout.detectionLevel = Math.max(0, scout.detectionLevel - decay * deltaTime);
        } else {
            scout.detectionLevel = 0;
        }
    }
    return heroVisible;
}

function ensureScoutAwarenessDefaults(scout) {
    const baseConfig = MINION_TYPES[scout.role] || MINION_TYPES.scout;
    if (typeof scout.sightRange !== 'number') {
        scout.sightRange = baseConfig.sightRange;
    }
    if (typeof scout.criticalSightRange !== 'number') {
        scout.criticalSightRange = baseConfig.criticalSightRange;
    }
    if (typeof scout.visionCone !== 'number') {
        scout.visionCone = baseConfig.visionCone;
    }
    if (typeof scout.detectionRate !== 'number') {
        scout.detectionRate = baseConfig.detectionRate ?? 1;
    }
    if (typeof scout.detectionDecayRate !== 'number') {
        scout.detectionDecayRate = baseConfig.detectionDecay ?? 0.5;
    }
    if (typeof scout.detectionLoseRate !== 'number') {
        scout.detectionLoseRate = baseConfig.detectionLoseRate ?? 1.2;
    }
    if (typeof scout.searchDuration !== 'number') {
        scout.searchDuration = 2.5;
    }
    if (typeof scout.detectionLevel !== 'number') {
        scout.detectionLevel = 0;
    }
    if (typeof scout.noiseInvestigationTimer !== 'number') {
        scout.noiseInvestigationTimer = 0;
    }
    if (typeof scout.facingAngle !== 'number') {
        scout.facingAngle = Math.random() * Math.PI * 2;
    }
    if (typeof scout.patrolCenterX !== 'number') {
        scout.patrolCenterX = scout.x;
    }
    if (typeof scout.patrolCenterY !== 'number') {
        scout.patrolCenterY = scout.y;
    }
    if (typeof scout.targetX !== 'number') {
        scout.targetX = scout.x;
    }
    if (typeof scout.targetY !== 'number') {
        scout.targetY = scout.y;
    }
    if (typeof scout.currentNoiseId === 'undefined') {
        scout.currentNoiseId = null;
    }
}

function resetScoutToPatrol(scout) {
    scout.state = 'PATROLLING';
    scout.currentNoiseId = null;
    scout.noiseInvestigationTimer = 0;
    scout.searchTimer = 0;
    scout.detectionLevel = 0;
    const baseConfig = MINION_TYPES[scout.role] || MINION_TYPES.scout;
    const patrolRadius = baseConfig.patrolRadius ?? SCOUT_STATS.patrolRadius;
    scout.targetX = Math.max(
        0,
        Math.min(gameState.world.width, scout.patrolCenterX + (Math.random() - 0.5) * 2 * patrolRadius)
    );
    scout.targetY = Math.max(
        0,
        Math.min(gameState.world.height, scout.patrolCenterY + (Math.random() - 0.5) * 2 * patrolRadius)
    );
    scout.lastKnownHeroX = null;
    scout.lastKnownHeroY = null;
}

function canMinionSeeHero(minion, heroCenter = getHeroCenter()) {
    const distToHero = distance(heroCenter.x, heroCenter.y, minion.x, minion.y);
    if (distToHero > minion.sightRange) {
        return false;
    }
    if (distToHero <= minion.criticalSightRange) {
        return true;
    }

    if (minion.visionCone) {
        const angleToHero = Math.atan2(heroCenter.y - minion.y, heroCenter.x - minion.x);
        const facing = typeof minion.facingAngle === 'number' ? minion.facingAngle : angleToHero;
        const coneMultiplier = minion.state === 'CHASING' ? 1.2 : 1;
        const coneHalf = (minion.visionCone * coneMultiplier) / 2;
        if (angleDifference(angleToHero, facing) > coneHalf) {
            return false;
        }
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
    gameState.hero.noiseCooldown = Math.max(0, gameState.hero.noiseCooldown - deltaTime);

    const dx = gameState.hero.targetX - gameState.hero.x;
    const dy = gameState.hero.targetY - gameState.hero.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const sprinting = gameState.hero.isSprinting && dist > 0.1;
    const moveSpeed = gameState.hero.speed * (sprinting ? gameState.hero.sprintMultiplier : 1);
    if (dist > moveSpeed) {
        const nx = dx / dist;
        const ny = dy / dist;
        gameState.hero.x += nx * moveSpeed;
        gameState.hero.y += ny * moveSpeed;
        if (sprinting && gameState.hero.noiseCooldown <= 0) {
            const center = getHeroCenter();
            emitNoisePing(center.x, center.y, gameState.hero.sprintNoiseRadius, 0.6, 1.1);
            gameState.hero.noiseCooldown = gameState.hero.sprintNoiseCooldown;
        }
    } else if (dist > 0) {
        gameState.hero.x = gameState.hero.targetX;
        gameState.hero.y = gameState.hero.targetY;
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
            const center = getHeroCenter();
            emitNoisePing(center.x, center.y, gameState.hero.attackNoiseRadius, 1.2, 1.8);
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
    updateNoisePings(deltaTime);
    gameState.scouts.forEach((scout) => {
        ensureScoutAwarenessDefaults(scout);
        scout.villageAttackCooldown -= deltaTime;
        scout.heroAttackCooldown -= deltaTime;
        if (typeof scout.healCooldownTimer === 'number') {
            scout.healCooldownTimer -= deltaTime;
        }
        if (typeof scout.revealCooldownTimer === 'number') {
            scout.revealCooldownTimer -= deltaTime;
        }

        const heroVisible = updateScoutDetection(scout, heroCenter, deltaTime);

        if (scout.assignment === 'RAID' && scout.state === 'PATROLLING') {
            const targetVillage = scout.targetVillageId
                ? gameState.villages.find((village) => village.id === scout.targetVillageId)
                : null;
            if (targetVillage && targetVillage.hasFallen) {
                scout.assignment = 'PATROL';
                scout.targetVillageId = null;
                scout.patrolCenterX = scout.x;
                scout.patrolCenterY = scout.y;
            } else if (targetVillage) {
                const distToVillage = distance(targetVillage.x, targetVillage.y, scout.x, scout.y);
                const calmVillage = !targetVillage.isUnderAttack && targetVillage.attackers.size === 0;
                if (calmVillage && distToVillage < SCOUT_STATS.patrolRadius * 0.5) {
                    scout.assignment = 'PATROL';
                    scout.targetVillageId = null;
                    scout.patrolCenterX = scout.x;
                    scout.patrolCenterY = scout.y;
                } else if (distToVillage > SCOUT_STATS.patrolRadius * 0.6) {
                    scout.targetX = Math.max(
                        0,
                        Math.min(gameState.world.width, targetVillage.x + (Math.random() - 0.5) * 120)
                    );
                    scout.targetY = Math.max(
                        0,
                        Math.min(gameState.world.height, targetVillage.y + (Math.random() - 0.5) * 120)
                    );
                }
            } else {
                scout.assignment = 'PATROL';
                scout.targetVillageId = null;
            }
        }

        if (scout.state === 'PATROLLING') {
            if (scout.detectionLevel >= 1) {
                scout.state = 'CHASING';
                scout.currentNoiseId = null;
                scout.noiseInvestigationTimer = 0;
            } else {
                for (const village of gameState.villages) {
                    if (village.hasFallen) {
                        continue;
                    }
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
        }

        if (scout.state !== 'PATROLLING' && scout.detectionLevel >= 1 && scout.state !== 'CHASING') {
            scout.state = 'CHASING';
            scout.currentNoiseId = null;
            scout.noiseInvestigationTimer = 0;
        }

        if (scout.state === 'CHASING' && scout.detectionLevel <= 0 && !heroVisible) {
            scout.state = 'SEARCHING';
            scout.searchTimer = scout.searchDuration;
            if (typeof scout.lastKnownHeroX === 'number' && typeof scout.lastKnownHeroY === 'number') {
                scout.targetX = scout.lastKnownHeroX;
                scout.targetY = scout.lastKnownHeroY;
            }
        }

        if (!heroVisible && scout.state !== 'CHASING' && scout.state !== 'ATTACKING_VILLAGE') {
            scout.noiseInvestigationTimer -= deltaTime;
            const noise = findNoiseTargetForScout(scout);
            if (
                noise &&
                scout.detectionLevel < 1 &&
                scout.state !== 'SEARCHING' &&
                (scout.currentNoiseId !== noise.id || scout.noiseInvestigationTimer <= 0)
            ) {
                scout.currentNoiseId = noise.id;
                scout.state = 'INVESTIGATING_NOISE';
                scout.noiseInvestigationTimer = noise.lifespan - noise.age + 1.5;
                scout.targetX = noise.x;
                scout.targetY = noise.y;
            }
        }

        if (scout.state !== 'PATROLLING' && !scout.isBuffed && scout.speedBuffMultiplier > 1) {
            scout.isBuffed = true;
            scout.speed *= scout.speedBuffMultiplier;
            scout.maxHp += scout.hpBuffBonus;
            scout.hp += scout.hpBuffBonus;
            scout.color = '#ff3333';
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
        } else if (scout.state === 'SEARCHING') {
            scout.searchTimer -= deltaTime;
            if (scout.searchTimer <= 0) {
                resetScoutToPatrol(scout);
            }
        } else if (scout.state === 'INVESTIGATING_NOISE') {
            if (scout.noiseInvestigationTimer <= 0) {
                resetScoutToPatrol(scout);
            }
        } else if (scout.state === 'ATTACKING_VILLAGE') {
            if (!scout.villageAttackTarget || scout.villageAttackTarget.hp <= 0) {
                resetScoutToPatrol(scout);
                scout.villageAttackTarget = null;
                scout.assignment = 'PATROL';
                scout.targetVillageId = null;
                scout.patrolCenterX = scout.x;
                scout.patrolCenterY = scout.y;
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
        }

        if (scout.state === 'PATROLLING') {
            const distToTarget = distance(scout.targetX, scout.targetY, scout.x, scout.y);
            if (distToTarget < 20) {
                if (scout.assignment === 'RAID') {
                    const targetVillage = scout.targetVillageId
                        ? gameState.villages.find((village) => village.id === scout.targetVillageId)
                        : null;
                    if (targetVillage) {
                        scout.targetX = Math.max(
                            0,
                            Math.min(gameState.world.width, targetVillage.x + (Math.random() - 0.5) * 120)
                        );
                        scout.targetY = Math.max(
                            0,
                            Math.min(gameState.world.height, targetVillage.y + (Math.random() - 0.5) * 120)
                        );
                    } else {
                        scout.assignment = 'PATROL';
                        scout.targetVillageId = null;
                        scout.targetX = scout.patrolCenterX + (Math.random() - 0.5) * 2 * SCOUT_STATS.patrolRadius;
                        scout.targetY = scout.patrolCenterY + (Math.random() - 0.5) * 2 * SCOUT_STATS.patrolRadius;
                    }
                } else {
                    scout.targetX = scout.patrolCenterX + (Math.random() - 0.5) * 2 * SCOUT_STATS.patrolRadius;
                    scout.targetY = scout.patrolCenterY + (Math.random() - 0.5) * 2 * SCOUT_STATS.patrolRadius;
                }
            }
        } else if (scout.state === 'SEARCHING') {
            const distToSearch = distance(scout.targetX, scout.targetY, scout.x, scout.y);
            if (distToSearch < 25) {
                resetScoutToPatrol(scout);
            }
        } else if (scout.state === 'INVESTIGATING_NOISE') {
            const distToNoise = distance(scout.targetX, scout.targetY, scout.x, scout.y);
            if (distToNoise < 30) {
                resetScoutToPatrol(scout);
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
            const nx = dx / dist;
            const ny = dy / dist;
            scout.x += nx * scout.speed;
            scout.y += ny * scout.speed;
            scout.facingAngle = Math.atan2(ny, nx);
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
            heroVisible
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
        handleHeroDefeat('hero_fell');
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
                            registerVillageSave(village);
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

        if (!village.hasFallen) {
            const hutsStanding = village.huts.some((hut) => hut.hp > 0);
            if (!hutsStanding) {
                registerVillageLoss(village, 'structures_destroyed');
                return;
            }

            if (village.villagers.length === 0) {
                registerVillageLoss(village, 'villagers_slain');
            }
        }
    });
}
