"use client";

import { useRef, useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  large?: boolean;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search by name, skill, or specialization…",
  large = false,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  // Ctrl+K / Cmd+K — keep the shortcut, just remove the visible chip
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative w-full group">
      {/* Search icon — rotates slightly on focus */}
      <div
        className="absolute top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-200"
        style={{
          left: large ? "1rem" : "0.875rem",
          color: focused ? "#2d6060" : "#9a8e82",
          transform: `translateY(-50%) rotate(${focused ? "15deg" : "0deg"})`,
        }}
      >
        <Search size={large ? 20 : 17} />
      </div>

      <input
        ref={inputRef}
        id="global-search"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full outline-none transition-all duration-200"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: large ? "1rem" : "0.875rem",
          fontWeight: 400,
          color: "#1a1a1a",
          background: "#fff9e0",
          paddingLeft: large ? "3rem" : "2.625rem",
          paddingRight: value ? "2.5rem" : "1rem",
          paddingTop: large ? "1rem" : "0.75rem",
          paddingBottom: large ? "1rem" : "0.75rem",
          border: "none",
          borderBottom: focused
            ? "2px solid #2d6060"
            : "2px solid rgba(45,96,96,0.25)",
          borderRadius: 0,
          boxShadow: focused
            ? "0 2px 0 0 #2d6060, inset 0 1px 3px rgba(45,96,96,0.04)"
            : "none",
          // Reserve space for bottom border so there's no layout shift
          borderTop: "2px solid transparent",
          borderLeft: "2px solid transparent",
          borderRight: "2px solid transparent",
        }}
      />

      {/* Clear button */}
      <AnimatePresence>
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.12 }}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-all"
            style={{
              width: large ? "28px" : "22px",
              height: large ? "28px" : "22px",
              background: "rgba(45,96,96,0.10)",
              color: "#2d6060",
            }}
            onClick={() => { onChange(""); inputRef.current?.focus(); }}
            aria-label="Clear search"
            type="button"
          >
            <X size={12} strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
