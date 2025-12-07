import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  icon: ReactNode;
  label: string;
  href: string;
  isActive?: boolean;
}

export function SidebarItem({ icon, label, href, isActive }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
        "hover:bg-white/5",
        isActive
          ? "text-neon-blue bg-neon-blue/10 border-l-2 border-neon-blue"
          : "text-gray-400 border-l-2 border-transparent",
      )}
    >
      <span
        className={cn(
          "transition-colors group-hover:text-white",
          isActive ? "text-neon-blue" : "text-gray-400",
        )}
      >
        {icon}
      </span>
      <span className="text-sm font-medium tracking-wide group-hover:text-white">
        {label}
      </span>
      {/* Glow effect on hover */}
      {isActive && (
        <div className="absolute left-0 w-1 h-8 bg-neon-blue shadow-[0_0_15px_#00f3ff] rounded-r-full" />
      )}
    </Link>
  );
}
