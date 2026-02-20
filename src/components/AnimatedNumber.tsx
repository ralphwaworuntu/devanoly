import { useState, useEffect, useRef } from 'react';

interface AnimatedNumberProps {
    value: number;
    duration?: number;
    formatter?: (value: number) => string;
    className?: string;
}

export default function AnimatedNumber({
    value,
    duration = 800,
    formatter = (v) => v.toLocaleString('id-ID'),
    className = ''
}: AnimatedNumberProps) {
    const [displayValue, setDisplayValue] = useState(value);
    const prevValueRef = useRef(value);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        const startValue = prevValueRef.current;
        const endValue = value;
        const diff = endValue - startValue;

        if (diff === 0) return;

        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = startValue + diff * eased;

            setDisplayValue(current);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                setDisplayValue(endValue);
                prevValueRef.current = endValue;
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [value, duration]);

    return (
        <span className={`tabular-nums transition-colors duration-300 ${className}`}>
            {formatter(Math.round(displayValue))}
        </span>
    );
}
