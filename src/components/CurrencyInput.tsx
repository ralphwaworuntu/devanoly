import { useState, useEffect, ChangeEvent } from 'react';

interface CurrencyInputProps {
    value: string | number;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    required?: boolean;
    disabled?: boolean;
    autoFocus?: boolean;
    max?: number;
}

export default function CurrencyInput({
    value,
    onChange,
    placeholder = '0',
    className = '',
    required = false,
    disabled = false,
    autoFocus = false
}: CurrencyInputProps) {
    const [displayValue, setDisplayValue] = useState('');

    // Format value on mount/update
    useEffect(() => {
        if (value === '' || value === undefined || value === null) {
            setDisplayValue('');
            return;
        }

        const numVal = typeof value === 'string' ? parseInt(value) : value;
        if (!isNaN(numVal)) {
            setDisplayValue(new Intl.NumberFormat('id-ID').format(numVal));
        } else {
            setDisplayValue('');
        }
    }, [value]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;

        // Remove non-digit chars
        const cleanValue = input.replace(/\D/g, '');

        // Pass clean string to parent
        onChange(cleanValue);
    };

    return (
        <input
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
            className={`font-mono ${className}`}
            required={required}
            disabled={disabled}
            autoFocus={autoFocus}
        />
    );
}
