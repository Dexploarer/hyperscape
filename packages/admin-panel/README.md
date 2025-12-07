# Hyperscape Admin Panel

**Tactical Command Design System** - A Next.js 15 admin interface for managing the Hyperscape game.

## Quick Start

```bash
cd packages/admin-panel
bun install
bun run dev  # Runs on http://localhost:3405
```

## Tech Stack (Dec 2025 Standards)

- **Framework**: Next.js 15 (App Router)
- **React**: 19.0.0
- **Styling**: Tailwind CSS 4.0 with CSS Variables
- **UI Primitives**: Radix UI
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **Package Manager**: Bun

## Design System

### Themes

**Royal Command (Light)**

- Cream backgrounds
- Deep Sapphire primary
- Silver borders

**Shadow Ops (Dark)**

- Charcoal backgrounds
- Deep Ruby primary
- Gold accents

Toggle between themes using the switch in the sidebar footer.

### Core Principles

1. **Zero Hard-Coded Colors** - All colors use CSS variables
2. **Modular Components** - Atomic design (Atoms → Molecules → Organisms)
3. **Tactical Aesthetic** - Thin borders, bracket corners, technical typography
4. **Theme-Aware** - All components adapt to light/dark themes

## Project Structure

```
packages/admin-panel/
├── app/
│   ├── layout.tsx          # Root layout with AdminShell
│   ├── page.tsx            # Dashboard
│   ├── design/             # Kitchen Sink verification
│   └── globals.css         # CSS Variables & Theme
├── src/
│   ├── components/
│   │   ├── ui/             # Atomic components
│   │   └── layout/         # Sidebar, TopBar, AdminShell
│   └── lib/
│       └── cn.ts           # Utility for className merging
└── docs/
    ├── DESIGN_SYSTEM.md    # Complete design tokens
    ├── CSS_VARIABLES.md    # Variable reference
    └── COMPONENTS.md       # Component usage guide
```

## Documentation

- **[Design System](./docs/DESIGN_SYSTEM.md)** - Color tokens, typography, effects
- **[CSS Variables](./docs/CSS_VARIABLES.md)** - Complete variable reference
- **[Components](./docs/COMPONENTS.md)** - Usage examples for all components
- **[Implementation Plan](./docs/IMPLEMENTATION_PLAN.md)** - Phased development roadmap

## Component Library

### Atoms

`Button`, `Badge`, `Input`, `Slider`, `Switch`

### Molecules

`Card`, `Dialog`, `Toaster`, `Select`, `Tabs`

### Organisms

`Sidebar`, `TopBar`, `AdminShell`

### Advanced

`ContextMenu`, `Tooltip`, `ScrollArea`

See [COMPONENTS.md](./docs/COMPONENTS.md) for detailed usage.

## Development

### Kitchen Sink

Visit `/design` to see all components in action and verify the design system.

### Adding New Components

1. Create in `src/components/ui/`
2. Use CSS variables only (no hard-coded colors)
3. Follow existing patterns (CVA for variants)
4. Add to Kitchen Sink for verification

### Theme System

Themes are controlled via `data-theme` attribute:

```tsx
// Toggle theme
document.documentElement.setAttribute("data-theme", "dark");
document.documentElement.removeAttribute("data-theme"); // light
```

All CSS variables automatically switch when theme changes.

## Authentication

Currently **no auth system** - all users are treated as Super Admins (Level 5 Clearance). Auth will be added before production deployment.

## Next Steps (Phases)

- [x] **Phase 1**: Foundation & Component Library
- [ ] **Phase 2**: Manifest Engine (Zod schemas, Server Actions)
- [ ] **Phase 3**: Visual World Editor (@xyflow/react)
- [ ] **Phase 4**: Global Controls & Configuration
- [ ] **Phase 5**: Server Integration & Hot Reload

See [IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md) for details.

## Contributing

When adding features:

1. Use only CSS variables for colors
2. Follow Atomic Design principles
3. Test in both light and dark themes
4. Update Kitchen Sink with new components
5. Document in appropriate docs/ file
