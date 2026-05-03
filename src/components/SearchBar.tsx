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
  placeholder = "Search by name, email, or skill...",
  large = false,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  // Ctrl+K / Cmd+K global shortcut
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

  const showShortcut = !focused && !value;

  return (
    <div className="relative w-full group">
      {/* Search icon */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${
          focused ? "text-primary" : "text-muted-foreground"
        } ${large ? "left-5" : "left-4"}`}
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
        className={`w-full text-foreground placeholder-muted-foreground/60 outline-none transition-all duration-300 ${
          large ? "pl-14 pr-32 py-4 text-base rounded-md" : "pl-11 pr-24 py-3 text-sm rounded-md"
        }`}
        style={{
          background: "var(--color-card)",
          border: focused
            ? "1.5px solid var(--color-primary)"
            : "1.5px solid rgba(60,50,30,0.14)",
          boxShadow: focused
            ? "0 0 0 3px rgba(90,121,133,0.12), 1px 1px 0 rgba(60,50,30,0.08)"
            : "1px 1px 0 rgba(60,50,30,0.06)",
        }}
      />

      {/* Right side: keyboard shortcut OR clear button */}
      <div
        className={`absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 ${
          large ? "mr-4" : "mr-3"
        }`}
      >
        {/* Typewriter shortcut keys */}
        <AnimatePresence>
          {showShortcut && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.15 }}
              className="hidden sm:flex items-center gap-1 pointer-events-none"
            >
              <span className="typewriter-key">
                {typeof navigator !== "undefined" && navigator.platform.includes("Mac") ? "⌘" : "Ctrl"}
              </span>
              <span className="typewriter-key">K</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clear button */}
        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.15 }}
              className={`flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-all ${
                large ? "w-7 h-7" : "w-6 h-6"
              }`}
              style={{ background: "rgba(60,50,30,0.07)" }}
              onClick={() => { onChange(""); inputRef.current?.focus(); }}
              aria-label="Clear search"
              type="button"
            >
              <X size={13} strokeWidth={2.5} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
