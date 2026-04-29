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

  // Navigate on Enter keypress from hero search
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && search.trim()) {
      router.push(`/directory?q=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-24 px-6 text-center">
        {/* Ambient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[350px] h-[350px] bg-accent/15 rounded-full blur-[100px] translate-x-1/2 pointer-events-none" />
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.025'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center"
          >
            {/* Badge */}
            <motion.div variants={fadeUp}>
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs font-semibold text-indigo-400 mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                IT Department · Live Data from Google Sheets
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-5 text-foreground"
            >
              Connect with Your{" "}
              <br />
              <span className="bg-gradient-to-br from-indigo-300 via-primary to-purple-500 text-transparent bg-clip-text">
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
                  Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-foreground text-[10px] font-mono font-bold">Enter</kbd> to search
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
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-secondary text-white px-8 py-3.5 rounded-xl text-sm font-semibold shadow-[0_0_40px_rgba(99,102,241,0.3)] hover:shadow-[0_0_60px_rgba(99,102,241,0.5)] transition-shadow"
                >
                  <Zap size={16} className="fill-current" />
                  Explore Students
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <a
                  href="#featured"
                  className="inline-flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-foreground px-8 py-3.5 rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors"
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
            className="grid grid-cols-1 md:grid-cols-3 bg-card/60 backdrop-blur-xl border border-white/8 rounded-3xl overflow-hidden shadow-2xl"
          >
            {[
              { value: totalStudents, label: "Total Students", icon: Users, color: "text-indigo-400", bg: "bg-indigo-500/10", delay: 0 },
              { value: uniqueSpecs, label: "Specializations", icon: GraduationCap, color: "text-emerald-400", bg: "bg-emerald-500/10", delay: 150 },
              { value: withLinkedIn, label: "On LinkedIn", icon: Briefcase, color: "text-cyan-400", bg: "bg-cyan-500/10", delay: 300 },
            ].map((stat, i) => (
              <div
                key={i}
                className={`p-10 text-center group ${i < 2 ? "border-b md:border-b-0 md:border-r border-white/5" : ""}`}
              >
                <div className={`mx-auto w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center mb-4 ${stat.color} transition-transform duration-300 group-hover:scale-110`}>
                  <stat.icon size={24} />
                </div>
                <div className={`text-4xl font-black tracking-tight mb-2 ${stat.color}`}>
                  <AnimatedCounter value={stat.value} delay={stat.delay} />
                </div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
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
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-3">
              Browse Specializations
            </p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
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
                    className="bg-card border border-white/5 rounded-2xl p-6 flex items-center gap-4 hover:border-primary/30 hover:shadow-[0_8px_30px_rgba(99,102,241,0.12)] transition-all duration-300"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                        isAI
                          ? "bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/20"
                          : "bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/20"
                      }`}
                    >
                      {isAI ? <Cpu size={22} /> : <Code size={22} />}
                    </div>
                    <div>
                      <div className="font-bold text-foreground text-sm mb-1 group-hover:text-primary transition-colors">
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
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-3">
                Featured Profiles
              </p>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
                Meet the Network
              </h2>
            </div>
            <motion.div whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 300 }}>
              <Link
                href="/directory"
                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-foreground px-5 py-2.5 rounded-xl text-sm font-semibold transition-all group"
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
