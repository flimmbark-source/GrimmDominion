import { gameState } from './state.js';
import { DETECTION_CONFIG } from './constants.js';
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
    const detectionBar = document.getElementById('detectionBarFill');
    const detectionText = document.getElementById('detectionText');
    const detectionWatchers = document.getElementById('detectionWatchers');
    const detectionNoiseStatus = document.getElementById('detectionNoiseStatus');

    healthBar.style.width = `${(gameState.hero.hp / gameState.hero.maxHp) * 100}%`;
    healthText.textContent = `${Math.ceil(gameState.hero.hp)}/${Math.ceil(gameState.hero.maxHp)}`;
    goldText.textContent = gameState.hero.gold;

    if (detectionBar) {
        detectionBar.style.width = `${Math.round(gameState.detection.level * 100)}%`;
        detectionBar.classList.toggle('alert', gameState.detection.isAlert);
    }

    if (detectionText) {
        let label = 'Hidden';
        let color = '#f4c4d7';
        if (gameState.detection.isAlert) {
            label = 'Danger!';
            color = '#f97316';
        } else if (gameState.detection.level > DETECTION_CONFIG.alertThreshold * 0.7) {
            label = 'Spotted';
            color = '#f87171';
        } else if (gameState.detection.level > DETECTION_CONFIG.alertThreshold * 0.4) {
            label = 'Suspicious';
            color = '#fda4af';
        }
        detectionText.textContent = label;
        detectionText.style.color = color;
    }

    if (detectionWatchers) {
        detectionWatchers.textContent = gameState.detection.watchers;
    }

    if (detectionNoiseStatus) {
        const isNoisy = gameState.detection.noiseEchoTimer > 0;
        detectionNoiseStatus.textContent = isNoisy ? 'Noisy trail' : 'Quiet';
        detectionNoiseStatus.classList.toggle('text-amber-300', isNoisy);
        detectionNoiseStatus.classList.toggle('text-gray-400', !isNoisy);
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
