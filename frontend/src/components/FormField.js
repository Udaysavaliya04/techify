import React from 'react';

export default function FormField({
    id,
    name,
    type,
    label,
    value,
    onChange,
    placeholder,
    error,
    autoComplete
}) {
    return (
        <div>
            <label htmlFor={id} style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: 'hsl(var(--foreground))',
                marginBottom: '0.5rem'
            }}>
                {label}
            </label>
            <input
                id={id}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`input ${error ? 'error' : ''}`}
                autoComplete={autoComplete}
            />
            {error && (
                <p style={{
                    color: 'hsl(var(--destructive))',
                    fontSize: '0.75rem',
                    margin: '0.25rem 0 0 0'
                }}>
                    {error}
                </p>
            )}
        </div>
    );
}
