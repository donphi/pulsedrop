// components/ui/Checkbox.tsx
import React from 'react';

interface CheckboxProps {
  id: string;
  label: React.ReactNode;
  required?: boolean;
  checked?: boolean;
  onChange?: (id: string, checked: boolean) => void;
}

export function Checkbox({ id, label, required, checked, onChange }: CheckboxProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="checkbox"
        required={required}
        checked={checked}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange?.(id, e.target.checked)}
        className="h-4 w-4 rounded border-primary-muted bg-card text-primary focus:ring-primary"
      />
      <label htmlFor={id} className="text-sm text-foreground">
        {label}
      </label>
    </div>
  );
}