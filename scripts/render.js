import { GAME_CONFIG } from './constants.js';
import { gameState } from './state.js';

export function draw() {
    const { ctx, camera, world } = gameState;
    if (!ctx) {
        return;
    }

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    ctx.fillStyle = '#3a4a3a';
    ctx.fillRect(0, 0, world.width, world.height);

    gameState.forests.forEach((forest) => {
        ctx.fillStyle = forest.color;
        ctx.fillRect(forest.x, forest.y, forest.width, forest.height);
    });

    gameState.villages.forEach((village) => {
        ctx.fillStyle = '#6b4f3a';
        ctx.beginPath();
        ctx.arc(village.x, village.y, 100, 0, Math.PI * 2);
        ctx.fill();
        village.huts.forEach((hut) => {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(hut.x, hut.y, hut.width, hut.height);
        });
        village.villagers.forEach((villager) => {
            ctx.fillStyle = '#deb887';
            ctx.beginPath();
            ctx.arc(villager.x, villager.y, villager.radius, 0, Math.PI * 2);
            ctx.fill();
        });
        village.militia.forEach((militiaman) => {
            ctx.fillStyle = militiaman.color;
            ctx.fillRect(militiaman.x, militiaman.y, militiaman.width, militiaman.height);
        });
    });

    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.arc(gameState.shop.x, gameState.shop.y, gameState.shop.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.font = '50px MedievalSharp';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d4af37';
    ctx.fillText('🍺', gameState.shop.x, gameState.shop.y + 15);

    ctx.fillStyle = gameState.castle.color;
    ctx.fillRect(gameState.castle.x, gameState.castle.y, gameState.castle.width, gameState.castle.height);
    ctx.strokeStyle = '#5a3d2b';
    ctx.lineWidth = 8;
    ctx.strokeRect(gameState.castle.x, gameState.castle.y, gameState.castle.width, gameState.castle.height);
    ctx.fillStyle = '#4a2a2a';
    ctx.font = '32px MedievalSharp';
    ctx.textAlign = 'center';
    ctx.fillText('Castle', gameState.castle.x + gameState.castle.width / 2, gameState.castle.y + gameState.castle.height / 2 + 10);

    const spawnWindow = gameState.director ? gameState.director.cooldownDuration : GAME_CONFIG.darkLordSpawnCooldown;
    const spawnRatio = spawnWindow > 0 ? Math.min(1, gameState.spawnTimer / spawnWindow) : 1;
    ctx.fillStyle = '#333';
    ctx.fillRect(gameState.castle.x, gameState.castle.y - 20, gameState.castle.width, 10);
    ctx.fillStyle = '#8a2be2';
    ctx.fillRect(gameState.castle.x, gameState.castle.y - 20, gameState.castle.width * spawnRatio, 10);

    ctx.fillStyle = gameState.hero.color;
    ctx.fillRect(gameState.hero.x, gameState.hero.y, gameState.hero.width, gameState.hero.height);
    if (gameState.hero.revealTimer > 0) {
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.9)';
        ctx.lineWidth = 3;
        ctx.strokeRect(gameState.hero.x - 4, gameState.hero.y - 4, gameState.hero.width + 8, gameState.hero.height + 8);
    }

    gameState.projectiles.forEach((projectile) => {
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
        ctx.fillStyle = projectile.color;
        ctx.fill();
    });

    gameState.militiaProjectiles.forEach((projectile) => {
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
        ctx.fillStyle = projectile.color;
        ctx.fill();
    });

    gameState.scouts.forEach((scout) => {
        if (scout.role === 'scout' && scout.state === 'PATROLLING') {
            ctx.beginPath();
            ctx.arc(scout.x, scout.y, scout.sightRange, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.1)';
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(scout.x, scout.y, scout.criticalSightRange, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
            ctx.fill();
        }
        if (scout.role === 'priest' && scout.healRadius) {
            ctx.beginPath();
            ctx.arc(scout.x, scout.y, scout.healRadius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(180, 220, 255, 0.08)';
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(scout.x, scout.y, scout.radius, 0, Math.PI * 2);
        ctx.fillStyle = scout.color;
        ctx.fill();
        const barWidth = scout.radius * 2.5;
        ctx.fillStyle = '#333';
        ctx.fillRect(scout.x - barWidth / 2, scout.y - scout.radius - 10, barWidth, 5);
        ctx.fillStyle = '#d44c4c';
        ctx.fillRect(
            scout.x - barWidth / 2,
            scout.y - scout.radius - 10,
            barWidth * (scout.hp / scout.maxHp),
            5
        );
    });

    gameState.worldTextEffects.forEach((effect) => {
        ctx.font = effect.font;
        ctx.fillStyle = effect.color;
        ctx.textAlign = 'center';
        ctx.fillText(effect.text, effect.x, effect.y);
    });

    ctx.restore();

    gameState.villages.forEach((village) => {
        if (!village.isUnderAttack) {
            return;
        }
        const remainingAttackers = village.attackers.size;
        const villageScreenX = village.x - camera.x;
        const villageScreenY = village.y - camera.y;
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Inter';
        ctx.textAlign = 'center';
        if (remainingAttackers > 0) {
            ctx.fillText('Help Needed!', villageScreenX, villageScreenY - 50);
        }

        const isOffScreen =
            villageScreenX < 0 ||
            villageScreenX > camera.width ||
            villageScreenY < 0 ||
            villageScreenY > camera.height;

        if (isOffScreen) {
            const angle = Math.atan2(villageScreenY - camera.height / 2, villageScreenX - camera.width / 2);
            const distFromCenter = Math.min(camera.width / 2 - 30, camera.height / 2 - 30);
            const indicatorX = camera.width / 2 + distFromCenter * Math.cos(angle);
            const indicatorY = camera.height / 2 + distFromCenter * Math.sin(angle);
            ctx.save();
            ctx.translate(indicatorX, indicatorY);
            ctx.rotate(angle + Math.PI / 2);
            ctx.font = '30px Inter';
            ctx.fillStyle = 'red';
            ctx.fillText('!', 0, 0);
            ctx.restore();
        }
    });
}
