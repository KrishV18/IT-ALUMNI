import { fetchAllStudents } from "@/services/sheetsService";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Student, StudentResult } from "@/types/student";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const revalidate = 0;

// ─── Helpers ────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function getBestCGPA(r?: StudentResult): string {
  if (!r) return "";
  const vals = [r.sem1, r.sem2, r.sem3, r.sem4, r.sem5, r.sem6, r.sem7, r.sem8].filter((v): v is number => v !== undefined);
  if (!vals.length) return "";
  return vals[vals.length - 1].toFixed(2);
}

// Paper clip SVG — unchanged
function PaperClip() {
  return (
    <svg className="yearbook-paperclip" viewBox="0 0 40 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2C12 2 6 8 6 16V56C6 64 12 70 20 70C28 70 34 64 34 56V20C34 14 30 10 24 10C18 10 14 14 14 20V52"
            stroke="#111" strokeWidth="4" strokeLinecap="round" fill="none"/>
      <path d="M20 2C12 2 6 8 6 16V56C6 64 12 70 20 70C28 70 34 64 34 56V20C34 14 30 10 24 10C18 10 14 14 14 20V52"
            stroke="#ccc" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

// Push pin SVG — unchanged
function PushPin() {
  return (
    <svg className="yearbook-pin" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 20 L28 35" stroke="rgba(0,0,0,0.3)" strokeWidth="3" strokeLinecap="round"/>
      <path d="M12 20 C10 16 12 10 16 8 C20 6 26 8 28 12 C30 16 28 22 24 24 C20 26 14 24 12 20 Z" fill="#f8b0bc" stroke="#111" strokeWidth="2"/>
      <path d="M16 12 C18 10 22 10 24 12" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <path d="M18 20 L22 32" stroke="#111" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function EmptyInline({ width = "w-32" }: { width?: string }) {
  return <span className={`inline-block border-b-2 border-[#111] opacity-20 ${width} ml-2`} />;
}

function EmptyLines({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="yearbook-line" />
      ))}
    </>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const students = await fetchAllStudents();
  const student = students.find((s) => s.id === decodeURIComponent(id)) as Student | undefined;
  if (!student) notFound();

  const hasInternships    = student.internships    && student.internships.length > 0;
  const hasActivities     = student.activities     && student.activities.length > 0;
  const hasPrizes         = student.prizes         && student.prizes.length > 0;
  const hasCertifications = student.certifications && student.certifications.length > 0;

  const currentIndex = students.findIndex((s) => s.id === decodeURIComponent(id));
  const prevStudent  = currentIndex > 0 ? students[currentIndex - 1] : null;
  const nextStudent  = currentIndex < students.length - 1 ? students[currentIndex + 1] : null;

  const semData: { label: string; value: number }[] = [];
  if (student.results) {
    (["sem1","sem2","sem3","sem4","sem5","sem6","sem7","sem8"] as const).forEach((sem, i) => {
      const val = student.results?.[sem];
      if (val !== undefined) semData.push({ label: `Sem ${i + 1}`, value: val });
    });
  }

  return (
    <div className="bg-background min-h-screen py-8 md:py-12 px-4 pb-24 md:pb-12">
      <div className="max-w-4xl mx-auto relative">

        {/* Navigation Arrows */}
        {prevStudent && (
          <Link
            href={`/profile/${encodeURIComponent(prevStudent.id)}`}
            className="yearbook-nav-arrow left no-print hidden md:flex"
            title={`Previous: ${prevStudent.name}`}
          >
            <ChevronLeft size={32} />
          </Link>
        )}
        {nextStudent && (
          <Link
            href={`/profile/${encodeURIComponent(nextStudent.id)}`}
            className="yearbook-nav-arrow right no-print hidden md:flex"
            title={`Next: ${nextStudent.name}`}
          >
            <ChevronRight size={32} />
          </Link>
        )}

        {/* ═══ GOLD FRAME ═══ */}
        <div className="yearbook-frame">
          <div className="yearbook-page">

            {/* Paper Clip decoration */}
            <PaperClip />

            {/* ── HEADER BANNER ── */}
            <div className="yearbook-header">
              {/* Back button — translateX(-3px) on hover feels like turning a page */}
              <Link
                href="/directory"
                className="back-btn-link text-white no-print flex items-center"
                title="Back to Directory"
              >
                <ChevronLeft size={32} strokeWidth={4} />
              </Link>
              <h1>Student Profile</h1>
            </div>

            {/* ── TOP SECTION: Photo + Info + Folder ── */}
            {/* Folder card slides in from right with stagger */}
            <div className="yearbook-teal-bg">
              {/* Polaroid Photo */}
              <div className="yearbook-polaroid">
                <PushPin />
                <div className="yearbook-polaroid-inner">
                  {student.image ? (
                    <img src={student.image} alt={student.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-6xl font-bold opacity-20" style={{ fontFamily: "var(--font-display)", color: "#111" }}>
                      {getInitials(student.name)}
                    </span>
                  )}
                </div>
                {/* Student name in Syne 700 */}
                <div className="yearbook-polaroid-name">
                  {student.name.split(" ")[0]} {student.name.split(" ")[1] || ""}
                </div>
              </div>

              {/* Info Bullets — DM Sans body text */}
              <ul className="yearbook-info-list">
                <li>Name: <strong style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>{student.name}</strong></li>
                <li>Enrollment no.: {student.enrollmentNo || "—"}</li>
                <li>Email:{" "}
                  {student.email ? (
                    <a href={`mailto:${student.email}`} className="social-link">{student.email}</a>
                  ) : "—"}
                </li>
                <li>Expertise: {student.specialization || "IT"}</li>
                {student.contact && <li>Contact: {student.contact}</li>}
                {student.group && <li>Group: {student.group}</li>}
                {student.linkedin && (
                  <li>
                    LinkedIn:{" "}
                    <a href={student.linkedin} target="_blank" rel="noopener noreferrer" className="social-link">
                      Profile
                    </a>
                  </li>
                )}
                {student.github && (
                  <li>
                    GitHub:{" "}
                    <a href={student.github} target="_blank" rel="noopener noreferrer" className="social-link">
                      {student.github.replace("https://github.com/", "@")}
                    </a>
                  </li>
                )}
              </ul>

              {/* Manila Folder — slide-in animation via CSS */}
              <div
                className="yearbook-folder"
                style={{
                  animation: "slideInRight 0.4s cubic-bezier(0.16,1,0.3,1) 0.2s both",
                }}
              >
                <div className="yearbook-folder-tab">PLACEMENT DETAILS</div>
                <div className="yearbook-folder-body">
                  <ul className="yearbook-info-list" style={{ color: "#111" }}>
                    <li>Company: <EmptyInline width="w-40" /></li>
                    <li>Role: <EmptyInline width="w-32" /></li>
                    <li>Package: <EmptyInline width="w-24" /></li>
                  </ul>

                  <h4>INTERNSHIPS DONE</h4>
                  {hasInternships ? (
                    student.internships!.map((intern, i) => (
                      <ul
                        key={i}
                        className="yearbook-info-list mb-3"
                        style={{
                          color: "#111",
                          animation: `slideInRight 0.35s cubic-bezier(0.16,1,0.3,1) ${0.3 + i * 0.1}s both`,
                        }}
                      >
                        <li>Company: {intern.company || <EmptyInline />}</li>
                        {intern.duration && <li>Duration: {intern.duration}</li>}
                        {intern.stipend && <li>Stipend: {intern.stipend}</li>}
                      </ul>
                    ))
                  ) : (
                    <ul className="yearbook-info-list" style={{ color: "#111" }}>
                      <li>Company: <EmptyInline width="w-32" /></li>
                      <li>Duration: <EmptyInline width="w-20" /></li>
                      <li>Stipend: <EmptyInline width="w-16" /></li>
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* ── GRID SECTIONS ── */}
            <div className="yearbook-grid-container">

              {/* LEFT COLUMN */}
              <div className="yearbook-col">

                {/* SKILLS */}
                <div className="yearbook-section">
                  <h3>SKILLS</h3>
                  {student.expertise.length > 0 ? (
                    student.expertise.map((sk) => (
                      <div key={sk} className="yearbook-item">{sk}</div>
                    ))
                  ) : <EmptyLines />}
                </div>

                {/* HACKATHONS */}
                <div className="yearbook-section">
                  <h3>HACKATHONS</h3>
                  {hasActivities ? (
                    student.activities!.map((act, i) => (
                      <div key={i} className="yearbook-item">
                        {act.eventName}{" "}
                        <span style={{ fontSize: "0.8rem", color: "#6b5e4e" }}>({act.role})</span>
                      </div>
                    ))
                  ) : <EmptyLines count={4} />}
                </div>

                {/* SIGNATURE QUOTE — settles from -2deg to -1deg */}
                <div className="yearbook-sticky-wrapper">
                  <div className="yearbook-sticky-shadow" />
                  <div className="yearbook-sticky">
                    <h3>SIGNATURE QUOTE</h3>
                    <p>
                      &ldquo;Either you run the day, or the day runs you&rdquo;
                    </p>
                    <div className="signature">{student.name.split(" ")[0]}</div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="yearbook-col yearbook-col-right">

                {/* COURSES */}
                <div className="yearbook-section">
                  <h3>COURSES</h3>
                  {semData.length > 0 ? (
                    semData.map((s) => (
                      <div key={s.label} className="yearbook-item">
                        <span>{s.label}</span>
                        <strong>{s.value.toFixed(2)}</strong>
                      </div>
                    ))
                  ) : hasCertifications ? (
                    student.certifications!.map((cert, i) => (
                      <div key={i} className="yearbook-item">{cert.name}</div>
                    ))
                  ) : <EmptyLines count={4} />}
                </div>

                {/* PROJECTS */}
                <div className="yearbook-section">
                  <h3>PROJECTS</h3>
                  <EmptyLines count={3} />
                </div>

                {/* ACHIEVEMENTS */}
                <div className="yearbook-section">
                  <h3>ACHIEVEMENTS</h3>
                  {hasPrizes ? (
                    student.prizes!.map((prize, i) => (
                      <div key={i} className="yearbook-item">{prize.eventName}</div>
                    ))
                  ) : <EmptyLines count={3} />}
                </div>

                {/* PRIZES WON & SOCIETY */}
                <div className="yearbook-section split">
                  <div>
                    <h3>PRIZES WON</h3>
                    {hasPrizes ? (
                      student.prizes!.map((prize, i) => (
                        <div key={i} className="yearbook-item" style={{ fontSize: "0.8rem" }}>
                          {prize.position && <span className="mr-1">🥇</span>}
                          {prize.eventName}
                        </div>
                      ))
                    ) : <EmptyLines count={2} />}
                  </div>
                  <div>
                    <h3>SOCIETY</h3>
                    {student.societies && student.societies !== "None" && student.societies !== "none" ? (
                      student.societies.split(/[,;&/\n]+/).map(s => s.trim()).filter(Boolean).map((soc, i) => (
                        <div key={i} className="yearbook-item">{soc}</div>
                      ))
                    ) : <EmptyLines count={2} />}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* Mobile nav arrows */}
        <div className="flex justify-between mt-8 md:hidden no-print">
          {prevStudent ? (
            <Link
              href={`/profile/${encodeURIComponent(prevStudent.id)}`}
              className="flex items-center gap-1 text-sm font-bold text-white px-6 py-3 rounded shadow-md"
              style={{ background: "#2d6060", border: "2px solid #e8a830" }}
            >
              <ChevronLeft size={18} /> Previous
            </Link>
          ) : <div />}
          {nextStudent ? (
            <Link
              href={`/profile/${encodeURIComponent(nextStudent.id)}`}
              className="flex items-center gap-1 text-sm font-bold text-white px-6 py-3 rounded shadow-md"
              style={{ background: "#2d6060", border: "2px solid #e8a830" }}
            >
              Next <ChevronRight size={18} />
            </Link>
          ) : <div />}
        </div>

      </div>

      {/* Slide-in keyframe for folder + internship cards */}
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
