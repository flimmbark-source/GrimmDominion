import { RUN_CONDITIONS } from './constants.js';
import { gameState } from './state.js';
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
    const objectiveText = document.getElementById('runObjectiveText');
    const timerText = document.getElementById('runTimerText');
    const villagesSavedText = document.getElementById('runVillagesSavedText');
    const villagesLostText = document.getElementById('runVillagesLostText');

    healthBar.style.width = `${(gameState.hero.hp / gameState.hero.maxHp) * 100}%`;
    healthText.textContent = `${Math.ceil(gameState.hero.hp)}/${Math.ceil(gameState.hero.maxHp)}`;
    goldText.textContent = gameState.hero.gold;

    if (objectiveText) {
        const survivalMinutes = Math.floor(RUN_CONDITIONS.survivalTimeToWin / 60);
        objectiveText.innerHTML = `Survive ${survivalMinutes}:00 and hero-save ${RUN_CONDITIONS.heroVillageSavesToWin} villages.<br><span class="text-red-400">Lose if ${RUN_CONDITIONS.villageLossThreshold} villages fall or the castle is breached.</span>`;
    }

    if (timerText) {
        const minutes = Math.floor(gameState.elapsedTime / 60);
        const seconds = Math.floor(gameState.elapsedTime % 60)
            .toString()
            .padStart(2, '0');
        timerText.textContent = `${minutes}:${seconds}`;
    }

    if (villagesSavedText) {
        villagesSavedText.textContent = gameState.heroVillageSaves;
    }

    if (villagesLostText) {
        villagesLostText.textContent = gameState.villagesLost;
    }

    const distToShop = Math.sqrt(
        (gameState.hero.x - gameState.shop.x) ** 2 + (gameState.hero.y - gameState.shop.y) ** 2
    );

    if (distToShop < gameState.shop.interactionRadius) {
        shopPanel.classList.remove('hidden');
        updateShopButtons();
    } else {
        shopPanel.classList.add('hidden');
    }
}
