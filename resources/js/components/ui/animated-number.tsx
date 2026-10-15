import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect } from 'react';

/**
 * Counts smoothly from the previous value to the new one.
 */
export function AnimatedNumber({ value, className, duration = 0.9 }: { value: number; className?: string; duration?: number }) {
    const motionValue = useMotionValue(0);
    const display = useTransform(motionValue, (latest) => Math.round(latest).toLocaleString('fr-FR'));

    useEffect(() => {
        const controls = animate(motionValue, value, { duration, ease: [0.16, 1, 0.3, 1] });

        return () => controls.stop();
    }, [value, duration, motionValue]);

    return <motion.span className={className}>{display}</motion.span>;
}

/**
 * Digit that slides vertically when it changes, like a flip counter.
 */
export function RollingNumber({ value, className }: { value: number; className?: string }) {
    return (
        <span className={className} style={{ display: 'inline-flex', overflow: 'hidden', position: 'relative' }}>
            <motion.span
                key={value}
                initial={{ y: '-60%', opacity: 0, filter: 'blur(4px)' }}
                animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                style={{ display: 'inline-block' }}
            >
                {value}
            </motion.span>
        </span>
    );
}
