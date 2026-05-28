"use client";

import { Student } from "@/types/student";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X } from "lucide-react";
import AlumniCard from "@/components/AlumniCard";
import FilterPanel from "@/components/FilterPanel";
import SearchBar from "@/components/SearchBar";
import SkeletonCard from "@/components/SkeletonCard";


interface DirectoryClientProps { students: Student[]; }

export default function DirectoryClient({ students }: DirectoryClientProps) {
  const searchParams = useSearchParams();
  const [search, setSearch]   = useState(searchParams.get("q") || "");
  const [filters, setFilters] = useState({
    group: searchParams.get("group") || "",
    mentor: "",
  });
  const [mounted, setMounted] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    document.body.style.overflow = mobileFiltersOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileFiltersOpen]);

  const handleFilterChange = (key: string, value: string) => setFilters((p) => ({ ...p, [key]: value }));
  const handleClear = () => { setFilters({ group: "", mentor: "" }); setSearch(""); };

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch = !q
        || s.name.toLowerCase().includes(q)
        || (s.email && s.email.toLowerCase().includes(q))
        || s.enrollmentNo.toLowerCase().includes(q)
        || s.group.toLowerCase().includes(q)
        || s.mentor.toLowerCase().includes(q);
      const matchGroup  = !filters.group || s.group.trim().toLowerCase() === filters.group.toLowerCase();
      const matchMentor = !filters.mentor || s.mentor.trim().toLowerCase() === filters.mentor.toLowerCase();
      return matchSearch && matchGroup && matchMentor;
    });
  }, [students, search, filters]);

  const activeFilterCount = [filters.group, filters.mentor].filter(Boolean).length;
  const hasAnyFilter = search || activeFilterCount > 0;

  return (
    <div className="min-h-screen pb-24" style={{ background: "#faf8f3" }}>

      {/* Page Header */}
      <div className="pt-10 pb-8 px-6 relative overflow-hidden" style={{ background: "#faf8f3", borderBottom: "2px solid #e8a830", boxShadow: "0 2px 12px rgba(45,96,96,0.06)" }}>
        <div className="absolute left-0 top-0 bottom-0 w-1 hidden lg:block" style={{ background: "#2d6060", opacity: 0.5 }} />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16,1,0.3,1] }}>
            <p className="label-caps mb-2">IT Department</p>
            <h1 className="mb-2" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(2rem,5vw,3rem)", letterSpacing: "-0.02em", color: "#1a1a1a" }}>Student Directory</h1>
            <div className="flex items-center gap-2 mb-8">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#4caf50" }} />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: "#4caf50" }} />
              </span>
              <p className="text-sm italic" style={{ fontFamily: "var(--font-sans)", fontWeight: 300, color: "#6b5e4e" }}>
                {students.length} students · live from Google Sheets
              </p>
            </div>
            <div className="max-w-2xl">
              <SearchBar value={search} onChange={setSearch} />
            </div>

          </motion.div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col lg:flex-row gap-8 items-start">

        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-72 shrink-0 lg:sticky lg:top-[76px]">
          <FilterPanel students={students} filters={filters} onFilterChange={handleFilterChange} onClear={handleClear} />
        </aside>

        {/* Grid */}
        <div className="flex-1 w-full min-w-0">
          {/* Results bar */}
          <div className="flex items-center justify-between mb-6 gap-4">
            <motion.p key={filtered.length} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }} className="text-sm italic" style={{ fontFamily: "var(--font-sans)", fontWeight: 300, color: "#6b5e4e" }}>
              {filtered.length === students.length ? `Showing all ${students.length} students` : `${filtered.length} of ${students.length} results`}
            </motion.p>

            <div className="flex items-center gap-2">
              {/* Mobile filter toggle */}
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setMobileFiltersOpen(true)} className="lg:hidden flex items-center gap-2 text-sm font-semibold px-3.5 py-2 rounded-sm transition-all shadow-sm" style={{ fontFamily: "var(--font-sans)", background: "#faf8f3", border: "1.5px solid rgba(232,168,48,0.35)", color: "#1a1a1a" }}>
                <Filter size={14} style={{ color: "#2d6060" }} />
                Filters
                {activeFilterCount > 0 && <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[9px] font-black" style={{ background: "#2d6060" }}>{activeFilterCount}</span>}
              </motion.button>
              {hasAnyFilter && (
                <button onClick={handleClear} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-sm transition-all" style={{ fontFamily: "var(--font-sans)", color: "#2d6060", background: "rgba(45,96,96,0.08)", border: "1px solid rgba(45,96,96,0.15)" }}>
                  <X size={13} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Cards */}
          {!mounted ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-md" style={{ background: "#faf8f3", border: "2px dashed rgba(232,168,48,0.40)" }}>
              <div className="mb-4 px-8 py-5 rotate-[-1deg]" style={{ background: "#fff9e0", border: "2px solid #e8a830", borderRadius: "3px", boxShadow: "2px 3px 0 rgba(0,0,0,0.08)" }}>
                <p style={{ fontFamily: "var(--font-script)", fontSize: "1.4rem", color: "#1a1a1a" }}>
                  No students found here!
                </p>
              </div>
              <p className="text-sm mb-6 max-w-xs leading-relaxed" style={{ fontFamily: "var(--font-sans)", color: "#6b5e4e" }}>Try adjusting your search or filters.</p>
              <button onClick={handleClear} className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all" style={{ fontFamily: "var(--font-sans)", fontWeight: 600, background: "rgba(45,96,96,0.10)", border: "1px solid rgba(45,96,96,0.20)", color: "#2d6060" }}>
                Clear all filters
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((student, i) => (
                <div key={student.id} style={{ opacity: 1, transform: "scale(1)", transition: "opacity 0.3s ease, transform 0.3s ease" }}>
                  <AlumniCard student={student} index={i} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div key="filter-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-40 lg:hidden" style={{ background: "rgba(45,96,96,0.18)", backdropFilter: "blur(4px)" }} onClick={() => setMobileFiltersOpen(false)} />
            <motion.div key="filter-sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 350, damping: 35 }} className="fixed bottom-0 left-0 right-0 z-50 lg:hidden rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto" style={{ background: "#faf8f3", borderTop: "3px solid #e8a830" }}>
              <div className="flex items-center justify-between px-6 pt-5 pb-4 sticky top-0 z-10" style={{ background: "#faf8f3", borderBottom: "1px dashed rgba(45,96,96,0.15)" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "#1a1a1a" }}>Filters</h2>
                <button onClick={() => setMobileFiltersOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors" style={{ background: "rgba(45,96,96,0.08)", color: "#2d6060" }} aria-label="Close filters">
                  <X size={16} />
                </button>
              </div>
              <div className="p-6">
                <FilterPanel students={students} filters={filters} onFilterChange={handleFilterChange} onClear={handleClear} />
                <button onClick={() => setMobileFiltersOpen(false)} className="mt-4 w-full py-3 rounded-full text-sm font-semibold text-white shadow-md" style={{ fontFamily: "var(--font-sans)", fontWeight: 600, background: "#2d6060" }}>
                  Apply Filters{activeFilterCount > 0 && ` (${activeFilterCount} active)`}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
