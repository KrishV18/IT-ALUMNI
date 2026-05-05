"use client";

import { Student } from "@/types/student";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import AlumniCard from "@/components/AlumniCard";
import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Users, GraduationCap, Briefcase, ArrowRight } from "lucide-react";

function AnimatedCounter({ value, delay = 0 }: { value: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref as React.RefObject<Element>, { once: true });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 80, damping: 18 });
  const display = useTransform(spring, (v) => Math.round(v).toString());
  useEffect(() => {
    if (isInView) {
      const t = setTimeout(() => motionVal.set(value), delay);
      return () => clearTimeout(t);
    }
  }, [isInView, value, delay, motionVal]);
  return <motion.span ref={ref}>{display}</motion.span>;
}

function getGroupStyle(group: string) {
  const g = group.toUpperCase();
  if (g.includes("7")) return { tabBg: "#2d6060", border: "#2d6060", label: "#fff" };
  if (g.includes("8")) return { tabBg: "#c98a20", border: "#e8a830", label: "#fff" };
  if (g.includes("5") || g.includes("6")) return { tabBg: "#7c5bbf", border: "#9a7ed6", label: "#fff" };
  return { tabBg: "#b56060", border: "#e8a0a0", label: "#fff" };
}

export default function HomeClient({ students }: { students: Student[] }) {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const featured = useMemo(() => {
    // Feature students with the most activities
    return [...students].sort((a, b) => {
      const aCount = a.events.length + a.internships.length + a.projects.length + a.moocCourses.length + a.nptelCourses.length + a.certifications.length;
      const bCount = b.events.length + b.internships.length + b.projects.length + b.moocCourses.length + b.nptelCourses.length + b.certifications.length;
      return bCount - aCount;
    }).slice(0, 6);
  }, [students]);
  const totalStudents = students.length;
  const uniqueGroups = new Set(students.map((s) => s.group.trim())).size;
  const withInternships = students.filter((s) => s.internships.length > 0).length;
  const groupCounts = useMemo(() => {
    const map: Record<string, number> = {};
    students.forEach((s) => { const g = s.group.trim(); if (g) map[g] = (map[g] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [students]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && search.trim()) router.push(`/directory?q=${encodeURIComponent(search.trim())}`);
  };

  const statsRef = useRef<HTMLDivElement>(null);
  const specsRef = useRef<HTMLDivElement>(null);
  const featRef  = useRef<HTMLDivElement>(null);
  const statsInView   = useInView(statsRef as React.RefObject<Element>, { once: true, amount: 0.15 });
  const specsInView   = useInView(specsRef as React.RefObject<Element>, { once: true, amount: 0.15 });
  const featInView    = useInView(featRef  as React.RefObject<Element>, { once: true, amount: 0.10 });

  const STATS = [
    { value: totalStudents, label: "Total Students",  icon: Users,          rotate: "-1deg",   delay: 0 },
    { value: uniqueGroups,  label: "Groups",          icon: GraduationCap,  rotate: "0.5deg",  delay: 150 },
    { value: withInternships, label: "With Internships", icon: Briefcase,   rotate: "1deg",    delay: 300 },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#faf8f3" }}>

      {/* ── HERO ── */}
      <section className="relative pt-16 pb-20 px-6 overflow-hidden">
        <div className="absolute left-16 top-0 bottom-0 w-px pointer-events-none hidden lg:block" style={{ background: "rgba(200,60,40,0.08)" }} />
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.09 } } }} className="flex flex-col items-center text-center">

            {/* Badge */}
            <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16,1,0.3,1] as [number,number,number,number] } } }}>
              <div className="inline-flex items-center gap-2 text-white text-xs font-bold uppercase mb-8" style={{ fontFamily: "var(--font-display)", letterSpacing: "0.14em", background: "#2d6060", borderRadius: "2px 6px 6px 2px", padding: "6px 20px" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
                IT Department · Digital Yearbook
              </div>
            </motion.div>

            {/* Gold inset frame */}
            <motion.div variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16,1,0.3,1] as [number,number,number,number] } } }} className="w-full max-w-3xl mx-auto px-8 py-10 md:py-14" style={{ border: "8px solid #e8a830", borderRadius: "4px", background: "#faf8f3" }}>

              <h1 className="mb-5" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(2.8rem,7vw,5rem)", letterSpacing: "-0.02em", color: "#1a1a1a", lineHeight: 1.05 }}>
                <span style={{ color: "#2d6060" }}>IT</span> Connect
              </h1>

              <p className="mb-10 max-w-md mx-auto" style={{ fontFamily: "var(--font-sans)", fontWeight: 300, fontSize: "1.05rem", lineHeight: 1.7, color: "#6b5e4e" }}>
                Browse profiles, discover skills, and network with IT Department students — all in one place.
              </p>

              {/* Search */}
              <div className="max-w-xl mx-auto mb-8" onKeyDown={handleSearchKeyDown}>
                <SearchBar value={search} onChange={setSearch} large />
                {search && <p className="text-xs mt-2 text-center" style={{ color: "#9a8e82", fontFamily: "var(--font-sans)" }}>Press <kbd className="typewriter-key">Enter</kbd> to search</p>}
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Link href={search ? `/directory?q=${encodeURIComponent(search)}` : "/directory"} className="inline-flex items-center justify-center px-8 py-3.5 rounded-full text-sm font-semibold text-white transition-all duration-200" style={{ fontFamily: "var(--font-sans)", fontWeight: 600, background: "#2d6060", border: "2px solid #2d6060" }} onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "#e8a830"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "#2d6060"; }}>
                    Explore Students
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <a href="#featured" className="inline-flex items-center justify-center px-8 py-3.5 rounded-full text-sm font-semibold transition-all duration-200" style={{ fontFamily: "var(--font-sans)", fontWeight: 600, background: "transparent", border: "2px solid #2d6060", color: "#2d6060" }} onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(45,96,96,0.06)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}>
                    View Profiles
                  </a>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS — stamped chips ── */}
      <section className="px-6 pb-16" ref={statsRef}>
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-8">
          {STATS.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={statsInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1, duration: 0.4, ease: [0.16,1,0.3,1] }} className="flex flex-col items-center px-8 py-5" style={{ background: "#2d6060", color: "#fff", borderRadius: "3px", transform: `rotate(${stat.rotate})`, fontFamily: "var(--font-display)", minWidth: "130px", boxShadow: "2px 3px 0 rgba(0,0,0,0.12)" }}>
              <stat.icon size={20} style={{ opacity: 0.7, marginBottom: "6px" }} />
              <div style={{ fontWeight: 800, fontSize: "2rem", letterSpacing: "-0.02em", lineHeight: 1 }}>
                <AnimatedCounter value={stat.value} delay={stat.delay} />
              </div>
              <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: "4px", opacity: 0.8 }}>
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── GROUPS — binder tabs ── */}
      <section className="px-6 py-20 relative halftone-edge" style={{ background: "#f3f0e8" }}>
        <div className="max-w-6xl mx-auto relative z-10" ref={specsRef}>
          <div className="text-center mb-12">
            <p className="label-caps mb-3">Browse by Group</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(1.8rem,4vw,2.5rem)", letterSpacing: "-0.02em", color: "#1a1a1a" }}>Find Your Tribe</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {groupCounts.map(([group, count], idx) => {
              const s = getGroupStyle(group);
              return (
                <Link key={group} href={`/directory?group=${encodeURIComponent(group)}`} className="block group">
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={specsInView ? { opacity: 1, y: 0 } : {}} whileHover={{ y: -2 }} transition={{ delay: idx * 0.08, duration: 0.35, ease: [0.16,1,0.3,1] }} className="overflow-hidden rounded-sm cursor-pointer" style={{ border: `2px solid ${s.border}`, boxShadow: "0 4px 8px rgba(0,0,0,0.06)" }}>
                    <div className="px-4 pt-3 pb-2.5" style={{ background: s.tabBg }}>
                      <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.06em", color: s.label, textTransform: "uppercase" }}>Group {group}</p>
                    </div>
                    <div className="px-4 py-3" style={{ background: "#faf8f3" }}>
                      <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.5rem", color: "#1a1a1a", lineHeight: 1 }}>{count}</p>
                      <p style={{ fontFamily: "var(--font-sans)", fontWeight: 400, fontSize: "0.75rem", color: "#6b5e4e", marginTop: "2px" }}>students</p>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURED PROFILES ── */}
      <section id="featured" className="px-6 py-20 pb-28">
        <div className="max-w-6xl mx-auto" ref={featRef}>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <p className="label-caps mb-2">Featured Profiles</p>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(1.8rem,4vw,2.5rem)", letterSpacing: "-0.02em", color: "#1a1a1a" }}>
                Meet the{" "}<span style={{ fontFamily: "var(--font-script)", fontWeight: 600, fontSize: "1.05em", color: "#2d6060" }}>Network</span>
              </h2>
            </div>
            <motion.div whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 300 }}>
              <Link href="/directory" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm text-sm font-semibold transition-all shadow-sm hover:shadow-md group" style={{ fontFamily: "var(--font-sans)", fontWeight: 600, background: "#f3f0e8", border: "1px solid rgba(45,96,96,0.15)", color: "#1a1a1a" }}>
                View All {totalStudents}
                <ArrowRight size={15} className="text-[#6b5e4e] group-hover:text-[#2d6060] transition-colors" />
              </Link>
            </motion.div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 16 }} animate={featInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.08, duration: 0.4, ease: [0.16,1,0.3,1] }}>
                <AlumniCard student={s} index={i} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
