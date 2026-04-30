"use client";

import { Student } from "@/types/student";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SearchX, Filter, X } from "lucide-react";
import AlumniCard from "@/components/AlumniCard";
import FilterPanel from "@/components/FilterPanel";
import SearchBar from "@/components/SearchBar";
import SkeletonCard from "@/components/SkeletonCard";

interface DirectoryClientProps {
  students: Student[];
}

export default function DirectoryClient({ students }: DirectoryClientProps) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [filters, setFilters] = useState({
    specialization: searchParams.get("spec") || "",
    group: "",
    expertise: "",
  });
  const [mounted, setMounted] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Close mobile filter sheet on body scroll lock
  useEffect(() => {
    if (mobileFiltersOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileFiltersOpen]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClear = () => {
    setFilters({ specialization: "", group: "", expertise: "" });
    setSearch("");
  };

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        s.specialization.toLowerCase().includes(q) ||
        (s.expertise && s.expertise.some((e) => e.toLowerCase().includes(q))) ||
        (s.societies && s.societies.toLowerCase().includes(q));

      const matchSpec =
        !filters.specialization ||
        s.specialization.trim().toLowerCase() === filters.specialization.toLowerCase();

      const matchGroup =
        !filters.group ||
        s.group.trim().toLowerCase() === filters.group.toLowerCase();

      const matchExpertise =
        !filters.expertise ||
        (s.expertise && s.expertise.some((e) => e.trim().toLowerCase() === filters.expertise.toLowerCase()));

      return matchSearch && matchSpec && matchGroup && matchExpertise;
    });
  }, [students, search, filters]);

  const activeFilterCount = [filters.specialization, filters.group, filters.expertise].filter(Boolean).length;
  const hasAnyFilter = search || activeFilterCount > 0;

  return (
    <div className="bg-background min-h-screen pb-24">
      {/* Page Header */}
      <div className="border-b border-black/5 bg-white pt-10 pb-8 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <p className="section-label mb-2">
              IT Department
            </p>
            <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tight text-foreground font-serif">
              Student Directory
            </h1>
            <p className="text-muted-foreground text-sm mb-8 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              {students.length} students · live from Google Sheets
            </p>
            <div className="max-w-2xl">
              <SearchBar value={search} onChange={setSearch} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col lg:flex-row gap-8 items-start">

        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-72 shrink-0 lg:sticky lg:top-24">
          <FilterPanel students={students} filters={filters} onFilterChange={handleFilterChange} onClear={handleClear} />
        </aside>

        {/* Grid */}
        <div className="flex-1 w-full min-w-0">
          {/* Results bar */}
          <div className="flex items-center justify-between mb-6 gap-4">
            <motion.p
              key={filtered.length}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="text-muted-foreground text-sm font-medium"
            >
              {filtered.length === students.length
                ? `Showing all ${students.length} students`
                : `${filtered.length} of ${students.length} results`}
            </motion.p>

            <div className="flex items-center gap-2">
              {/* Mobile filter toggle */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-2 text-sm font-semibold text-foreground bg-white border border-black/10 hover:border-black/20 px-3.5 py-2 rounded-xl transition-all shadow-sm"
              >
                <Filter size={14} className="text-primary" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center w-4.5 h-4.5 rounded-full bg-primary text-white text-[9px] font-black px-1">
                    {activeFilterCount}
                  </span>
                )}
              </motion.button>

              {hasAnyFilter && (
                <button
                  onClick={handleClear}
                  className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-indigo-700 bg-primary/10 hover:bg-primary/20 px-3 py-2 rounded-xl transition-all"
                >
                  <X size={13} />
                  Clear
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
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white border border-dashed border-black/10 rounded-3xl shadow-sm"
            >
              <div className="w-16 h-16 bg-black/5 rounded-2xl flex items-center justify-center mb-4 text-muted-foreground">
                <SearchX size={30} />
              </div>
              <p className="text-lg font-bold mb-2 text-foreground font-serif">No students found</p>
              <p className="text-muted-foreground text-sm mb-6 max-w-xs leading-relaxed">
                Nothing matched your search or filters. Try adjusting them.
              </p>
              <button
                onClick={handleClear}
                className="bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              >
                Clear all filters
              </button>
            </motion.div>
          ) : (
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              <AnimatePresence>
                {filtered.map((student, i) => (
                  <AlumniCard key={student.id} student={student} index={i} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* Mobile Filter Bottom Sheet */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="filter-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileFiltersOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              key="filter-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-black/10 rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              {/* Sheet handle */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-black/5 sticky top-0 bg-white z-10">
                <h2 className="font-bold text-foreground font-serif">Filters</h2>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/5 hover:bg-black/10 text-muted-foreground transition-colors"
                  aria-label="Close filters"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-6">
                <FilterPanel students={students} filters={filters} onFilterChange={handleFilterChange} onClear={handleClear} />
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="mt-4 w-full bg-primary text-white py-3 rounded-xl text-sm font-semibold shadow-md"
                >
                  Apply Filters
                  {activeFilterCount > 0 && ` (${activeFilterCount} active)`}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
