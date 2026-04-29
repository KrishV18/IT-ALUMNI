"use client";

import { Student } from "@/types/student";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Mail } from "lucide-react";

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
);

const AVATAR_COLORS = [
  "from-indigo-500 to-violet-500",
  "from-cyan-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-pink-500 to-purple-500",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getSpecStyle(spec: string) {
  const s = spec.toUpperCase();
  if (s.includes("AIML") || s.includes("AI")) return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
  if (s.includes("FSD") || s.includes("FULL")) return "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20";
  return "bg-white/5 text-muted-foreground border border-white/10";
}

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const SKILL_COLORS = [
  "bg-white/5 text-muted-foreground border-white/10",
  "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "bg-purple-500/10 text-purple-400 border-purple-500/20",
];

export default function AlumniCard({ student, index }: { student: Student; index: number }) {
  const avatarGradient = getAvatarColor(student.name);
  const topSkills = student.expertise.slice(0, 3);

  const itemVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, delay: index * 0.05, ease: "easeOut" as const },
    },
  };

  return (
    <Link href={`/profile/${encodeURIComponent(student.id)}`} className="block group" tabIndex={0}>
      <motion.div
        variants={itemVariant}
        initial="hidden"
        animate="visible"
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        style={{ willChange: "transform" }}
        className="bg-card border border-white/5 rounded-2xl p-6 relative overflow-hidden cursor-pointer transition-all duration-300 group-hover:border-primary/30 group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_0_1px_rgba(99,102,241,0.08)]"
      >
        {/* Hover glow */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-primary/20 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* Header */}
        <div className="flex items-start gap-4 mb-4 relative z-10">
          {/* Avatar with ring on hover */}
          <div className="relative shrink-0">
            <div
              className={`w-14 h-14 rounded-xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-bold text-lg shadow-inner transition-all duration-300 group-hover:ring-2 group-hover:ring-primary/40 group-hover:ring-offset-2 group-hover:ring-offset-card`}
            >
              {getInitials(student.name)}
            </div>
          </div>

          {/* Name & Spec */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground text-base truncate mb-1 group-hover:text-primary transition-colors duration-200">
              {student.name}
            </h3>
            <span className={`inline-block px-2.5 py-0.5 rounded-md text-[0.68rem] font-bold tracking-wider uppercase ${getSpecStyle(student.specialization)}`}>
              {student.specialization || "IT"}
            </span>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-2 mb-4 text-xs font-medium text-muted-foreground relative z-10">
          <BookOpen size={13} className="opacity-60 shrink-0" />
          <span>Group {student.group}</span>
          {student.email && (
            <>
              <span className="opacity-30">•</span>
              <span
                className="truncate max-w-[160px]"
                title={student.email}
              >
                {student.email}
              </span>
            </>
          )}
        </div>

        {/* Skills */}
        {topSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5 relative z-10">
            {topSkills.map((skill, i) => (
              <span key={skill} className={`px-2.5 py-1 rounded-md text-xs font-medium border ${SKILL_COLORS[i % SKILL_COLORS.length]}`}>
                {skill}
              </span>
            ))}
            {student.expertise.length > 3 && (
              <span className="px-2 py-1 rounded-md text-xs font-medium bg-white/5 text-muted-foreground border border-white/5">
                +{student.expertise.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="h-px w-full bg-white/5 mb-4 group-hover:bg-primary/15 transition-colors duration-300 relative z-10" />

        {/* Social Links */}
        <div className="flex items-center gap-2 relative z-10">
          {student.linkedin && (
            <span
              role="link"
              tabIndex={0}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(student.linkedin, "_blank", "noopener,noreferrer"); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); window.open(student.linkedin, "_blank", "noopener,noreferrer"); } }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold hover:bg-indigo-500/20 hover:text-indigo-300 transition-all cursor-pointer"
            >
              <LinkedinIcon width={13} height={13} />
              LinkedIn
            </span>
          )}
          {student.github && (
            <span
              role="link"
              tabIndex={0}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(student.github, "_blank", "noopener,noreferrer"); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); window.open(student.github, "_blank", "noopener,noreferrer"); } }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-muted-foreground text-xs font-semibold hover:bg-white/10 hover:text-foreground transition-all cursor-pointer"
            >
              <GithubIcon width={13} height={13} />
              GitHub
            </span>
          )}
          {!student.linkedin && !student.github && student.email && (
            <a
              href={`mailto:${student.email}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 text-muted-foreground text-xs font-medium hover:text-foreground hover:bg-white/10 transition-all"
            >
              <Mail size={13} />
              Reach out via email
            </a>
          )}
          {!student.linkedin && !student.github && !student.email && (
            <span className="text-xs text-muted-foreground/40 italic">No links available</span>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
