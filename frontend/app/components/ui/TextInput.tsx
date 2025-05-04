// components/ui/TextInput.tsx
import React from 'react';

interface TextInputProps {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  value?: string;
  onChange?: (id: string, value: string) => void;
}

export function TextInput({
  id,
  label,
  type = 'text',
  required = false,
  autoComplete = '',
  value = '',
  onChange,
}: TextInputProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange?.(id, e.target.value)}
        className="mt-2 block w-full rounded-md bg-card px-3 py-1.5 text-foreground shadow-button outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}