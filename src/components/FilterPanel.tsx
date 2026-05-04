"use client";

import { Student } from "@/types/student";
import { useMemo } from "react";
import { X, ChevronDown, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FilterPanelProps {
  students: Student[];
  filters: { specialization: string; group: string; expertise: string };
  onFilterChange: (key: string, value: string) => void;
  onClear: () => void;
}

function unique(arr: string[]): string[] {
  return Array.from(new Set(arr.filter(Boolean))).sort();
}

function getSpecPillStyle(spec: string, active: boolean) {
  const s = spec.toUpperCase();
  if (s.includes("AIML") || s.includes("AI")) return {
    bg: active ? "#2d6060" : "transparent",
    color: active ? "#fff" : "#2d6060",
    border: "#2d6060",
    bottomBar: "#2d6060",
  };
  if (s.includes("FSD") || s.includes("FULL")) return {
    bg: active ? "#c98a20" : "transparent",
    color: active ? "#fff" : "#c98a20",
    border: "#e8a830",
    bottomBar: "#e8a830",
  };
  return {
    bg: active ? "#b56060" : "transparent",
    color: active ? "#fff" : "#b56060",
    border: "#e8a0a0",
    bottomBar: "#e8a0a0",
  };
}

interface StyledSelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  allLabel: string;
}

function StyledSelect({ label, value, onChange, options, allLabel }: StyledSelectProps) {
  const isActive = !!value;
  return (
    <div>
      <label className="label-caps mb-2 block" style={{ color: isActive ? "#2d6060" : "#6b5e4e" }}>
        {label}
        {isActive && <span className="ml-2 inline-flex items-center justify-center w-1.5 h-1.5 rounded-full" style={{ background: "#2d6060" }} />}
      </label>
      <div className="relative">
        <select
          className="w-full appearance-none px-4 py-2.5 text-sm outline-none transition-all duration-200 cursor-pointer"
          style={{
            fontFamily: "var(--font-sans)",
            background: isActive ? "rgba(45,96,96,0.05)" : "#fff9e0",
            border: `1.5px solid ${isActive ? "rgba(45,96,96,0.35)" : "rgba(232,168,48,0.40)"}`,
            borderRadius: "3px",
            color: isActive ? "#2d6060" : "#1a1a1a",
            boxShadow: "1px 1px 0 rgba(45,96,96,0.06)",
          }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{allLabel}</option>
          {options.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <ChevronDown size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: isActive ? "#2d6060" : "#9a8e82" }} />
      </div>
      <AnimatePresence>
        {isActive && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-sm w-fit" style={{ background: "#fff9e0", border: "1px solid rgba(232,168,48,0.35)" }}>
              <span className="text-[10px] font-bold truncate max-w-[140px]" style={{ color: "#8a6820", fontFamily: "var(--font-sans)" }}>{value}</span>
              <button onClick={() => onChange("")} aria-label={`Remove ${label} filter`} style={{ color: "#e8a830" }}><X size={10} strokeWidth={3} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FilterPanel({ students, filters, onFilterChange, onClear }: FilterPanelProps) {
  const specializations = useMemo(() => unique(students.map((s) => s.specialization.trim())), [students]);
  const groups = useMemo(() => unique(students.map((s) => s.group.trim())), [students]);
  const allSkills = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => s.expertise.forEach((e) => e && set.add(e.trim())));
    return Array.from(set).sort();
  }, [students]);

  const activeCount = [filters.specialization, filters.group, filters.expertise].filter(Boolean).length;

  return (
    <div className="p-6" style={{ background: "#faf8f3", border: "2px solid rgba(232,168,48,0.25)", borderRadius: "6px", boxShadow: "0 4px 16px rgba(45,96,96,0.06)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="flex items-center gap-2 font-bold text-sm" style={{ fontFamily: "var(--font-display)", color: "#1a1a1a" }}>
          <Filter size={15} style={{ color: "#2d6060" }} />
          Filters
          <AnimatePresence>
            {activeCount > 0 && (
              <motion.span initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 400, damping: 20 }} className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-black" style={{ background: "#2d6060" }}>
                {activeCount}
              </motion.span>
            )}
          </AnimatePresence>
        </h2>
        {activeCount > 0 && (
          <button onClick={onClear} className="text-xs font-semibold flex items-center gap-1 transition-colors" style={{ color: "#9a8e82", fontFamily: "var(--font-sans)" }}>
            Clear all <X size={11} strokeWidth={2.5} />
          </button>
        )}
      </div>

      <div className="perf-divider mb-5" />

      {/* Specialization — tab pills */}
      <div className="mb-5">
        <p className="label-caps mb-2" style={{ color: filters.specialization ? "#2d6060" : "#6b5e4e" }}>Specialization</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onFilterChange("specialization", "")}
            className="px-3 py-1.5 rounded-sm text-xs font-semibold transition-all duration-200 relative"
            style={{
              fontFamily: "var(--font-sans)",
              background: !filters.specialization ? "rgba(45,96,96,0.10)" : "transparent",
              color: !filters.specialization ? "#2d6060" : "#6b5e4e",
              border: "1.5px solid rgba(45,96,96,0.20)",
              borderBottom: !filters.specialization ? "3px solid #2d6060" : "3px solid transparent",
            }}
          >
            All
          </button>
          {specializations.map((spec) => {
            const active = filters.specialization === spec;
            const ps = getSpecPillStyle(spec, active);
            return (
              <button
                key={spec}
                onClick={() => onFilterChange("specialization", active ? "" : spec)}
                className="px-3 py-1.5 rounded-sm text-xs font-semibold transition-all duration-300 relative"
                style={{
                  fontFamily: "var(--font-sans)",
                  background: ps.bg,
                  color: ps.color,
                  border: `1.5px solid ${ps.border}`,
                  borderBottom: active ? `3px solid ${ps.bottomBar}` : `3px solid ${ps.border}`,
                }}
              >
                {spec}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-5">
        <StyledSelect label="Group" value={filters.group} onChange={(v) => onFilterChange("group", v)} options={groups} allLabel="All Groups" />
        <StyledSelect label="Expertise" value={filters.expertise} onChange={(v) => onFilterChange("expertise", v)} options={allSkills} allLabel="All Skills" />
      </div>
    </div>
  );
}
