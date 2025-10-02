import { gameState } from './state.js';

function applyUpgrade(effect, multiplier) {
    if (!effect) {
        return;
    }
    const hero = gameState.hero;
    if (!effect.type || effect.type === 'stat') {
        if (effect.stat === 'maxHp') {
            hero.maxHp += effect.value * multiplier;
            if (multiplier > 0) {
                hero.hp += effect.value * multiplier;
            }
            hero.hp = Math.min(hero.hp, hero.maxHp);
        } else {
            hero[effect.stat] += effect.value * multiplier;
            const baseKey = `base${effect.stat.charAt(0).toUpperCase()}${effect.stat.slice(1)}`;
            if (baseKey in hero) {
                hero[baseKey] += effect.value * multiplier;
            }
        }
        return;
    }

    switch (effect.type) {
        case 'stealth':
            if (multiplier > 0) {
                hero.stealthDetectionMultiplier *= effect.detectionMultiplier;
            } else {
                hero.stealthDetectionMultiplier /= effect.detectionMultiplier;
            }
            break;
        case 'quietSprint':
            hero.quietSprintBonus += effect.speedBonus * multiplier;
            break;
        case 'backstab':
            if (multiplier > 0) {
                hero.backstabMultiplier *= effect.multiplier;
                hero.backstabbedTargets.clear();
            } else {
                hero.backstabMultiplier /= effect.multiplier;
            }
            break;
        case 'parry':
            hero.parryReduction += effect.reduction * multiplier;
            hero.parryReduction = Math.max(0, Math.min(0.9, hero.parryReduction));
            break;
        case 'staminaBurst':
            if (multiplier > 0) {
                hero.staminaBurstBonus = effect.cooldownBonus;
                hero.staminaBurstDuration = effect.duration;
                hero.staminaBurstTimer = 0;
                hero.attackCooldownModifier = 0;
            } else {
                hero.staminaBurstBonus = 0;
                hero.staminaBurstDuration = 0;
                hero.staminaBurstTimer = 0;
                hero.attackCooldownModifier = 0;
            }
            break;
        default:
            break;
    }
}

function canPurchaseBuildItem(item) {
    if (!item.buildId) {
        return true;
    }
    if (gameState.hero.buildPath && gameState.hero.buildPath !== item.buildId) {
        return false;
    }
    return true;
}

function buyItem(item) {
    if (!canPurchaseBuildItem(item)) {
        return false;
    }

    const emptySlotIndex = gameState.hero.inventory.findIndex((slot) => slot === null);
    if (emptySlotIndex === -1) {
        return false;
    }
    if (gameState.hero.gold < item.cost) {
        return false;
    }

    gameState.hero.gold -= item.cost;
    gameState.hero.inventory[emptySlotIndex] = { ...item };
    applyUpgrade(item.effect, 1);
    if (item.buildId) {
        if (!gameState.hero.buildPath) {
            gameState.hero.buildPath = item.buildId;
        }
        gameState.selectedShopBuildId = item.buildId;
    }
    return true;
}

function renderGeneralItems(drawInventory) {
    const container = document.getElementById('shopGeneralItems');
    container.innerHTML = '';
    gameState.shopItems.forEach((item) => {
        const button = document.createElement('button');
        button.id = `shop-item-${item.id}`;
        button.className = 'shop-button p-2 rounded-md text-left w-full';
        button.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="font-semibold">${item.name}</span>
                <span class="font-bold text-yellow-400">${item.cost} G</span>
            </div>
            <div class="text-xs text-gray-300 mt-1">${item.description}</div>
        `;
        button.addEventListener('click', () => {
            if (buyItem(item)) {
                drawInventory();
                updateShopButtons();
            }
        });
        container.appendChild(button);
    });
}

function renderBuildSelector(drawInventory) {
    const selector = document.getElementById('shopBuildSelector');
    selector.innerHTML = '';
    gameState.shopBuilds.forEach((build) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.buildId = build.id;
        button.className = 'shop-build-button px-3 py-2 rounded-md text-sm font-semibold';
        button.innerHTML = `
            <div class="${build.color}">${build.name}</div>
            <div class="text-xs text-gray-300">${build.description}</div>
        `;
        button.addEventListener('click', () => {
            if (gameState.hero.buildPath && gameState.hero.buildPath !== build.id) {
                return;
            }
            gameState.selectedShopBuildId = build.id;
            renderBuildItems(drawInventory);
            updateShopButtons();
        });
        selector.appendChild(button);
    });
}

function renderBuildItems(drawInventory) {
    const buildItemsContainer = document.getElementById('shopBuildItems');
    buildItemsContainer.innerHTML = '';
    if (!gameState.shopBuilds.length) {
        return;
    }

    const activeBuildId =
        gameState.hero.buildPath || gameState.selectedShopBuildId || gameState.shopBuilds[0].id;
    if (!gameState.selectedShopBuildId) {
        gameState.selectedShopBuildId = activeBuildId;
    }

    const activeBuild = gameState.shopBuilds.find((build) => build.id === activeBuildId);
    if (!activeBuild) {
        return;
    }

    activeBuild.items.forEach((item) => {
        const button = document.createElement('button');
        button.id = `shop-build-item-${item.id}`;
        button.dataset.buildId = activeBuild.id;
        button.className = 'shop-button p-2 rounded-md text-left w-full';
        button.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="font-semibold">${item.name}</span>
                <span class="font-bold text-yellow-400">${item.cost} G</span>
            </div>
            <div class="text-xs text-gray-300 mt-1">${item.description}</div>
        `;
        button.addEventListener('click', () => {
            if (buyItem(item)) {
                drawInventory();
                renderBuildSelector(drawInventory);
                renderBuildItems(drawInventory);
                updateShopButtons();
            }
        });
        buildItemsContainer.appendChild(button);
    });
}

export function setupShop(drawInventory) {
    renderBuildSelector(drawInventory);
    renderBuildItems(drawInventory);
    renderGeneralItems(drawInventory);
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
        button.classList.toggle('opacity-50', shouldDisable);
    });

    gameState.shopBuilds.forEach((build) => {
        build.items.forEach((item) => {
            const button = document.getElementById(`shop-build-item-${item.id}`);
            if (!button) {
                return;
            }
            const isPurchased = gameState.hero.inventory.some(
                (inventoryItem) => inventoryItem && inventoryItem.id === item.id
            );
            const lacksGold = gameState.hero.gold < item.cost;
            const lockedByBuild =
                gameState.hero.buildPath && gameState.hero.buildPath !== item.buildId;
            const shouldDisable = isPurchased || lacksGold || lockedByBuild;
            button.disabled = shouldDisable;
            button.classList.toggle('opacity-50', shouldDisable);
        });
    });

    document.querySelectorAll('.shop-build-button').forEach((button) => {
        const buildId = button.dataset.buildId;
        const isActive = buildId === gameState.selectedShopBuildId;
        const isLocked = gameState.hero.buildPath && gameState.hero.buildPath !== buildId;
        button.disabled = Boolean(isLocked);
        button.classList.toggle('ring-2', isActive && !isLocked);
        button.classList.toggle('ring-yellow-400', isActive && !isLocked);
        button.classList.toggle('opacity-50', isLocked);
    });
}
