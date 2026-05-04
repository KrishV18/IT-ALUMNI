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

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function getSpecColor(spec: string): { teal: boolean; gold: boolean; blush: boolean } {
  const s = spec.toUpperCase();
  if (s.includes("AIML") || s.includes("AI")) return { teal: true, gold: false, blush: false };
  if (s.includes("FSD") || s.includes("FULL")) return { teal: false, gold: true, blush: false };
  return { teal: false, gold: false, blush: true };
}

export default function AlumniCard({ student, index }: { student: Student; index: number }) {
  const initials = getInitials(student.name);
  const specColor = getSpecColor(student.specialization);
  const topSkills = student.expertise.slice(0, 3);

  const headerBg = specColor.teal ? "#2d6060" : specColor.gold ? "#c98a20" : "#c07878";
  const stampColor = specColor.teal ? "#2d6060" : specColor.gold ? "#c98a20" : "#b56060";

  return (
    <Link href={`/profile/${encodeURIComponent(student.id)}`} className="block group" tabIndex={0}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.35,
          delay: index * 0.05,
          ease: [0.16, 1, 0.3, 1],
        }}
        whileHover={{
          y: -5,
          rotate: 0.5,
          transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
        }}
        style={{ willChange: "transform" }}
        className="relative overflow-hidden cursor-pointer rounded-md"
        /* Gold border card */
        css-data-card="true"
      >
        {/* Outer gold border shell */}
        <div
          className="rounded-md overflow-hidden transition-all duration-[250ms]"
          style={{
            border: "2px solid #e8a830",
            boxShadow: "0 4px 12px rgba(45,96,96,0.07)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.boxShadow =
              "0 12px 24px rgba(0,0,0,0.12), 0 0 0 2px #e8a830";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.boxShadow =
              "0 4px 12px rgba(45,96,96,0.07)";
          }}
        >
          {/* Teal header strip */}
          <div
            className="px-4 py-4 flex items-center gap-3"
            style={{ background: headerBg }}
          >
            {/* CSS-only initials avatar circle */}
            <div
              className="shrink-0 flex items-center justify-center rounded-full text-white font-bold text-sm shadow-inner"
              style={{
                width: 44,
                height: 44,
                background: "rgba(255,255,255,0.18)",
                border: "2px solid rgba(255,255,255,0.35)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "0.9rem",
                letterSpacing: "-0.01em",
              }}
            >
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              <h3
                className="truncate text-white leading-tight"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "1rem",
                  letterSpacing: "-0.01em",
                }}
              >
                {student.name}
              </h3>
              {/* Stamp badge */}
              <span
                className="inline-block mt-1 px-2 py-0.5 rounded-sm text-white/80 border border-white/30"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: "0.55rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                {student.specialization || "IT"}
              </span>
            </div>
          </div>

          {/* Cream body */}
          <div
            className="px-4 pb-4 pt-3"
            style={{ background: "#faf8f3" }}
          >
            {/* Group / Email */}
            <div
              className="flex items-center gap-2 mb-3 text-xs"
              style={{ color: "#6b5e4e", fontFamily: "var(--font-sans)" }}
            >
              <BookOpen size={12} className="opacity-60 shrink-0" />
              <span>Group {student.group}</span>
              {student.email && (
                <>
                  <span className="opacity-30">•</span>
                  <span className="truncate max-w-[140px]" title={student.email}>
                    {student.email}
                  </span>
                </>
              )}
            </div>

            {/* Skills */}
            {topSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {topSkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 rounded-sm text-xs font-medium"
                    style={{
                      fontFamily: "var(--font-sans)",
                      background: "#f3f0e8",
                      color: "#6b5e4e",
                      border: "1px solid rgba(45,96,96,0.12)",
                      boxShadow: "1px 1px 0 rgba(45,96,96,0.06)",
                    }}
                  >
                    {skill}
                  </span>
                ))}
                {student.expertise.length > 3 && (
                  <span
                    className="px-2 py-1 rounded-sm text-xs font-medium"
                    style={{
                      fontFamily: "var(--font-sans)",
                      background: "#f3f0e8",
                      color: "#9a8e82",
                      border: "1px solid rgba(45,96,96,0.10)",
                    }}
                  >
                    +{student.expertise.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Perforated divider */}
            <div className="perf-divider mb-3" />

            {/* Social Links */}
            <div className="flex items-center gap-2">
              {student.linkedin && (
                <span
                  role="link"
                  tabIndex={0}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(student.linkedin, "_blank", "noopener,noreferrer"); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); window.open(student.linkedin, "_blank", "noopener,noreferrer"); }}}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-0.5 relative group/link"
                  style={{
                    fontFamily: "var(--font-sans)",
                    background: "rgba(45,96,96,0.08)",
                    color: "#2d6060",
                    border: "1px solid rgba(45,96,96,0.18)",
                    borderRadius: "4px",
                  }}
                >
                  <LinkedinIcon width={12} height={12} />
                  LinkedIn
                </span>
              )}
              {student.github && (
                <span
                  role="link"
                  tabIndex={0}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(student.github, "_blank", "noopener,noreferrer"); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); window.open(student.github, "_blank", "noopener,noreferrer"); }}}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    fontFamily: "var(--font-sans)",
                    background: "rgba(45,96,96,0.05)",
                    color: "#1a1a1a",
                    border: "1px solid rgba(45,96,96,0.12)",
                    borderRadius: "4px",
                  }}
                >
                  <GithubIcon width={12} height={12} />
                  GitHub
                </span>
              )}
              {!student.linkedin && !student.github && student.email && (
                <a
                  href={`mailto:${student.email}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    fontFamily: "var(--font-sans)",
                    background: "rgba(45,96,96,0.05)",
                    color: "#6b5e4e",
                    border: "1px solid rgba(45,96,96,0.10)",
                    borderRadius: "4px",
                  }}
                >
                  <Mail size={12} />
                  Email
                </a>
              )}
              {!student.linkedin && !student.github && !student.email && (
                <span
                  className="text-xs italic"
                  style={{ color: "#9a8e82", fontFamily: "var(--font-sans)" }}
                >
                  No links available
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
