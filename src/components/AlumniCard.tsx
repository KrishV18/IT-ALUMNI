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
  { bg: "#e8eaf6", text: "#3949ab", border: "#c5cae9" },
  { bg: "#e0f7fa", text: "#00838f", border: "#b2ebf2" },
  { bg: "#e8f5e9", text: "#2e7d32", border: "#c8e6c9" },
  { bg: "#fff8e1", text: "#f57f17", border: "#ffecb3" },
  { bg: "#fce4ec", text: "#c62828", border: "#f8bbd0" },
  { bg: "#f3e5f5", text: "#6a1b9a", border: "#e1bee7" },
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getSpecStyle(spec: string) {
  const s = spec.toUpperCase();
  if (s.includes("AIML") || s.includes("AI")) return { color: "#3b4fa0", border: "#3b4fa0" };
  if (s.includes("FSD") || s.includes("FULL")) return { color: "#0e7490", border: "#0e7490" };
  return { color: "var(--color-muted-foreground)", border: "var(--color-muted-foreground)" };
}

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function AlumniCard({ student, index }: { student: Student; index: number }) {
  const avatar = getAvatarColor(student.name);
  const specStyle = getSpecStyle(student.specialization);
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
        whileHover={{ y: -5, rotate: -0.4 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        style={{ willChange: "transform" }}
        className="paper-card p-6 relative overflow-hidden cursor-pointer transition-all duration-300 group-hover:shadow-[0_8px_24px_rgba(60,50,30,0.12)]"
      >

        {/* Header */}
        <div className="flex items-start gap-4 mb-4 relative z-10">
          {/* Polaroid-style avatar */}
          <div className="relative shrink-0">
            <div
              className="w-14 h-14 flex items-center justify-center font-bold text-lg shadow-md transition-all duration-300 group-hover:rotate-2"
              style={{
                background: avatar.bg,
                color: avatar.text,
                border: `3px solid ${avatar.border}`,
                padding: "3px",
                borderRadius: "3px",
                outline: "2px solid rgba(255,255,255,0.9)",
                outlineOffset: "-5px",
              }}
            >
              {getInitials(student.name)}
            </div>
          </div>

          {/* Name & Spec */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base truncate mb-1.5 group-hover:text-primary transition-colors duration-200 font-serif" style={{ color: "var(--color-ink)" }}>
              {student.name}
            </h3>
            {/* Ink-stamp spec badge */}
            <span
              className="stamp-badge"
              style={{ color: specStyle.color, borderColor: specStyle.border }}
            >
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
              <span className="truncate max-w-[160px]" title={student.email}>
                {student.email}
              </span>
            </>
          )}
        </div>

        {/* Skills — sticker-tag style */}
        {topSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5 relative z-10">
            {topSkills.map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-1 rounded-sm text-xs font-medium border"
                style={{
                  background: "#f5efe6",
                  color: "var(--color-muted-foreground)",
                  borderColor: "rgba(60,50,30,0.12)",
                  boxShadow: "1px 1px 0 rgba(60,50,30,0.07)",
                }}
              >
                {skill}
              </span>
            ))}
            {student.expertise.length > 3 && (
              <span
                className="px-2 py-1 rounded-sm text-xs font-medium border"
                style={{
                  background: "#f5efe6",
                  color: "var(--color-muted-foreground)",
                  borderColor: "rgba(60,50,30,0.12)",
                  boxShadow: "1px 1px 0 rgba(60,50,30,0.07)",
                }}
              >
                +{student.expertise.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Perforated divider */}
        <div className="perf-divider mb-4" />

        {/* Social Links */}
        <div className="flex items-center gap-2 relative z-10">
          {student.linkedin && (
            <span
              role="link"
              tabIndex={0}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(student.linkedin, "_blank", "noopener,noreferrer"); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); window.open(student.linkedin, "_blank", "noopener,noreferrer"); } }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              style={{
                background: "#eef2fb",
                color: "#3b4fa0",
                border: "1.5px solid #c5cae9",
                borderRadius: "3px",
              }}
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
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              style={{
                background: "rgba(60,50,30,0.05)",
                color: "var(--color-ink)",
                border: "1.5px solid rgba(60,50,30,0.14)",
                borderRadius: "3px",
              }}
            >
              <GithubIcon width={13} height={13} />
              GitHub
            </span>
          )}
          {!student.linkedin && !student.github && student.email && (
            <a
              href={`mailto:${student.email}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: "rgba(60,50,30,0.05)",
                color: "var(--color-muted-foreground)",
                border: "1.5px solid rgba(60,50,30,0.10)",
                borderRadius: "3px",
              }}
            >
              <Mail size={13} />
              Email
            </a>
          )}
          {!student.linkedin && !student.github && !student.email && (
            <span className="text-xs text-muted-foreground/50 italic">No links available</span>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
