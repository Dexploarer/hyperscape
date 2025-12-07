# CSS Variable Reference - Tactical Command Design System

## Overview

All colors and design tokens are defined as CSS variables in `app/globals.css`. **No hard-coded colors should exist in components.**

## Theme System

The design system supports two themes via the `data-theme` attribute:

- **Default (Light)**: Royal Command
- **`data-theme="dark"`**: Shadow Ops

## Complete Variable Reference

### Background Colors

```css
--bg-app          /* Main application background */
--bg-panel        /* Panel/card backgrounds */
```

### Primary Colors

```css
--color-primary              /* Main brand color (Sapphire/Ruby) */
--color-primary-fg           /* Text on primary backgrounds */
--color-secondary            /* Secondary accent */
--color-accent               /* Tertiary accent (Gold) */
```

### Borders

```css
--border-thin     /* 1px borders, dividers */
--border-strong   /* Emphasized borders, active states */
```

### Text Colors

```css
--foreground              /* Primary text color */
--muted-foreground        /* Secondary/disabled text */
```

### State Colors

```css
--color-destructive           /* Error/warning states */
--color-destructive-foreground /* Text on destructive backgrounds */
```

### Typography

```css
--font-mono       /* Monospace font family */
```

## Tailwind Utility Mapping

### Backgrounds

- `bg-bg-app` → `var(--bg-app)`
- `bg-bg-panel` → `var(--bg-panel)`
- `bg-primary` → `var(--color-primary)`
- `bg-secondary` → `var(--color-secondary)`
- `bg-accent` → `var(--color-accent)`
- `bg-destructive` → `var(--color-destructive)`

### Text

- `text-foreground` → `var(--foreground)`
- `text-muted-foreground` → `var(--muted-foreground)`
- `text-primary` → `var(--color-primary)`
- `text-primary-foreground` → `var(--color-primary-fg)`
- `text-destructive-foreground` → `var(--color-destructive-foreground)`

### Borders

- `border-border-thin` → `var(--border-thin)`
- `border-border-strong` → `var(--border-strong)`
- `border-primary` → `var(--color-primary)`

## Custom Utility Classes

### `.panel-tech`

Creates tactical bracket corners on panels:

```tsx
<div className="panel-tech">{/* Content */}</div>
```

### `.btn-command`

Base button styling (used internally by Button component):

```tsx
<button className="btn-command">{/* Content */}</button>
```

## Theme Values

### Royal Command (Light)

| Variable              | Value                 | Description     |
| --------------------- | --------------------- | --------------- |
| `--bg-app`            | `oklch(96% 0.01 90)`  | Cream           |
| `--bg-panel`          | `oklch(93% 0.01 90)`  | Silver          |
| `--color-primary`     | `oklch(25% 0.1 260)`  | Deep Sapphire   |
| `--color-secondary`   | `oklch(60% 0.05 260)` | Muted Sapphire  |
| `--color-accent`      | `oklch(85% 0.1 85)`   | Gold            |
| `--border-thin`       | `oklch(85% 0.02 90)`  | Thin Silver     |
| `--border-strong`     | `oklch(25% 0.1 260)`  | Strong Sapphire |
| `--color-destructive` | `oklch(55% 0.2 25)`   | Warning Red     |

### Shadow Ops (Dark)

| Variable              | Value                 | Description          |
| --------------------- | --------------------- | -------------------- |
| `--bg-app`            | `oklch(15% 0.02 260)` | Charcoal             |
| `--bg-panel`          | `oklch(20% 0.02 260)` | Lighter Charcoal     |
| `--color-primary`     | `oklch(45% 0.15 30)`  | Deep Ruby            |
| `--color-secondary`   | `oklch(75% 0.15 85)`  | Gold                 |
| `--border-thin`       | `oklch(30% 0 0)`      | Dark Silver          |
| `--border-strong`     | `oklch(45% 0.15 30)`  | Ruby Border          |
| `--color-destructive` | `oklch(60% 0.2 25)`   | Brighter Warning Red |

## Usage Examples

### Component with Theme-Aware Colors

```tsx
// ✅ CORRECT - Uses CSS variables
<div className="bg-bg-panel border border-border-thin text-foreground">
  <h2 className="text-primary">Title</h2>
  <p className="text-muted-foreground">Description</p>
</div>

// ❌ WRONG - Hard-coded colors
<div className="bg-white border border-gray-200 text-black">
  <h2 className="text-blue-600">Title</h2>
  <p className="text-gray-500">Description</p>
</div>
```

### Using Shadow Values

```tsx
// For custom shadows that match the theme
<div className="shadow-[0_0_10px_var(--color-primary)]">Glowing effect</div>
```

## Adding New Colors

If you need to add a new color:

1. Add it to both `:root` and `[data-theme="dark"]` in `globals.css`
2. Document it in this reference
3. Use semantic names (e.g., `--color-success` not `--color-green`)
4. Ensure it works in both light and dark themes
