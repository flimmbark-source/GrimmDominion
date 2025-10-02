import { MILITIA_PROJECTILE_SPEED, MILITIA_STATS } from './constants.js';
import {
    gameState,
    initializeGameState,
    resetHeroTarget,
    createScout,
    updateEncounterPhase,
    getCurrentEncounterPhase
} from './state.js';
import { setupShop } from './shop.js';
import { createInventorySlots, drawInventory, updateUI } from './ui.js';
import { setupDragAndDrop, isDraggingItem, updateDraggedIconPosition } from './drag-drop.js';
import { updateHero, updateMilitiaAI, updateProjectiles, updateScoutsAI, handleCollisionsAndDeaths } from './ai.js';
import { updateWorldTextEffects } from './effects.js';
import { updateCamera } from './camera.js';
import { draw } from './render.js';

function spawnScout() {
    gameState.scouts.push(createScout());
}

function spawnScoutsForPhase() {
    const phase = getCurrentEncounterPhase();
    for (let i = 0; i < phase.spawnCount; i += 1) {
        spawnScout();
    }
}

function resizeCanvas() {
    const container = document.getElementById('gameContainer');
    const canvas = gameState.canvas;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    gameState.camera.width = canvas.width;
    gameState.camera.height = canvas.height;
    resetHeroTarget();
    if (!gameState.gameOver) {
        draw();
    }
}

function setupInputHandlers() {
    const canvas = gameState.canvas;
    canvas.addEventListener('click', (event) => {
        if (gameState.gameOver || isDraggingItem()) {
            return;
        }
        const rect = canvas.getBoundingClientRect();
        const scaleX = gameState.camera.width / rect.width;
        const scaleY = gameState.camera.height / rect.height;
        gameState.hero.targetX = (event.clientX - rect.left) * scaleX + gameState.camera.x;
        gameState.hero.targetY = (event.clientY - rect.top) * scaleY + gameState.camera.y;
    });

    document.body.addEventListener('mousemove', (event) => {
        const tooltip = document.getElementById('tooltipPanel');
        tooltip.style.left = `${event.clientX + 15}px`;
        tooltip.style.top = `${event.clientY + 15}px`;
        updateDraggedIconPosition(event.clientX, event.clientY);
    });
}

let lastTimestamp = 0;
function gameLoop(timestamp) {
    if (gameState.gameOver) {
        return;
    }
    if (!lastTimestamp) {
        lastTimestamp = timestamp;
    }
    const deltaTime = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    updateEncounterPhase(deltaTime);
    updateHero(deltaTime);
    updateScoutsAI(deltaTime);
    updateMilitiaAI(deltaTime);
    updateProjectiles(gameState.projectiles, gameState.hero.projectileSpeed, gameState.hero.attackDamage, 'hero');
    updateProjectiles(
        gameState.militiaProjectiles,
        MILITIA_PROJECTILE_SPEED,
        MILITIA_STATS.damage,
        'militia'
    );
    handleCollisionsAndDeaths();
    updateWorldTextEffects(deltaTime);

    gameState.spawnTimer += deltaTime;
    while (gameState.spawnTimer >= gameState.spawnCooldown) {
        spawnScoutsForPhase();
        gameState.spawnTimer -= gameState.spawnCooldown;
    }

    updateCamera();
    updateUI();
    draw();

    requestAnimationFrame(gameLoop);
}

function initialize() {
    const canvas = document.getElementById('gameCanvas');
    initializeGameState(canvas);
    createInventorySlots();
    drawInventory();
    setupShop(drawInventory);
    setupDragAndDrop(drawInventory);
    setupInputHandlers();
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    requestAnimationFrame(gameLoop);
}

document.addEventListener('DOMContentLoaded', initialize);
