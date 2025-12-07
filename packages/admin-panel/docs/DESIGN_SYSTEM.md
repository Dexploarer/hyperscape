# Command Design System & Component Library

> [!IMPORTANT] > **Aesthetic Update**: "Tactical Command". Thin lines, gradients, bracket corners.
> **Themes**:
>
> 1. **Light (Default)**: Cream, Silver, Deep Sapphire.
> 2. **Dark**: Charcoal, Silver, Gold, Deep Ruby.

## 1. Design Tokens (Tailwind 4.0 Theme)

### Theme 1: Royal Command (Light)

- `--bg-app`: `oklch(96% 0.01 90)` (Cream)
- `--bg-panel`: `oklch(93% 0.01 90)` (Darker Cream/Silver)
- `--color-primary`: `oklch(25% 0.1 260)` (Deep Sapphire)
- `--color-accent`: `oklch(60% 0.05 260)` (Muted Sapphire)
- `--border-thin`: `oklch(80% 0.02 90)` (Silver Line)

### Theme 2: Shadow Ops (Dark)

- `--bg-app`: `oklch(15% 0.02 260)` (Dark Charcoal)
- `--bg-panel`: `oklch(20% 0.02 260)` (Lighter Charcoal)
- `--color-primary`: `oklch(45% 0.15 30)` (Deep Ruby)
- `--color-secondary`: `oklch(75% 0.15 85)` (Burnished Gold)
- `--border-thin`: `oklch(30% 0 0)` (Dark Silver Line)

### Shared Typography & Effects

- **Font**: `Geist Mono` or `Rajdhani` (Tech/Tactical).
- **Lines**: 1px borders, often creating "bracket" shapes `[ ]`.
- **Gradients**: Subtle linear gradients on panels.

---

## 2. Component Inventory

### 2.1 Atoms (Primitives)

Basic building blocks that cannot be broken down further.

1.  **`Button`**
    - **Style**: Sharp corners, 1px border.
    - **States**: Hover fills the solid color.
2.  **`Input`**
    - **Style**: Bottom border only (underlined) or thin full box.
3.  **`Label`**
    - **Style**: Uppercase, reduced opacity text, `text-xs`.
4.  **`Badge`**
    - **Style**: Rectangular with tech markings `//`.
    * **Usage**: Status (Online/Offline), Counts.
5.  **`IconBox`**
    - **Style**: Square container, centered icon, glass bg.
6.  **`Switch`** (Toggle)
    - **Style**: iOS style but rectangular/cyber, neon active state.
7.  **`Slider`**
    - **Style**: Thin track, glowing neon thumb. Use `radix-ui/react-slider` logic.
8.  **`Spinner`**
    - **Style**: Rotating neon ring using SVG.

### 2.2 Molecules (Combinations)

Combinations of atoms functioning together.

9.  **`StatCard`**
    - **Composition**: `IconBox` + `Label` + Value Text.
    - **Style**: Glass card with hover lift effect.
10. **`SearchBar`**
    - **Composition**: Search Icon + `Input` + cmd-k `Badge`.
11. **`Toast`**
    - **Composition**: Icon + Title + Description + Close `Button`.
    - **Style**: Floating glass panel, slides in from corner.
12. **`ConfirmDialog`** (Modal)
    - **Composition**: Backdrop + Content Card + Title + Description + Action `Button`s.
13. **`Field`**
    - **Composition**: `Label` + (`Input` | `Switch` | `Slider`) + ErrorText.

### 2.3 Organisms (Complex Structures)

Complex standalone sections of the interface.

14. **`Sidebar`**
    - **Composition**: Logo area + Navigation Menu (list of `Button`s) + User Profile.
    - **Behavior**: Collapsible.
15. **`TopBar`**
    - **Composition**: Breadcrumbs + Spacer + Server Status `Badge` + Deploy `Button`.
16. **`CanvasToolbar`**
    - **Composition**: Floating glass pill + array of `IconBox` tools (Pan, Select, Add Node).
17. **`DataTable`**
    - **Composition**: Header Row + List of Data Rows (`Button` actions per row).
    - **Style**: Striped glass effect.

### 2.4 Editor Components (Specialized)

Specific to the Node/Game Editor.

18. **`NodeShell`**
    - **Style**: The container for any graph node. Glass border + specific "Handle" connection points.
19. **`PropPanel`**
    - **Style**: Slide-over panel on the right side for editing Node properties.
20. **`MiniMap`**
    - **Style**: `xyflow` MiniMap styled with `--bg-void` and neon pointers.

---

## 3. Implementation Application

**Developer Rule**: When implementing a feature (e.g., Water Level Control):

1.  Do NOT write `<input type="range" className="..." />`.
2.  DO import `{ Slider }` from `@/components/ui/slider`.
3.  DO import `{ Card }` from `@/components/ui/card`.
4.  Compose them: `<Card><Slider /></Card>`.
