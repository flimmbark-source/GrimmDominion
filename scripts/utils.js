export function distance(ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    return Math.sqrt(dx * dx + dy * dy);
}

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function isPointInRect(point, rect) {
    const pointX = point.x + (point.width ? point.width / 2 : 0);
    const pointY = point.y + (point.height ? point.height / 2 : 0);
    return pointX >= rect.x && pointX <= rect.x + rect.width && pointY >= rect.y && pointY <= rect.y + rect.height;
}
