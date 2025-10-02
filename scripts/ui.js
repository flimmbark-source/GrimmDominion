import { RUN_CONFIG } from './constants.js';
import { gameState, getEncounterPhaseStatus, getRunStatus } from './state.js';
import { updateShopButtons } from './shop.js';

export function createInventorySlots() {
    const container = document.getElementById('inventoryPanel');
    container.innerHTML = '';
    for (let i = 0; i < gameState.hero.inventory.length; i += 1) {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        slot.dataset.slotIndex = String(i);
        container.appendChild(slot);
    }
}

function attachTooltip(slot, item) {
    const tooltip = document.getElementById('tooltipPanel');
    slot.onmouseenter = () => {
        tooltip.innerHTML = `<div class="font-bold">${item.name}</div><div>${item.description}</div>`;
        tooltip.classList.remove('hidden');
    };
    slot.onmouseleave = () => {
        tooltip.classList.add('hidden');
    };
}

export function drawInventory() {
    for (let i = 0; i < gameState.hero.inventory.length; i += 1) {
        const slot = document.querySelector(`.inventory-slot[data-slot-index='${i}']`);
        const item = gameState.hero.inventory[i];
        if (!slot) {
            continue;
        }
        if (item) {
            slot.innerHTML = `<div class="item-icon" draggable="true" data-item-id="${item.id}">${item.icon}</div>`;
            attachTooltip(slot, item);
        } else {
            slot.innerHTML = '';
            slot.onmouseenter = null;
            slot.onmouseleave = null;
        }
    }
}

export function updateUI() {
    const healthBar = document.getElementById('heroHealthBar');
    const healthText = document.getElementById('heroHealthText');
    const goldText = document.getElementById('heroGoldText');
    const shopPanel = document.getElementById('shopPanel');
    const phaseName = document.getElementById('phaseName');
    const phaseTimer = document.getElementById('phaseTimer');
    const phaseAccent = document.getElementById('phasePanel');
    const runTimer = document.getElementById('runTimerText');
    const savedText = document.getElementById('villagesSavedText');
    const lostText = document.getElementById('villagesLostText');
    const castleBar = document.getElementById('castleIntegrityBar');
    const castleText = document.getElementById('castleIntegrityText');

    healthBar.style.width = `${(gameState.hero.hp / gameState.hero.maxHp) * 100}%`;
    healthText.textContent = `${Math.ceil(gameState.hero.hp)}/${Math.ceil(gameState.hero.maxHp)}`;
    goldText.textContent = gameState.hero.gold;

    const distToShop = Math.sqrt(
        (gameState.hero.x - gameState.shop.x) ** 2 + (gameState.hero.y - gameState.shop.y) ** 2
    );

    if (distToShop < gameState.shop.interactionRadius) {
        shopPanel.classList.remove('hidden');
        updateShopButtons();
    } else {
        shopPanel.classList.add('hidden');
    }

    if (phaseName && phaseTimer && phaseAccent) {
        const { phase, remaining } = getEncounterPhaseStatus();
        phaseName.textContent = phase.name;
        phaseAccent.style.setProperty('--phase-accent', phase.accentColor);
        const minutes = Math.floor(remaining / 60);
        const seconds = Math.floor(remaining % 60)
            .toString()
            .padStart(2, '0');
        phaseTimer.textContent = `${minutes}:${seconds}`;
    }

    if (runTimer && savedText && lostText && castleBar && castleText) {
        const status = getRunStatus();
        const totalSeconds = Math.max(0, Math.floor(status.timeElapsed));
        const minutes = Math.floor(totalSeconds / 60)
            .toString()
            .padStart(2, '0');
        const seconds = (totalSeconds % 60).toString().padStart(2, '0');
        runTimer.textContent = `${minutes}:${seconds}`;
        savedText.textContent = `${status.villagesSaved}/${RUN_CONFIG.victoryVillageSaveRequirement}`;
        lostText.textContent = `${status.villagesLost}/${RUN_CONFIG.defeatVillageThreshold}`;

        if (gameState.castle) {
            const castlePercent = gameState.castle.maxHp
                ? Math.max(0, Math.min(1, gameState.castle.hp / gameState.castle.maxHp))
                : 0;
            castleBar.style.width = `${castlePercent * 100}%`;
            let color = '#2a7e2a';
            if (castlePercent < 0.35) {
                color = '#a11d1d';
            } else if (castlePercent < 0.7) {
                color = '#cfa431';
            }
            castleBar.style.backgroundColor = color;
            castleText.textContent = `${Math.ceil(gameState.castle.hp)}/${gameState.castle.maxHp}`;
        }
    }
}
