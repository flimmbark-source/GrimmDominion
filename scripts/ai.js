import { GAME_CONFIG, MILITIA_STATS, SCOUT_STATS, DETECTION_CONFIG, NOISE_CONFIG } from './constants.js';
import { gameState } from './state.js';
import { distance, isPointInRect } from './utils.js';

function canScoutSeeHero(scout) {
    const distToHero = distance(gameState.hero.x, gameState.hero.y, scout.x, scout.y);
    if (distToHero <= SCOUT_STATS.criticalSightRange) {
        return true;
    }
    if (distToHero > SCOUT_STATS.sightRange) {
        return false;
    }
    const heroInForest = gameState.forests.some((forest) => isPointInRect(gameState.hero, forest));
    return !heroInForest;
}

function pickPatrolDestination(scout) {
    scout.targetX = scout.patrolCenterX + (Math.random() - 0.5) * 2 * SCOUT_STATS.patrolRadius;
    scout.targetY = scout.patrolCenterY + (Math.random() - 0.5) * 2 * SCOUT_STATS.patrolRadius;
}

function emitNoiseAt(x, y, strength) {
    const ping = {
        id: Math.random(),
        x,
        y,
        strength,
        ttl: NOISE_CONFIG.pingLifetime,
        age: 0
    };
    gameState.noisePings.push(ping);
    gameState.detection.noiseEchoTimer = DETECTION_CONFIG.noiseUiEchoTime;
}

function selectNoisePingForScout(scout) {
    let selected = null;
    let bestWeight = 0;
    for (const ping of gameState.noisePings) {
        const dist = distance(scout.x, scout.y, ping.x, ping.y);
        const weight = ping.strength / (1 + dist / NOISE_CONFIG.attractionRadius);
        if (weight > bestWeight) {
            bestWeight = weight;
            selected = ping;
        }
    }
    if (selected && bestWeight >= NOISE_CONFIG.attractionThreshold) {
        return selected;
    }
    return null;
}

export function updateHero(deltaTime) {
    const dx = gameState.hero.targetX - gameState.hero.x;
    const dy = gameState.hero.targetY - gameState.hero.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const moveSpeed = gameState.hero.speed * (gameState.hero.isSprinting ? gameState.hero.sprintMultiplier : 1);
    if (dist > moveSpeed) {
        gameState.hero.x += (dx / dist) * moveSpeed;
        gameState.hero.y += (dy / dist) * moveSpeed;
    }

    gameState.hero.x = Math.max(0, Math.min(gameState.world.width - gameState.hero.width, gameState.hero.x));
    gameState.hero.y = Math.max(0, Math.min(gameState.world.height - gameState.hero.height, gameState.hero.y));

    if (gameState.hero.isSprinting) {
        gameState.hero.sprintNoiseTimer -= deltaTime;
        if (gameState.hero.sprintNoiseTimer <= 0) {
            emitNoiseAt(
                gameState.hero.x + gameState.hero.width / 2,
                gameState.hero.y + gameState.hero.height / 2,
                NOISE_CONFIG.sprintStrength
            );
            gameState.hero.sprintNoiseTimer = gameState.hero.sprintNoiseInterval;
        }
    } else {
        gameState.hero.sprintNoiseTimer = Math.max(
            0,
            Math.min(gameState.hero.sprintNoiseTimer, gameState.hero.sprintNoiseInterval)
        );
    }

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
            emitNoiseAt(
                gameState.hero.x + gameState.hero.width / 2,
                gameState.hero.y + gameState.hero.height / 2,
                NOISE_CONFIG.attackStrength
            );
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
            target.hp -= damage;
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
    for (let i = gameState.noisePings.length - 1; i >= 0; i -= 1) {
        const ping = gameState.noisePings[i];
        ping.age += deltaTime;
        ping.ttl -= deltaTime;
        if (ping.ttl <= 0) {
            gameState.noisePings.splice(i, 1);
        }
    }

    gameState.detection.noiseEchoTimer = Math.max(0, gameState.detection.noiseEchoTimer - deltaTime);

    let watchers = 0;

    gameState.scouts.forEach((scout) => {
        scout.villageAttackCooldown -= deltaTime;
        scout.heroAttackCooldown -= deltaTime;

        const seesHero = canScoutSeeHero(scout);
        if (seesHero) {
            watchers += 1;
            scout.lostSightTimer = SCOUT_STATS.lostSightTolerance;
            if (scout.state !== 'CHASING') {
                scout.state = 'CHASING';
                scout.noiseTarget = null;
            }
        } else if (scout.state === 'CHASING') {
            scout.lostSightTimer -= deltaTime;
            if (scout.lostSightTimer <= 0) {
                scout.state = 'PATROLLING';
                scout.noiseTarget = null;
                pickPatrolDestination(scout);
            }
        }

        if (scout.state === 'PATROLLING') {
            const noisePing = selectNoisePingForScout(scout);
            if (noisePing) {
                scout.state = 'INVESTIGATING_NOISE';
                scout.noiseTarget = { id: noisePing.id, x: noisePing.x, y: noisePing.y };
                scout.noiseDwellTimer = NOISE_CONFIG.dwellTime;
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
        } else if (scout.state === 'INVESTIGATING_NOISE') {
            if (!scout.noiseTarget) {
                scout.state = 'PATROLLING';
                pickPatrolDestination(scout);
            } else {
                const activePing = gameState.noisePings.find((ping) => ping.id === scout.noiseTarget.id);
                if (activePing) {
                    scout.noiseTarget.x = activePing.x;
                    scout.noiseTarget.y = activePing.y;
                    scout.noiseDwellTimer = NOISE_CONFIG.dwellTime;
                }
                scout.targetX = scout.noiseTarget.x;
                scout.targetY = scout.noiseTarget.y;
                const distToNoise = distance(scout.noiseTarget.x, scout.noiseTarget.y, scout.x, scout.y);
                if (!activePing) {
                    scout.noiseDwellTimer -= deltaTime * 0.5;
                }
                if (distToNoise < NOISE_CONFIG.arrivalThreshold) {
                    scout.noiseDwellTimer -= deltaTime;
                }
                if (scout.noiseDwellTimer <= 0) {
                    scout.state = 'PATROLLING';
                    scout.noiseTarget = null;
                    scout.noiseDwellTimer = 0;
                    pickPatrolDestination(scout);
                }
            }
        } else if (scout.state === 'ATTACKING_VILLAGE') {
            if (!scout.villageAttackTarget || scout.villageAttackTarget.hp <= 0) {
                scout.state = 'PATROLLING';
                scout.villageAttackTarget = null;
                pickPatrolDestination(scout);
            } else {
                scout.targetX = scout.villageAttackTarget.x;
                scout.targetY = scout.villageAttackTarget.y;
                const distToTarget = distance(scout.targetX, scout.targetY, scout.x, scout.y);
                if (distToTarget < 30 && scout.villageAttackCooldown <= 0) {
                    scout.villageAttackTarget.hp -= SCOUT_STATS.villageAttackDamage;
                    scout.villageAttackCooldown = SCOUT_STATS.villageAttackCooldown;
                }
            }
        } else if (scout.state === 'CHASING') {
            scout.targetX = gameState.hero.x;
            scout.targetY = gameState.hero.y;
        }

        if (!scout.isBuffed && scout.state !== 'PATROLLING' && scout.state !== 'INVESTIGATING_NOISE') {
            scout.isBuffed = true;
            scout.speed *= SCOUT_STATS.speedBuffMultiplier;
            scout.maxHp += SCOUT_STATS.hpBuffBonus;
            scout.hp += SCOUT_STATS.hpBuffBonus;
            scout.color = '#ff3333';
        }

        if (scout.state === 'PATROLLING') {
            const distToTarget = distance(scout.targetX, scout.targetY, scout.x, scout.y);
            if (distToTarget < 20) {
                pickPatrolDestination(scout);
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

    const detection = gameState.detection;
    detection.watchers = watchers;
    if (watchers > 0) {
        detection.level = Math.min(
            1,
            detection.level + DETECTION_CONFIG.fillRatePerScout * watchers * deltaTime
        );
    } else {
        detection.level = Math.max(0, detection.level - DETECTION_CONFIG.decayRate * deltaTime);
    }

    if (detection.level >= DETECTION_CONFIG.alertThreshold) {
        detection.isAlert = true;
    } else if (
        watchers === 0 &&
        detection.level <= (detection.resetThreshold ?? DETECTION_CONFIG.resetThreshold)
    ) {
        detection.isAlert = false;
    }
}

export function handleCollisionsAndDeaths() {
    for (let i = gameState.scouts.length - 1; i >= 0; i -= 1) {
        const scout = gameState.scouts[i];
        const distToHero = distance(scout.x, scout.y, gameState.hero.x + gameState.hero.width / 2, gameState.hero.y + gameState.hero.height / 2);
        if (distToHero < scout.radius + gameState.hero.width / 2 && scout.heroAttackCooldown <= 0) {
            gameState.hero.hp -= SCOUT_STATS.damage;
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
    });
}
