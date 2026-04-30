"use client";

import { Student } from "@/types/student";
import { useMemo } from "react";
import { X, ChevronDown, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FilterPanelProps {
  students: Student[];
  filters: {
    specialization: string;
    group: string;
    expertise: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onClear: () => void;
}

function unique(arr: string[]): string[] {
  return Array.from(new Set(arr.filter(Boolean))).sort();
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  allLabel: string;
  filterKey: string;
}

function SelectField({ label, value, onChange, options, allLabel }: SelectFieldProps) {
  const isActive = !!value;
  return (
    <div>
      <label
        className={`section-label mb-2 block transition-colors duration-200 ${
          isActive ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {label}
        {isActive && (
          <span className="ml-2 inline-flex items-center justify-center w-1.5 h-1.5 rounded-full bg-primary" />
        )}
      </label>
      <div className="relative">
        <select
          className={`w-full appearance-none rounded-lg px-4 py-2.5 text-sm outline-none transition-all duration-200 cursor-pointer font-medium shadow-sm ${
            isActive
              ? "bg-primary/5 border border-primary/30 text-primary focus:border-primary/60"
              : "bg-white border border-black/10 text-foreground focus:border-primary/50 hover:border-black/20"
          }`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" className="bg-white">{allLabel}</option>
          {options.map((s) => (
            <option key={s} value={s} className="bg-white">{s}</option>
          ))}
        </select>
        <ChevronDown
          size={13}
          className={`absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${
            isActive ? "text-primary" : "text-muted-foreground"
          }`}
        />
      </div>

      {/* Active chip */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-md w-fit shadow-sm">
              <span className="text-[10px] font-bold text-primary truncate max-w-[140px]">{value}</span>
              <button
                onClick={() => onChange("")}
                aria-label={`Remove ${label} filter`}
                className="ml-0.5 text-primary/60 hover:text-primary transition-colors"
              >
                <X size={10} strokeWidth={3} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FilterPanel({ students, filters, onFilterChange, onClear }: FilterPanelProps) {
  const specializations = useMemo(
    () => unique(students.map((s) => s.specialization.trim())),
    [students]
  );
  const groups = useMemo(() => unique(students.map((s) => s.group.trim())), [students]);
  const allSkills = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => s.expertise.forEach((e) => e && set.add(e.trim())));
    return Array.from(set).sort();
  }, [students]);

  const activeCount = [filters.specialization, filters.group, filters.expertise].filter(Boolean).length;

  return (
    <div className="paper-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="flex items-center gap-2 font-bold text-foreground text-sm font-serif">
          <Filter size={15} className="text-primary" />
          Filters
          <AnimatePresence>
            {activeCount > 0 && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black"
              >
                {activeCount}
              </motion.span>
            )}
          </AnimatePresence>
        </h2>
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="text-xs font-semibold text-muted-foreground hover:text-rose-600 transition-colors flex items-center gap-1"
          >
            Clear all <X size={11} strokeWidth={2.5} />
          </button>
        )}
      </div>

      <div className="space-y-5">
        <SelectField
          label="Specialization"
          value={filters.specialization}
          onChange={(v) => onFilterChange("specialization", v)}
          options={specializations}
          allLabel="All Specializations"
          filterKey="specialization"
        />
        <SelectField
          label="Group"
          value={filters.group}
          onChange={(v) => onFilterChange("group", v)}
          options={groups}
          allLabel="All Groups"
          filterKey="group"
        />
        <SelectField
          label="Expertise"
          value={filters.expertise}
          onChange={(v) => onFilterChange("expertise", v)}
          options={allSkills}
          allLabel="All Skills"
          filterKey="expertise"
        />
      </div>
    </div>
  );
}
