import { gameState } from './state.js';

function applyUpgrade(effect, multiplier) {
    if (effect.stat === 'maxHp') {
        gameState.hero.maxHp += effect.value * multiplier;
        if (multiplier > 0) {
            gameState.hero.hp += effect.value * multiplier;
        }
        gameState.hero.hp = Math.min(gameState.hero.hp, gameState.hero.maxHp);
    } else {
        gameState.hero[effect.stat] += effect.value * multiplier;
    }
}

function buyItem(item) {
    const emptySlotIndex = gameState.hero.inventory.findIndex((slot) => slot === null);
    if (emptySlotIndex === -1) {
        return false;
    }
    if (gameState.hero.gold < item.cost) {
        return false;
    }

    gameState.hero.gold -= item.cost;
    gameState.hero.inventory[emptySlotIndex] = item;
    applyUpgrade(item.effect, 1);
    return true;
}

export function setupShop(drawInventory) {
    const container = document.getElementById('shopItemsContainer');
    container.innerHTML = '';
    gameState.shopItems.forEach((item) => {
        const button = document.createElement('button');
        button.id = `shop-item-${item.id}`;
        button.className = 'shop-button p-2 rounded-md text-left';
        button.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="font-semibold">${item.name} (${item.description})</span>
                <span class="font-bold text-yellow-400">${item.cost} G</span>
            </div>
        `;
        button.addEventListener('click', () => {
            if (buyItem(item)) {
                drawInventory();
                updateShopButtons();
            }
        });
        container.appendChild(button);
    });
    updateShopButtons();
}

export function updateShopButtons() {
    gameState.shopItems.forEach((item) => {
        const button = document.getElementById(`shop-item-${item.id}`);
        if (!button) {
            return;
        }
        const isPurchased = gameState.hero.inventory.some((inventoryItem) => inventoryItem && inventoryItem.id === item.id);
        const shouldDisable = gameState.hero.gold < item.cost || isPurchased;
        button.disabled = shouldDisable;
        if (shouldDisable) {
            button.classList.add('opacity-50');
        } else {
            button.classList.remove('opacity-50');
        }
    });
}
