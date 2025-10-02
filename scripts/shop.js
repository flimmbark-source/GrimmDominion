import { gameState } from './state.js';

function applyStatUpgrade(stat, value, multiplier) {
    const delta = value * multiplier;
    if (stat === 'maxHp') {
        gameState.hero.maxHp += delta;
        if (multiplier > 0) {
            gameState.hero.hp += delta;
        }
        gameState.hero.hp = Math.min(gameState.hero.hp, gameState.hero.maxHp);
    } else if (stat === 'attackCooldown') {
        const next = gameState.hero.attackCooldown + delta;
        gameState.hero.attackCooldown = Math.max(0.1, next);
    } else {
        gameState.hero[stat] += delta;
    }
}

function applyUpgrade(effect, multiplier = 1) {
    const type = effect.type || 'stat';
    switch (type) {
        case 'stat': {
            if (Array.isArray(effect.stats)) {
                effect.stats.forEach((entry) => applyStatUpgrade(entry.stat, entry.value, multiplier));
            } else if (effect.stat) {
                applyStatUpgrade(effect.stat, effect.value, multiplier);
            }
            break;
        }
        case 'stealth':
            gameState.hero.stealthModifier = Math.max(
                0,
                gameState.hero.stealthModifier + effect.value * multiplier
            );
            break;
        case 'quietSprint':
            gameState.hero.quietSprintBonus = Math.max(
                0,
                gameState.hero.quietSprintBonus + effect.value * multiplier
            );
            break;
        case 'backstab':
            gameState.hero.backstabMultiplier = Math.max(
                1,
                gameState.hero.backstabMultiplier + effect.value * multiplier
            );
            break;
        case 'damageMitigation':
            gameState.hero.damageMitigation = Math.min(
                0.9,
                gameState.hero.damageMitigation + effect.value * multiplier
            );
            break;
        case 'staminaBurst':
            if (typeof effect.bonus === 'number') {
                gameState.hero.staminaBurstBonus = Math.max(
                    gameState.hero.staminaBurstBonus,
                    effect.bonus * multiplier
                );
            }
            if (typeof effect.duration === 'number') {
                gameState.hero.staminaBurstDuration = Math.max(
                    gameState.hero.staminaBurstDuration,
                    effect.duration
                );
            }
            break;
        default:
            break;
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
    if (gameState.hero.selectedBuildId && item.buildId && gameState.hero.selectedBuildId !== item.buildId) {
        return false;
    }

    if (!gameState.hero.selectedBuildId && item.buildId) {
        gameState.hero.selectedBuildId = item.buildId;
        gameState.activeShopBuildId = item.buildId;
    }
    gameState.hero.gold -= item.cost;
    gameState.hero.inventory[emptySlotIndex] = item;
    applyUpgrade(item.effect, 1);
    return true;
}

export function setupShop(drawInventory) {
    const container = document.getElementById('shopItemsContainer');
    const tabsContainer = document.getElementById('shopBuildTabs');
    const buildSummary = document.getElementById('shopBuildDescription');

    function updateActiveBuildItems() {
        if (gameState.hero.selectedBuildId && gameState.activeShopBuildId !== gameState.hero.selectedBuildId) {
            gameState.activeShopBuildId = gameState.hero.selectedBuildId;
        }
        const activeBuild = gameState.shopBuilds.find((build) => build.id === gameState.activeShopBuildId);
        gameState.shopItems = activeBuild ? activeBuild.items : [];
        if (buildSummary) {
            buildSummary.textContent = activeBuild ? activeBuild.summary : '';
        }
    }

    function renderBuildTabs() {
        if (!tabsContainer) {
            return;
        }
        tabsContainer.innerHTML = '';
        gameState.shopBuilds.forEach((build) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `shop-build-tab px-3 py-1 rounded-md font-semibold text-sm ${
                build.id === gameState.activeShopBuildId ? 'active' : ''
            }`;
            button.textContent = build.name;
            if (gameState.hero.selectedBuildId && gameState.hero.selectedBuildId !== build.id) {
                button.disabled = true;
                button.classList.add('locked');
            }
            button.addEventListener('click', () => {
                if (gameState.activeShopBuildId !== build.id) {
                    gameState.activeShopBuildId = build.id;
                    updateActiveBuildItems();
                    renderBuildTabs();
                    renderShopItems();
                    updateShopButtons();
                }
            });
            tabsContainer.appendChild(button);
        });
    }

    function renderShopItems() {
        if (!container) {
            return;
        }
        container.innerHTML = '';
        gameState.shopItems.forEach((item) => {
            const button = document.createElement('button');
            button.id = `shop-item-${item.id}`;
            button.className = 'shop-button p-2 rounded-md text-left';
            button.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="font-semibold">${item.name}</span>
                    <span class="font-bold text-yellow-400">${item.cost} G</span>
                </div>
                <div class="text-sm text-gray-300 mt-1">${item.description}</div>
            `;
            button.addEventListener('click', () => {
                if (buyItem(item)) {
                    drawInventory();
                    renderBuildTabs();
                    updateShopButtons();
                }
            });
            container.appendChild(button);
        });
    }

    updateActiveBuildItems();
    renderBuildTabs();
    renderShopItems();
    updateShopButtons();
}

export function updateShopButtons() {
    gameState.shopItems.forEach((item) => {
        const button = document.getElementById(`shop-item-${item.id}`);
        if (!button) {
            return;
        }
        const isPurchased = gameState.hero.inventory.some((inventoryItem) => inventoryItem && inventoryItem.id === item.id);
        const lockedToOtherBuild = Boolean(
            gameState.hero.selectedBuildId && item.buildId && item.buildId !== gameState.hero.selectedBuildId
        );
        const shouldDisable = gameState.hero.gold < item.cost || isPurchased || lockedToOtherBuild;
        button.disabled = shouldDisable;
        if (shouldDisable) {
            button.classList.add('opacity-50');
        } else {
            button.classList.remove('opacity-50');
        }
        if (lockedToOtherBuild) {
            button.title = 'Locked to your chosen build.';
        } else {
            button.removeAttribute('title');
        }
    });
}
