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
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-24 px-6 text-center overflow-hidden">
        {/* Subtle notebook left-margin line */}
        <div
          className="absolute left-16 top-0 bottom-0 w-px pointer-events-none hidden lg:block"
          style={{ background: "rgba(180,50,40,0.10)" }}
        />

        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center"
          >
            {/* Index-tab badge */}
            <motion.div variants={fadeUp}>
              <div
                className="inline-flex items-center gap-2 text-white text-xs font-bold tracking-widest uppercase px-5 py-2 mb-8 shadow-sm"
                style={{
                  background: "var(--color-primary)",
                  borderRadius: "2px 6px 6px 2px",
                  letterSpacing: "0.12em",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />
                IT Department · Digital Yearbook
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-5 font-serif"
              style={{ color: "var(--color-ink)" }}
            >
              Connect with Your{" "}
              <br />
              <span className="text-primary font-script" style={{ fontSize: "1.05em", fontWeight: 400 }}>
                IT Network
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed"
              style={{ color: "var(--color-muted-foreground)" }}
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
                  Press <kbd className="typewriter-key">Enter</kbd> to search
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
                  className="inline-flex items-center justify-center gap-2 bg-primary text-white px-8 py-3.5 rounded-md text-sm font-semibold border border-[#3d6b78] shadow-[2px_2px_0_rgba(60,50,30,0.15)] hover:shadow-[1px_1px_0_rgba(60,50,30,0.15)] hover:translate-x-px hover:translate-y-px transition-all duration-150"
                >
                  <Zap size={16} className="fill-current" />
                  Explore Students
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <a
                  href="#featured"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-md text-sm font-semibold border border-[rgba(60,50,30,0.14)] shadow-sm hover:bg-[rgba(60,50,30,0.04)] transition-colors"
                  style={{ background: "#f5efe6", color: "var(--color-ink)" }}
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
            className="grid grid-cols-1 md:grid-cols-3 overflow-hidden rounded-md border border-[rgba(60,50,30,0.10)] shadow-[0_4px_16px_rgba(60,50,30,0.07)]"
            style={{ background: "#fdf8f0" }}
          >
            {[
              { value: totalStudents, label: "Total Students",    icon: Users,          color: "text-primary",     bg: "bg-primary/10",   delay: 0 },
              { value: uniqueSpecs,   label: "Specializations",   icon: GraduationCap,  color: "text-emerald-700", bg: "bg-emerald-100",  delay: 150 },
              { value: withLinkedIn,  label: "On LinkedIn",       icon: Briefcase,      color: "text-[#4a7caa]",   bg: "bg-[#e8f0f8]",   delay: 300 },
            ].map((stat, i) => (
              <div
                key={i}
                className={`p-10 text-center group ${
                  i < 2
                    ? "border-b md:border-b-0 md:border-r border-dashed border-[rgba(60,50,30,0.10)]"
                    : ""
                }`}
              >
                <div className={`mx-auto w-12 h-12 ${stat.bg} rounded-md flex items-center justify-center mb-4 ${stat.color} transition-transform duration-300 group-hover:scale-110 shadow-sm border border-[rgba(60,50,30,0.06)]`}>
                  <stat.icon size={24} />
                </div>
                <div className={`text-4xl font-black tracking-tight mb-2 font-serif ${stat.color}`}>
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
      <section className="px-6 py-24 relative halftone-edge">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <p className="section-label mb-3">Browse Specializations</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight font-serif" style={{ color: "var(--color-ink)" }}>
              Find Your Tribe
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {specCounts.map(([spec, count], idx) => {
              const isAI = spec.toUpperCase().includes("AIML");
              const topColor = isAI ? "#6366f1" : "#0891b2";
              return (
                <Link key={spec} href={`/directory?spec=${encodeURIComponent(spec)}`} className="block group">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.03, y: -2, rotate: -0.5 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.08, duration: 0.4 }}
                    className="paper-card p-6 flex items-center gap-4 transition-all duration-300 group-hover:shadow-lg"
                    style={{ borderTop: `4px solid ${topColor}`, borderRadius: "0 0 6px 6px" }}
                  >
                    <div
                      className={`w-11 h-11 rounded-sm flex items-center justify-center font-bold text-white shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-sm`}
                      style={{ background: topColor }}
                    >
                      {isAI ? <Cpu size={20} /> : <Code size={20} />}
                    </div>
                    <div>
                      <div className="font-bold text-sm mb-1 group-hover:text-primary transition-colors font-serif" style={{ color: "var(--color-ink)" }}>
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
              <p className="section-label mb-2">Featured Profiles</p>
              {/* Script accent on section heading */}
              <h2 className="text-3xl md:text-4xl font-black tracking-tight font-serif" style={{ color: "var(--color-ink)" }}>
                Meet the{" "}
                <span className="font-script text-primary" style={{ fontWeight: 400, fontSize: "1.05em" }}>
                  Network
                </span>
              </h2>
            </div>
            <motion.div whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 300 }}>
              <Link
                href="/directory"
                className="inline-flex items-center gap-2 border border-[rgba(60,50,30,0.12)] text-foreground px-5 py-2.5 rounded-md text-sm font-semibold transition-all group shadow-sm hover:bg-[rgba(60,50,30,0.04)]"
                style={{ background: "#f5efe6" }}
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
