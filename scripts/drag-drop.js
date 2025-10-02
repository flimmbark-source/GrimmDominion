import { gameState } from './state.js';

let draggedItem = null;
let draggedItemIndex = -1;
let draggedIcon = null;

function clearDragState() {
    draggedItem = null;
    draggedItemIndex = -1;
    if (draggedIcon) {
        draggedIcon.classList.add('hidden');
    }
    document.querySelectorAll('.dragging-source').forEach((el) => el.classList.remove('dragging-source'));
    document.querySelectorAll('.drag-over').forEach((el) => el.classList.remove('drag-over'));
}

export function setupDragAndDrop(drawInventory) {
    const inventoryPanel = document.getElementById('inventoryPanel');
    draggedIcon = document.getElementById('draggedItemIcon');

    inventoryPanel.addEventListener('dragstart', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement) || !target.classList.contains('item-icon')) {
            return;
        }

        const slot = target.closest('.inventory-slot');
        if (!slot) {
            return;
        }

        draggedItemIndex = Number(slot.dataset.slotIndex);
        draggedItem = gameState.hero.inventory[draggedItemIndex];
        if (!draggedItem) {
            return;
        }

        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', draggedItem.id);
        target.classList.add('dragging-source');
        draggedIcon.textContent = draggedItem.icon;
        draggedIcon.classList.remove('hidden');
        draggedIcon.style.left = `${event.clientX - 24}px`;
        draggedIcon.style.top = `${event.clientY - 24}px`;
    });

    inventoryPanel.addEventListener('dragover', (event) => {
        event.preventDefault();
        const slot = event.target instanceof HTMLElement ? event.target.closest('.inventory-slot') : null;
        if (slot) {
            document.querySelectorAll('.inventory-slot').forEach((element) => element.classList.remove('drag-over'));
            slot.classList.add('drag-over');
        }
    });

    inventoryPanel.addEventListener('dragleave', (event) => {
        const slot = event.target instanceof HTMLElement ? event.target.closest('.inventory-slot') : null;
        if (slot) {
            slot.classList.remove('drag-over');
        }
    });

    inventoryPanel.addEventListener('drop', (event) => {
        event.preventDefault();
        const slot = event.target instanceof HTMLElement ? event.target.closest('.inventory-slot') : null;
        if (!slot) {
            return;
        }
        const dropIndex = Number(slot.dataset.slotIndex);
        const temp = gameState.hero.inventory[dropIndex];
        gameState.hero.inventory[dropIndex] = gameState.hero.inventory[draggedItemIndex];
        gameState.hero.inventory[draggedItemIndex] = temp;
        drawInventory();
    });

    document.body.addEventListener('dragend', () => {
        clearDragState();
    });
}

export function isDraggingItem() {
    return Boolean(draggedItem);
}

export function updateDraggedIconPosition(x, y) {
    if (!draggedItem || !draggedIcon) {
        return;
    }
    draggedIcon.style.left = `${x - 24}px`;
    draggedIcon.style.top = `${y - 24}px`;
}
