// components/ui/Dropdown.tsx
import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

interface DropdownProps {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  onChange?: (value: string) => void;
  value?: string;
}

export function Dropdown({ id, label, options, onChange, value }: DropdownProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="mt-2 block w-full rounded-md bg-card px-3 py-1.5 text-foreground shadow-button outline-none focus:ring-2 focus:ring-primary appearance-none"
      >
        <option value="">Select an option</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDownIcon className="absolute right-3 top-3 h-5 w-5 text-neutral" />
    </div>
  );
}
