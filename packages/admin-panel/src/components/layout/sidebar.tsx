"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Map as MapIcon,
  Database,
  HardDrive,
  Settings,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const NAV_ITEMS = [
  { label: "Overview", icon: LayoutDashboard, href: "/" },
  { label: "World Editor", icon: MapIcon, href: "/world" },
  { label: "Database", icon: Database, href: "/database" },
  { label: "Assets / CDN", icon: HardDrive, href: "/cdn" },
  { label: "Configuration", icon: Settings, href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 border-r border-border-thin bg-bg-panel flex flex-col h-full z-20 relative">
      {/* Decorative Top Line */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-border-thin bg-bg-app/50 space-x-3">
        <div className="h-4 w-4 border border-primary rotate-45 flex items-center justify-center">
          <div className="h-2 w-2 bg-primary" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold tracking-[0.2em] text-primary text-xs uppercase">
            Hyperscape
          </span>
          <span className="text-[10px] text-muted-foreground tracking-widest uppercase">
            Command // v2.0
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 py-6 px-4 space-y-2">
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-4 pl-2 border-l border-primary/20">
          System Modules
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="block group">
              <div
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium transition-all duration-200 border-l-2",
                  isActive
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-bg-app hover:border-border-thin",
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-4 w-4",
                    isActive
                      ? "text-primary"
                      : "opacity-70 group-hover:opacity-100",
                  )}
                />
                <span className="tracking-wide uppercase text-xs">
                  {item.label}
                </span>
                {isActive && (
                  <div className="ml-auto w-1 h-1 bg-primary rounded-full shadow-[0_0_5px_var(--color-primary)]" />
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-border-thin bg-bg-app/50 space-y-4">
        <ThemeToggle />
        <div className="flex items-center gap-3 panel-tech p-3 bg-bg-app">
          <div className="h-8 w-8 bg-primary/10 border border-primary flex items-center justify-center text-primary font-bold text-xs">
            OP
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-foreground tracking-widest uppercase">
              Admin
            </span>
            <span className="text-[10px] text-muted-foreground">
              Level 5 Clearance
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
