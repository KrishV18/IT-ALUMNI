"use client";

import { useState } from "react";
import { Student } from "@/types/student";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Mail } from "lucide-react";


function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function getGroupColor(group: string): { bg: string; border: string } {
  // Use the green/teal color for all cards to maintain a uniform aesthetic
  return { bg: "#2d6060", border: "#2d6060" };
}

/** Build a short summary line from the student's data */
function getHighlight(student: Student): string {
  if (student.internships.length > 0) return `🏢 ${student.internships[0].organization || student.internships[0].title}`;
  if (student.projects.length > 0) return `💻 ${student.projects[0].title}`;
  if (student.startups.length > 0) return `🚀 ${student.startups[0].name}`;
  if (student.events.length > 0) return `🏆 ${student.events[0].name}`;
  if (student.moocCourses.length > 0) return `📚 ${student.moocCourses[0].name}`;
  if (student.nptelCourses.length > 0) return `📖 ${student.nptelCourses[0].name}`;
  return "";
}

/** Count total activities for a badge */
function totalActivities(student: Student): number {
  return student.events.length + student.internships.length + student.projects.length
    + student.moocCourses.length + student.nptelCourses.length + student.certifications.length
    + student.startups.length + student.volunteering.length + student.researchPapers.length;
}

/** Photo with fallback: local API → drive URL → initials */
function CardPhoto({ localPath, driveSrc, alt, initials }: {
  localPath: string; driveSrc: string; alt: string; initials: string;
}) {
  const sources = [localPath, driveSrc].filter(Boolean);
  const [idx, setIdx] = useState(0);

  if (!sources.length || idx >= sources.length) {
    return <>{initials}</>;
  }
  return (
    <img
      src={sources[idx]}
      alt={alt}
      className="w-full h-full object-cover"
      onError={() => setIdx((i) => i + 1)}
      referrerPolicy="no-referrer"
    />
  );
}


export default function AlumniCard({ student, index }: { student: Student; index: number }) {
  const initials = getInitials(student.name);
  const colors = getGroupColor(student.group);
  const highlight = getHighlight(student);
  const actCount = totalActivities(student);

  return (
    <Link href={`/profile/${encodeURIComponent(student.id)}`} className="block group" tabIndex={0}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ y: -5, rotate: 0.5, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
        style={{ willChange: "transform" }}
        className="relative overflow-hidden cursor-pointer rounded-md"
      >
        <div
          className="rounded-md overflow-hidden transition-all duration-[250ms]"
          style={{ border: "2px solid #e8a830", boxShadow: "0 4px 12px rgba(45,96,96,0.07)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 24px rgba(0,0,0,0.12), 0 0 0 2px #e8a830"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 12px rgba(45,96,96,0.07)"; }}
        >
          {/* Header strip */}
          <div className="px-4 py-4 flex items-center gap-3" style={{ background: colors.bg }}>
            {/* Photo or initials avatar */}
            <div
              className="shrink-0 flex items-center justify-center rounded-full text-white font-bold text-sm shadow-inner overflow-hidden"
              style={{
                width: 44, height: 44,
                background: (student.localPhotoPath || student.photograph) ? "transparent" : "rgba(255,255,255,0.18)",
                border: "2px solid rgba(255,255,255,0.35)",
                fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem",
              }}
            >
              {(student.localPhotoPath || student.photograph) ? (
                <CardPhoto
                  localPath={student.localPhotoPath}
                  driveSrc={student.photograph}
                  alt={student.name}
                  initials={initials}
                />
              ) : initials}
            </div>

            <div className="flex-1 min-w-0">
              <h3
                className="truncate text-white leading-tight"
                style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.01em" }}
              >
                {student.name}
              </h3>
              <span
                className="inline-block mt-1 px-2 py-0.5 rounded-sm text-white/80 border border-white/30"
                style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase" }}
              >
                Group {student.group}
              </span>
            </div>

            {/* Activity count badge */}
            {actCount > 0 && (
              <div
                className="shrink-0 flex items-center justify-center rounded-full text-white font-bold"
                style={{ width: 28, height: 28, background: "rgba(255,255,255,0.22)", fontSize: "0.7rem", fontFamily: "var(--font-display)" }}
                title={`${actCount} activities`}
              >
                {actCount}
              </div>
            )}
          </div>

          {/* Cream body */}
          <div className="px-4 pb-4 pt-3" style={{ background: "#faf8f3" }}>
            {/* Group / Email */}
            <div className="flex items-center gap-2 mb-3 text-xs" style={{ color: "#6b5e4e", fontFamily: "var(--font-sans)" }}>
              <BookOpen size={12} className="opacity-60 shrink-0" />
              <span className="shrink-0">{student.enrollmentNo}</span>
              {student.email && (
                <>
                  <span className="opacity-30 shrink-0">•</span>
                  <span className="truncate max-w-[100px] sm:max-w-[140px]" title={student.email}>{student.email}</span>
                </>
              )}
            </div>

            {/* Highlight */}
            {highlight && (
              <div className="mb-3 px-2.5 py-1.5 rounded-sm text-xs" style={{
                fontFamily: "var(--font-sans)", background: "#f3f0e8", color: "#6b5e4e",
                border: "1px solid rgba(45,96,96,0.12)", boxShadow: "1px 1px 0 rgba(45,96,96,0.06)",
              }}>
                {highlight}
              </div>
            )}

            {/* Perforated divider */}
            <div className="perf-divider mb-3" />

            {/* Mentor + Contact */}
            <div className="flex items-center gap-2">
              {student.mentor && (
                <span
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium"
                  style={{
                    fontFamily: "var(--font-sans)", background: "rgba(45,96,96,0.08)",
                    color: "#2d6060", border: "1px solid rgba(45,96,96,0.18)", borderRadius: "4px",
                  }}
                >
                  👨‍🏫 {student.mentor.split(" ").slice(0, 2).join(" ")}
                </span>
              )}
              {student.email && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.href = `mailto:${student.email}`;
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    fontFamily: "var(--font-sans)", background: "rgba(45,96,96,0.05)",
                    color: "#6b5e4e", border: "1px solid rgba(45,96,96,0.10)", borderRadius: "4px",
                  }}
                >
                  <Mail size={12} />
                  Email
                </button>
              )}
              {!student.mentor && !student.email && (
                <span className="text-xs italic" style={{ color: "#9a8e82", fontFamily: "var(--font-sans)" }}>
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
