import confetti from 'canvas-confetti';

let shapes: confetti.Shape[] | null = null;

function snowShapes(): confetti.Shape[] {
    shapes ??= ['❄️', '✨', '🧊'].map((text) =>
        confetti.shapeFromText({ text, scalar: 2 }),
    );

    return shapes;
}

/**
 * A short flurry of snowflakes, used when something lands in the freezer.
 */
export function celebrate(
    origin: { x: number; y: number } = { x: 0.5, y: 0.35 },
): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    const defaults = {
        origin,
        shapes: snowShapes(),
        scalar: 2,
        ticks: 140,
        gravity: 0.7,
        decay: 0.93,
        zIndex: 9999,
    };

    void confetti({
        ...defaults,
        particleCount: 26,
        spread: 70,
        startVelocity: 32,
    });
    void confetti({
        ...defaults,
        particleCount: 14,
        spread: 120,
        startVelocity: 22,
        scalar: 1.4,
    });
}
