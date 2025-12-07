"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export function TopBar() {
  return (
    <header className="h-16 border-b border-glass-border bg-bg-void/50 backdrop-blur flex items-center justify-between px-6 z-10">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-neon-primary">Home</span>
        <span>/</span>
        <span className="text-foreground">Dashboard</span>
      </div>

      <div className="flex items-center gap-4">
        <Badge variant="success" className="gap-1 animate-pulse">
          <div className="h-1.5 w-1.5 rounded-full bg-current" />
          Server Online
        </Badge>

        <Button variant="solid" size="sm" className="gap-2">
          <Zap className="h-3 w-3" />
          Deploy Changes
        </Button>
      </div>
    </header>
  );
}
