"use client";

import { useState, useRef, useEffect } from "react";
import { GlassPanel } from "./glass-panel";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  label?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Select option...",
  label,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="w-full flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center justify-between w-full h-10 px-3 py-2 rounded-md border border-glass-border bg-black/20 text-sm text-left transition-all",
            "focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50",
            isOpen && "border-neon-blue ring-1 ring-neon-blue/50",
          )}
        >
          <span className={!selectedOption ? "text-gray-500" : "text-white"}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-gray-400 transition-transform",
              isOpen && "transform rotate-180",
            )}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <div className="absolute z-50 w-full mt-1">
              <GlassPanel
                intensity="high"
                className="py-1 max-h-60 overflow-auto custom-scrollbar"
              >
                {options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-2 text-sm text-left hover:bg-white/10 transition-colors",
                      option.value === value
                        ? "text-neon-blue bg-neon-blue/5"
                        : "text-gray-300",
                    )}
                  >
                    {option.label}
                    {option.value === value && (
                      <Check className="w-4 h-4 text-neon-blue" />
                    )}
                  </button>
                ))}
              </GlassPanel>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
