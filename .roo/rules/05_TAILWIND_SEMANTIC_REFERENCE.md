# Tailwind Semantic Class Reference

This document defines the **only allowed Tailwind utility classes** for styling within this project.

All values map directly to CSS variables defined in `globals.css` and are configured in `tailwind.config.js`.

## ✅ Allowed Semantic Utility Classes

### 🎨 Backgrounds (`bg-*`)
- `bg-background`
- `bg-card`
- `bg-primary`
- `bg-primary-muted`
- `bg-primary-muted-opacity`
- `bg-secondary`
- `bg-secondary-muted`
- `bg-accent`
- `bg-neutral`
- `bg-overlay`
- `bg-hero-gradient` *(custom gradient class)*

### 🎨 Text (`text-*`)
- `text-foreground`
- `text-cardForeground`
- `text-mutedText`
- `text-primary`
- `text-secondary`
- `text-error`
- `text-success`
- `text-warning`
- `text-info`

### 🔲 Borders (`border-*`)
- `border-primary`
- `border-primary-muted`
- `border-neutral`
- `border-neutral-muted`
- `border-error`
- `border-accent`

### 🔔 Ring (`ring-*`)
- `ring-primary`
- `ring-primary-muted`
- `ring-neutral`
- `ring-overlay`
- `ring-inset`
- `ring-white`
- `ring-black/10`

### 💠 Shadow (`shadow-*`)
- `shadow-button`
- `shadow-card`
- `shadow-dialog`

### 📏 Radius (`rounded-*`)
- `rounded`
- `rounded-sm`
- `rounded-md`
- `rounded-lg`
- `rounded-xl`
- `rounded-full`
- `rounded-3xl` *(if theme provides it)*

### 🧠 Other Utility Classes (Completely Allowed)
- All `p-*`, `m-*`, `gap-*`
- All `flex`, `inline-*`, `grid-cols-*`, `block`, `w-*`, `h-*`
- All `max-w-*`, `min-w-*`, `max-h-*`, `min-h-*`
- All responsive variants: `sm:*`, `md:*`, `lg:*`, `xl:*`, `2xl:*`
- All states: `hover:*`, `focus:*`, `focus-visible:*`, `dark:*`
- All transitions and timing: `transition-*`, `ease-*`, `duration-*`

---

## ❌ Forbidden: Hardcoded Tailwind Colors

You **may not use**:
- `bg-gray-*`, `text-gray-*`, `border-gray-*`
- `bg-indigo-*`, `bg-blue-*`, `bg-white`, `text-black`
- `bg-[#hex]`, `text-[#hex]`, `ring-[#hex]`
- Any direct Tailwind color utilities not defined as semantic variables

---

## 🧩 Notes
- If a class is missing from Tailwind's generated output, ensure it's included in your `tailwind.config.js` or `globals.css`.
- Semantic classes are enforced by ESLint and must be used for all color-related styling.

---
