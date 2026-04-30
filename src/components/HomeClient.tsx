"use client";

import { Student } from "@/types/student";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import AlumniCard from "@/components/AlumniCard";
import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Users, GraduationCap, Briefcase, Zap, Cpu, Code, ArrowRight } from "lucide-react";

// ─── Animated Counter ──────────────────────────────────────────────
function AnimatedCounter({ value, delay = 0 }: { value: number; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 80, damping: 18 });
  const display = useTransform(spring, (v) => Math.round(v).toString());

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => motionVal.set(value), delay);
      return () => clearTimeout(timer);
    }
  }, [isInView, value, delay, motionVal]);

  return <motion.div ref={ref}>{display}</motion.div>;
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function HomeClient({ students }: { students: Student[] }) {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const featured = useMemo(
    () => students.filter((s) => s.linkedin || s.expertise.length > 0).slice(0, 6),
    [students]
  );

  const totalStudents = students.length;
  const uniqueSpecs = new Set(students.map((s) => s.specialization.trim())).size;
  const withLinkedIn = students.filter((s) => s.linkedin).length;

  const specCounts = useMemo(() => {
    const map: Record<string, number> = {};
    students.forEach((s) => {
      const spec = s.specialization.trim();
      if (spec) map[spec] = (map[spec] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [students]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && search.trim()) {
      router.push(`/directory?q=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-24 px-6 text-center">
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center"
          >
            {/* Badge */}
            <motion.div variants={fadeUp}>
              <div className="inline-flex items-center gap-2 bg-white border border-black/10 rounded-full px-4 py-1.5 text-xs font-semibold text-primary mb-8 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                IT Department · Digital Yearbook
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-5 text-foreground font-serif"
            >
              Connect with Your{" "}
              <br />
              <span className="text-primary italic font-serif">
                IT Network
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed"
            >
              Browse profiles, discover skills, and network with IT Department students and alumni — all in one place.
            </motion.p>

            {/* Search */}
            <motion.div variants={fadeUp} className="w-full max-w-2xl mx-auto mb-10">
              <div onKeyDown={handleSearchKeyDown}>
                <SearchBar value={search} onChange={setSearch} large />
              </div>
              {search && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-black/5 text-foreground text-[10px] font-mono font-bold">Enter</kbd> to search
                </p>
              )}
            </motion.div>

            {/* CTAs */}
            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row justify-center gap-4"
            >
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href={search ? `/directory?q=${encodeURIComponent(search)}` : "/directory"}
                  className="inline-flex items-center justify-center gap-2 bg-primary text-white px-8 py-3.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-shadow"
                >
                  <Zap size={16} className="fill-current" />
                  Explore Students
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <a
                  href="#featured"
                  className="inline-flex items-center justify-center gap-2 bg-white border border-black/10 text-foreground px-8 py-3.5 rounded-xl text-sm font-semibold hover:bg-black/5 shadow-sm transition-colors"
                >
                  View Profiles
                </a>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────────────── */}
      <section className="px-6 pb-12 relative z-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 paper-card overflow-hidden"
          >
            {[
              { value: totalStudents, label: "Total Students", icon: Users, color: "text-primary", bg: "bg-primary/10", delay: 0 },
              { value: uniqueSpecs, label: "Specializations", icon: GraduationCap, color: "text-emerald-600", bg: "bg-emerald-100", delay: 150 },
              { value: withLinkedIn, label: "On LinkedIn", icon: Briefcase, color: "text-cyan-600", bg: "bg-cyan-100", delay: 300 },
            ].map((stat, i) => (
              <div
                key={i}
                className={`p-10 text-center group ${i < 2 ? "border-b md:border-b-0 md:border-r border-black/5" : ""}`}
              >
                <div className={`mx-auto w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mb-4 ${stat.color} transition-transform duration-300 group-hover:scale-110 shadow-sm border border-black/5`}>
                  <stat.icon size={24} />
                </div>
                <div className={`text-4xl font-black tracking-tight mb-2 ${stat.color}`}>
                  <AnimatedCounter value={stat.value} delay={stat.delay} />
                </div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest font-sans">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SPECIALIZATIONS ─────────────────────────────────────────── */}
      <section className="px-6 py-24 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="section-label mb-3">
              Browse Specializations
            </p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground font-serif">
              Find Your Tribe
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {specCounts.map(([spec, count], idx) => {
              const isAI = spec.toUpperCase().includes("AIML");
              return (
                <Link key={spec} href={`/directory?spec=${encodeURIComponent(spec)}`} className="block group">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.03, y: -2 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.08, duration: 0.4 }}
                    className="paper-card p-6 flex items-center gap-4 transition-all duration-300 group-hover:shadow-lg"
                  >
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-sm ${
                        isAI
                          ? "bg-indigo-500"
                          : "bg-cyan-500"
                      }`}
                    >
                      {isAI ? <Cpu size={22} /> : <Code size={22} />}
                    </div>
                    <div>
                      <div className="font-bold text-foreground text-sm mb-1 group-hover:text-primary transition-colors font-serif">
                        {spec}
                      </div>
                      <div className="text-xs font-medium text-muted-foreground">
                        {count} students
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURED PROFILES ───────────────────────────────────────── */}
      <section id="featured" className="px-6 pb-28">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <p className="section-label mb-3">
                Featured Profiles
              </p>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground font-serif">
                Meet the Network
              </h2>
            </div>
            <motion.div whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 300 }}>
              <Link
                href="/directory"
                className="inline-flex items-center gap-2 bg-white hover:bg-black/5 border border-black/10 text-foreground px-5 py-2.5 rounded-xl text-sm font-semibold transition-all group shadow-sm"
              >
                View All {totalStudents}
                <ArrowRight size={15} className="text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((s, i) => (
              <AlumniCard key={s.id} student={s} index={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
