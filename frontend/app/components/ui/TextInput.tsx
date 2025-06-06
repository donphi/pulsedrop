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
        className="mt-2 block w-full rounded bg-card px-3 py-2 text-foreground outline-none ring-1 ring-inset ring-neutral-muted focus:ring-2 focus:ring-primary transition-all"
      />
    </div>
  );
}