# Component Usage Guide

Complete reference for all components in the Tactical Command Design System.

## Table of Contents

- [Atoms](#atoms)
- [Molecules](#molecules)
- [Organisms](#organisms)
- [Advanced Components](#advanced-components)

---

## Atoms

### Button

**Import:**

```tsx
import { Button } from "@/components/ui/button";
```

**Variants:**

- `solid` - Filled with primary color
- `outline` - Border only (default)
- `ghost` - No border, hover effect only
- `destructive` - For dangerous actions

**Sizes:** `default`, `sm`, `lg`, `icon`

**Examples:**

```tsx
<Button variant="solid">Deploy Changes</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">View More</Button>
<Button variant="destructive">Delete</Button>
<Button variant="solid" size="icon"><Zap className="h-4 w-4" /></Button>
```

---

### Badge

**Import:**

```tsx
import { Badge } from "@/components/ui/badge";
```

**Variants:** `default`, `secondary`, `destructive`, `outline`, `success`

**Examples:**

```tsx
<Badge>Online</Badge>
<Badge variant="success">Active</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Draft</Badge>
```

---

### Input

**Import:**

```tsx
import { Input } from "@/components/ui/input";
```

**Examples:**

```tsx
<Input placeholder="Enter command..." />
<Input type="password" placeholder="Access code" />
<Input disabled value="Read only" />
```

---

### Slider

**Import:**

```tsx
import { Slider } from "@/components/ui/slider";
```

**Examples:**

```tsx
<Slider defaultValue={[50]} max={100} step={1} />
<Slider defaultValue={[25, 75]} max={100} step={5} />
```

---

### Switch

**Import:**

```tsx
import { Switch } from "@/components/ui/switch";
```

**Examples:**

```tsx
<div className="flex items-center space-x-2">
  <Switch id="safe-mode" />
  <label htmlFor="safe-mode">Safe Mode</label>
</div>
```

---

## Molecules

### Card

**Import:**

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
```

**Examples:**

```tsx
<Card>
  <CardHeader>
    <CardTitle>System Status</CardTitle>
  </CardHeader>
  <CardContent>
    <p>All systems operational</p>
  </CardContent>
</Card>
```

**Note:** Cards automatically have tactical bracket corners via `.panel-tech` class.

---

### Dialog (Modal)

**Import:**

```tsx
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
```

**Examples:**

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Settings</Button>
  </DialogTrigger>
  <DialogContent>
    <h2 className="text-xl font-bold text-primary mb-4">Settings</h2>
    <p>Configure your preferences here.</p>
  </DialogContent>
</Dialog>
```

---

### Select

**Import:**

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
```

**Examples:**

```tsx
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select operation..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="deploy">Deploy</SelectItem>
    <SelectItem value="scan">Scan</SelectItem>
    <SelectItem value="purge">Purge</SelectItem>
  </SelectContent>
</Select>
```

---

### Tabs

**Import:**

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
```

**Examples:**

```tsx
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">
    <p>Overview content</p>
  </TabsContent>
  <TabsContent value="settings">
    <p>Settings content</p>
  </TabsContent>
</Tabs>
```

---

### Toaster

**Import:**

```tsx
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
```

**Setup (in layout.tsx):**

```tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

**Usage:**

```tsx
import { toast } from "sonner";

// In your component
<Button onClick={() => toast.success("Changes saved!")}>Save</Button>;

// Other variants
toast.error("Failed to connect");
toast.info("Processing...");
toast.warning("Low disk space");
```

---

## Organisms

### Sidebar

**Import:**

```tsx
import { Sidebar } from "@/components/layout/sidebar";
```

**Usage:**

```tsx
// Already integrated in AdminShell
// Customize NAV_ITEMS array in sidebar.tsx to add/remove menu items
```

---

### TopBar

**Import:**

```tsx
import { TopBar } from "@/components/layout/topbar";
```

**Usage:**

```tsx
// Already integrated in AdminShell
// Customize breadcrumbs and actions in topbar.tsx
```

---

### AdminShell

**Import:**

```tsx
import AdminShell from "@/components/layout/admin-shell";
```

**Usage:**

```tsx
// In layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
```

---

## Advanced Components

### ContextMenu

**Import:**

```tsx
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu";
```

**Examples:**

```tsx
<ContextMenu>
  <ContextMenuTrigger>
    <div className="border border-border-thin p-4">Right click me</div>
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Edit</ContextMenuItem>
    <ContextMenuItem>Duplicate</ContextMenuItem>
    <ContextMenuItem>Delete</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

---

### Tooltip

**Import:**

```tsx
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
```

**Examples:**

```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="outline" size="icon">
        ?
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Help documentation</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

### ScrollArea

**Import:**

```tsx
import { ScrollArea } from "@/components/ui/scroll-area";
```

**Examples:**

```tsx
<ScrollArea className="h-[400px] w-full">
  <div className="p-4">{/* Long content here */}</div>
</ScrollArea>
```

---

## Styling Guidelines

### Using CSS Variables

**Always use CSS variables for colors:**

```tsx
// ✅ CORRECT
<div className="bg-bg-panel text-foreground border-border-thin">

// ❌ WRONG
<div className="bg-white text-black border-gray-200">
```

### Custom Utility Classes

**`.panel-tech`** - Adds tactical bracket corners:

```tsx
<div className="panel-tech p-4">Content with bracket corners</div>
```

**`.btn-command`** - Base button styling (used internally):

```tsx
// Don't use directly, use <Button> component instead
```

### Theme-Aware Components

All components automatically adapt to the current theme. No additional code needed:

```tsx
// This works in both light and dark themes
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-muted-foreground">Description</p>
  </CardContent>
</Card>
```

---

## Common Patterns

### Form with Validation

```tsx
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function MyForm() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validation logic
    toast.success("Form submitted!");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs uppercase text-muted-foreground font-bold">
          Name
        </label>
        <Input placeholder="Enter name..." />
      </div>
      <Button type="submit" variant="solid">
        Submit
      </Button>
    </form>
  );
}
```

### Modal Confirmation

```tsx
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function DeleteConfirmation() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </DialogTrigger>
      <DialogContent>
        <h2 className="text-xl font-bold text-primary mb-4">Confirm Delete</h2>
        <p className="text-muted-foreground mb-6">
          Are you sure you want to delete this item?
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline">Cancel</Button>
          <Button variant="destructive">Delete</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Tabbed Interface

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

function TabbedPanel() {
  return (
    <Tabs defaultValue="general">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="advanced">Advanced</TabsTrigger>
      </TabsList>
      <TabsContent value="general">
        <Card>
          <CardContent>General settings</CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="advanced">
        <Card>
          <CardContent>Advanced settings</CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
```

---

## Best Practices

1. **Always use CSS variables** - Never hard-code colors
2. **Test both themes** - Verify components in light and dark modes
3. **Use semantic HTML** - Proper labels, ARIA attributes
4. **Keep components small** - Single responsibility principle
5. **Reuse existing components** - Don't reinvent the wheel
6. **Follow naming conventions** - Use descriptive, consistent names
7. **Add to Kitchen Sink** - Test new components in `/design` page
