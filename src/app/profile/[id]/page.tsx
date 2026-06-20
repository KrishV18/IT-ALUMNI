import { fetchAllStudents } from "@/services/sheetsService";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Student } from "@/types/student";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProfilePhoto from "@/components/ProfilePhoto";

export const revalidate = 0;

// ─── Helpers ────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function PaperClip() {
  return (
    <svg className="yearbook-paperclip" viewBox="0 0 40 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2C12 2 6 8 6 16V56C6 64 12 70 20 70C28 70 34 64 34 56V20C34 14 30 10 24 10C18 10 14 14 14 20V52"
        stroke="#111" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M20 2C12 2 6 8 6 16V56C6 64 12 70 20 70C28 70 34 64 34 56V20C34 14 30 10 24 10C18 10 14 14 14 20V52"
        stroke="#ccc" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function PushPin() {
  return (
    <svg className="yearbook-pin" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 20 L28 35" stroke="rgba(0,0,0,0.3)" strokeWidth="3" strokeLinecap="round" />
      <path d="M12 20 C10 16 12 10 16 8 C20 6 26 8 28 12 C30 16 28 22 24 24 C20 26 14 24 12 20 Z" fill="#f8b0bc" stroke="#111" strokeWidth="2" />
      <path d="M16 12 C18 10 22 10 24 12" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <path d="M18 20 L22 32" stroke="#111" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Item card used across all sections — consistent look */
function ItemCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col p-3.5 rounded-md shadow-sm" style={{ background: "#f3f0e8", border: "1px solid rgba(45,96,96,0.15)" }}>
      {children}
    </div>
  );
}

/** Badge pill */
function Badge({ text }: { text: string }) {
  return (
    <span className="shrink-0 px-2 py-0.5 rounded-sm text-[0.6rem] font-bold uppercase tracking-wider"
      style={{ background: "rgba(45,96,96,0.1)", color: "#2d6060", border: "1px solid rgba(45,96,96,0.2)" }}>
      {text}
    </span>
  );
}

/** Empty state for sections with no data */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-6 px-4 text-center rounded-md" style={{ background: "#f3f0e8", border: "1px dashed rgba(45,96,96,0.2)" }}>
      <p className="text-sm italic" style={{ fontFamily: "var(--font-sans)", color: "#6b5e4e", opacity: 0.6 }}>{message}</p>
    </div>
  );
}

/** Section wrapper — renders title + children, shows empty state if isEmpty */
function Section({ title, children, isEmpty, emptyMessage }: { title: string; children: React.ReactNode; isEmpty?: boolean; emptyMessage?: string }) {
  if (isEmpty && !emptyMessage) return null;
  return (
    <div className="yearbook-section">
      <h3>{title}</h3>
      {isEmpty ? <EmptyState message={emptyMessage || "No data available"} /> : children}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const students = await fetchAllStudents();
  const student = students.find((s) => s.id === decodeURIComponent(id)) as Student | undefined;
  if (!student) notFound();

  const currentIndex = students.findIndex((s) => s.id === decodeURIComponent(id));
  const prevStudent = currentIndex > 0 ? students[currentIndex - 1] : null;
  const nextStudent = currentIndex < students.length - 1 ? students[currentIndex + 1] : null;

  // Aggregate courses
  const allCourses = [
    ...student.moocCourses.map((c) => ({ name: c.name, detail: c.educator || c.duration, type: "MOOC" })),
    ...student.nptelCourses.map((c) => ({ name: c.name, detail: c.iit || c.educator, type: "NPTEL" })),
    ...student.certifications.map((c) => ({ name: c.name, detail: c.educator || c.duration, type: "Certification" })),
  ];

  // Separate events
  const hackathons = student.events.filter((e) => e.type === "Hackathon");
  const techEvents = student.events.filter((e) => e.type === "Technical");
  const nonTechEvents = student.events.filter((e) => e.type === "Non-Technical");
  const sportEvents = student.events.filter((e) => e.type === "Sport");
  const culturalEvents = student.events.filter((e) => e.type === "Cultural");
  const workshopEvents = student.events.filter((e) => e.type === "Workshop");
  const societyEvents = student.events.filter((e) => e.type === "Society");
  const additionalEvents = student.events.filter((e) => e.type === "Additional");

  // Content flags
  const hasEvents = student.events.length > 0;
  const hasCourses = allCourses.length > 0;
  const hasInternships = student.internships.length > 0;
  const hasProjects = student.projects.length > 0;
  const hasStartups = student.startups.length > 0;
  const hasResearch = student.researchPapers.length > 0;
  const hasVolunteering = student.volunteering.length > 0;
  const hasNGO = student.ngoWork.length > 0;
  const hasHigherEd = student.higherEducation.length > 0;
  const hasCoding = student.competitiveCoding.length > 0;
  const hasCareer = hasInternships || hasStartups;

  // Check if left/right columns have any content
  const hasLeftContent = hasEvents || societyEvents.length > 0 || hasVolunteering || hasNGO;
  const hasRightContent = hasCourses || hasProjects || hasResearch || hasHigherEd || hasCoding || additionalEvents.length > 0 || (hasStartups && hasInternships);
  const hasBothColumns = hasLeftContent && hasRightContent;

  return (
    <div className="bg-background min-h-screen py-8 md:py-12 px-4 pb-24 md:pb-12" style={{ overflowX: "hidden" }}>
      <div className="max-w-4xl mx-auto relative">

        {/* Nav Arrows */}
        {prevStudent && (
          <Link href={`/profile/${encodeURIComponent(prevStudent.id)}`} className="yearbook-nav-arrow left no-print hidden md:flex" title={`Previous: ${prevStudent.name}`}>
            <ChevronLeft size={32} />
          </Link>
        )}
        {nextStudent && (
          <Link href={`/profile/${encodeURIComponent(nextStudent.id)}`} className="yearbook-nav-arrow right no-print hidden md:flex" title={`Next: ${nextStudent.name}`}>
            <ChevronRight size={32} />
          </Link>
        )}

        {/* ═══ GOLD FRAME ═══ */}
        <div className="yearbook-frame">
          <div className="yearbook-page">

            <PaperClip />

            {/* ── HEADER ── */}
            <div className="yearbook-header">
              <Link href="/directory" className="back-btn-link text-white no-print flex items-center" title="Back to Directory">
                <ChevronLeft size={32} strokeWidth={4} />
              </Link>
              <h1>Student Profile</h1>
            </div>

            {/* ── TOP: Photo + Info + Folder ── */}
            <div className="yearbook-teal-bg">
              {/* Polaroid */}
              <div className="yearbook-polaroid">
                <PushPin />
                <div className="yearbook-polaroid-inner">
                  <ProfilePhoto
                    src={student.localPhotoPath}
                    fallbackSrc={student.photograph}
                    alt={student.name}
                    initials={getInitials(student.name)}
                  />

                </div>
                <div className="yearbook-polaroid-name">
                  {student.name.split(" ")[0]} {student.name.split(" ")[1] || ""}
                </div>
              </div>

              {/* Info */}
              <ul className="yearbook-info-list">
                <li>Name: <strong style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>{student.name}</strong></li>
                <li>Enrollment: {student.enrollmentNo || "—"}</li>
                <li>Email:{" "}
                  {student.email ? (
                    <a href={`mailto:${student.email}`} className="social-link" style={{ wordBreak: "break-all" }}>{student.email}</a>
                  ) : "—"}
                </li>
                <li>Group: {student.group || "—"}</li>
                <li>Mentor: <span style={{ wordBreak: "break-word" }}>{student.mentor || "—"}</span></li>
                {student.contact && <li>Contact: {student.contact}</li>}
              </ul>

              {/* Career Folder — only if there's actual data */}
              {hasCareer && (
                <div className="yearbook-folder" style={{ animation: "slideInRight 0.4s cubic-bezier(0.16,1,0.3,1) 0.2s both" }}>
                  <div className="yearbook-folder-tab">
                    {hasInternships ? "INTERNSHIP DETAILS" : "STARTUP DETAILS"}
                  </div>
                  <div className="yearbook-folder-body">
                    {hasInternships ? (
                      student.internships.map((intern, i) => (
                        <ul key={i} className="yearbook-info-list mb-3" style={{ color: "#111", animation: `slideInRight 0.35s cubic-bezier(0.16,1,0.3,1) ${0.3 + i * 0.1}s both` }}>
                          {intern.organization && <li>Organization: {intern.organization}</li>}
                          {intern.title && <li>Role: {intern.title}</li>}
                          {intern.technology && <li>Technology: {intern.technology}</li>}
                          {intern.duration && <li>Duration: {intern.duration}</li>}
                          {intern.startDate && <li>Period: {intern.startDate}{intern.endDate ? ` – ${intern.endDate}` : ""}</li>}
                        </ul>
                      ))
                    ) : (
                      student.startups.map((s, i) => (
                        <ul key={i} className="yearbook-info-list mb-3" style={{ color: "#111" }}>
                          <li>Startup: {s.name}</li>
                          {s.detail && <li>About: {s.detail.slice(0, 120)}{s.detail.length > 120 ? "…" : ""}</li>}
                          {s.role && <li>Role: {s.role}</li>}
                        </ul>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── GRID SECTIONS ── */}
            {(hasLeftContent || hasRightContent) ? (
              <div className="yearbook-grid-container" style={!hasBothColumns ? { display: "block" } : undefined}>

                {/* LEFT COLUMN — events, society, volunteering, NGO */}
                {hasLeftContent && (
                  <div className={hasBothColumns ? "yearbook-col" : "yearbook-col"} style={!hasBothColumns ? { maxWidth: "100%" } : undefined}>

                    <Section title="EVENTS & COMPETITIONS" isEmpty={!hasEvents}>
                      <div className="flex flex-col gap-6 mt-2">
                        {[
                          { label: "Hackathons", items: hackathons },
                          { label: "Technical", items: techEvents },
                          { label: "Non-Technical", items: nonTechEvents },
                          { label: "Sports", items: sportEvents },
                          { label: "Cultural", items: culturalEvents },
                          { label: "Workshops", items: workshopEvents },
                        ].filter(({ items }) => items.length > 0).map(({ label, items }) => (
                          <div key={label}>
                            <p className="text-xs font-bold mb-2" style={{ color: "#2d6060", fontFamily: "var(--font-display)", letterSpacing: "0.04em" }}>{label}</p>
                            <div className="flex flex-col gap-3">
                              {items.map((ev, i) => (
                                <ItemCard key={i}>
                                  <div className="flex justify-between items-start gap-3">
                                    <span className="font-bold text-[#1a1a1a] text-[0.95rem] leading-tight">{ev.name}</span>
                                    {ev.category && <Badge text={ev.category} />}
                                  </div>
                                  {ev.position && (
                                    <div className="mt-2 pt-2 text-[0.85rem] text-[#2d6060] font-medium" style={{ borderTop: "1px dashed rgba(45,96,96,0.2)" }}>
                                      Position: {ev.position}
                                    </div>
                                  )}
                                </ItemCard>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Section>

                    <Section title="SOCIETY PARTICIPATION" isEmpty={societyEvents.length === 0}>
                      <div className="flex flex-col gap-3 mt-2">
                        {societyEvents.map((ev, i) => (
                          <ItemCard key={i}>
                            <div className="flex justify-between items-start gap-3">
                              <span className="font-bold text-[#1a1a1a] text-[0.95rem] leading-tight">{ev.societyName}</span>
                              {ev.role && <Badge text={ev.role} />}
                            </div>
                            {ev.name && <div className="mt-1.5 text-sm text-[#6b5e4e]">{ev.name}</div>}
                          </ItemCard>
                        ))}
                      </div>
                    </Section>

                    <Section title="VOLUNTEERING" isEmpty={!hasVolunteering}>
                      <div className="flex flex-col gap-3 mt-2">
                        {student.volunteering.map((v, i) => (
                          <ItemCard key={i}>
                            <div className="flex justify-between items-start gap-3">
                              <span className="font-bold text-[#1a1a1a] text-[0.95rem] leading-tight">{v.organization}</span>
                              {v.role && <Badge text={v.role} />}
                            </div>
                            {v.eventName && <div className="mt-1.5 text-sm text-[#6b5e4e]">{v.eventName}</div>}
                          </ItemCard>
                        ))}
                      </div>
                    </Section>

                    <Section title="NGO WORK" isEmpty={!hasNGO}>
                      <div className="flex flex-col gap-3 mt-2">
                        {student.ngoWork.map((n, i) => (
                          <ItemCard key={i}>
                            <div className="flex justify-between items-start gap-3">
                              <span className="font-bold text-[#1a1a1a] text-[0.95rem] leading-tight">{n.name}</span>
                              {n.role && <Badge text={n.role} />}
                            </div>
                            {n.about && (
                              <div className="mt-2 pt-2 text-[0.8rem] text-[#6b5e4e] leading-snug" style={{ borderTop: "1px dashed rgba(45,96,96,0.2)" }}>
                                {n.about}
                              </div>
                            )}
                          </ItemCard>
                        ))}
                      </div>
                    </Section>
                  </div>
                )}

                {/* Signature Quote — between columns or below single column */}
                {hasLeftContent && hasBothColumns && (
                  <div className="yearbook-col" style={{ flex: "unset", width: "auto", minWidth: 0, maxWidth: "none" }}>
                    {/* Spacer — quote goes at bottom of left col in CSS */}
                  </div>
                )}

                {/* RIGHT COLUMN — courses, projects, research, etc */}
                {hasRightContent && (
                  <div className={hasBothColumns ? "yearbook-col yearbook-col-right" : "yearbook-col"} style={!hasBothColumns ? { maxWidth: "100%", borderLeft: "none", paddingLeft: 0 } : undefined}>

                    <Section title="COURSES & CERTIFICATIONS" isEmpty={!hasCourses}>
                      <div className="flex flex-col gap-3 mt-2">
                        {allCourses.map((c, i) => (
                          <ItemCard key={i}>
                            <div className="flex justify-between items-start gap-3">
                              <span className="font-bold text-[#1a1a1a] text-[0.95rem] leading-tight">{c.name}</span>
                              {c.type && <Badge text={c.type} />}
                            </div>
                            {c.detail && <div className="mt-1.5 text-[0.85rem] text-[#6b5e4e] font-medium">{c.detail}</div>}
                          </ItemCard>
                        ))}
                      </div>
                    </Section>

                    <Section title="PROJECTS" isEmpty={!hasProjects}>
                      <div className="flex flex-col gap-3 mt-2">
                        {student.projects.map((p, i) => (
                          <ItemCard key={i}>
                            <div className="flex justify-between items-start mb-1 gap-3">
                              <span className="font-bold text-[#1a1a1a] text-[0.95rem] leading-tight">{p.title}</span>
                              {p.type && <Badge text={p.type} />}
                            </div>
                            {p.domain && (
                              <div className="text-[0.85rem] text-[#2d6060] font-medium mt-1">{p.domain}</div>
                            )}
                          </ItemCard>
                        ))}
                      </div>
                    </Section>

                    {hasStartups && hasInternships && (
                      <Section title="STARTUPS" isEmpty={false}>
                        <div className="flex flex-col gap-3 mt-2">
                          {student.startups.map((s, i) => (
                            <ItemCard key={i}>
                              <div className="flex justify-between items-start gap-3">
                                <span className="font-bold text-[#1a1a1a] text-[0.95rem] leading-tight">{s.name}</span>
                                {s.role && <Badge text={s.role} />}
                              </div>
                              {s.detail && (
                                <div className="mt-2 pt-2 text-[0.8rem] text-[#6b5e4e] leading-snug" style={{ borderTop: "1px dashed rgba(45,96,96,0.2)" }}>
                                  {s.detail}
                                </div>
                              )}
                            </ItemCard>
                          ))}
                        </div>
                      </Section>
                    )}

                    <Section title="RESEARCH PAPERS" isEmpty={!hasResearch}>
                      <div className="flex flex-col gap-3 mt-2">
                        {student.researchPapers.map((r, i) => (
                          <ItemCard key={i}>
                            <span className="font-bold text-[#1a1a1a] text-[0.95rem] leading-tight mb-1">{r.title}</span>
                            {r.conference && <div className="text-[0.85rem] text-[#2d6060] font-medium mb-1">Conference: {r.conference}</div>}
                            {r.authors && <div className="text-[0.8rem] text-[#6b5e4e]">Authors: {r.authors}</div>}
                          </ItemCard>
                        ))}
                      </div>
                    </Section>

                    <Section title="HIGHER EDUCATION" isEmpty={!hasHigherEd}>
                      <div className="flex flex-col gap-3 mt-2">
                        {student.higherEducation.map((h, i) => (
                          <ItemCard key={i}>
                            <div className="flex justify-between items-start gap-3">
                              <span className="font-bold text-[#1a1a1a] text-[0.95rem] leading-tight">{h.program}</span>
                              {h.score && <Badge text={`Score: ${h.score}`} />}
                            </div>
                            {h.college && <div className="mt-1.5 text-[0.85rem] text-[#6b5e4e] font-medium">{h.college}</div>}
                          </ItemCard>
                        ))}
                      </div>
                    </Section>

                    <Section title="COMPETITIVE CODING" isEmpty={!hasCoding}>
                      <div className="flex flex-col gap-3 mt-2">
                        {student.competitiveCoding.map((c, i) => (
                          <ItemCard key={i}>
                            <div className="flex justify-between items-center gap-3">
                              <span className="font-bold text-[#1a1a1a] text-[0.95rem] leading-tight">{c.platform}</span>
                              {c.profileLink && (
                                <a href={c.profileLink} target="_blank" rel="noopener noreferrer" className="shrink-0 px-3 py-1 rounded text-[0.7rem] font-bold uppercase tracking-wider hover:bg-[#2d6060] hover:text-white transition-colors" style={{ background: "rgba(45,96,96,0.1)", color: "#2d6060", border: "1px solid rgba(45,96,96,0.2)" }}>
                                  View Profile
                                </a>
                              )}
                            </div>
                          </ItemCard>
                        ))}
                      </div>
                    </Section>

                    <Section title="OTHER ACHIEVEMENTS" isEmpty={additionalEvents.length === 0}>
                      <div className="flex flex-col gap-2 mt-2">
                        {additionalEvents.map((ev, i) => (
                          <ItemCard key={i}>
                            <span className="font-bold text-[#1a1a1a] text-[0.95rem] leading-tight">{ev.name}</span>
                          </ItemCard>
                        ))}
                      </div>
                    </Section>
                  </div>
                )}
              </div>
            ) : (
              /* No activities at all — show graceful empty state */
              <div className="yearbook-grid-container" style={{ display: "block" }}>
                <div className="py-12 px-6 text-center">
                  <EmptyState message="No activities or achievements recorded yet" />
                </div>
              </div>
            )}

            {/* Signature Quote — always at bottom */}
            <div style={{ padding: "0 16px 16px" }}>
              <div className="yearbook-sticky-wrapper">
                <div className="yearbook-sticky-shadow" />
                <div className="yearbook-sticky">
                  <h3>SIGNATURE QUOTE</h3>
                  <p>&ldquo;{student.quote || "Either you run the day, or the day runs you"}&rdquo;</p>
                  <div className="signature">{student.name.split(" ")[0]}</div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Mobile nav */}
        <div className="flex justify-between mt-8 md:hidden no-print">
          {prevStudent ? (
            <Link href={`/profile/${encodeURIComponent(prevStudent.id)}`} className="flex items-center gap-1 text-sm font-bold text-white px-6 py-3 rounded shadow-md" style={{ background: "#2d6060", border: "2px solid #e8a830" }}>
              <ChevronLeft size={18} /> Previous
            </Link>
          ) : <div />}
          {nextStudent ? (
            <Link href={`/profile/${encodeURIComponent(nextStudent.id)}`} className="flex items-center gap-1 text-sm font-bold text-white px-6 py-3 rounded shadow-md" style={{ background: "#2d6060", border: "2px solid #e8a830" }}>
              Next <ChevronRight size={18} />
            </Link>
          ) : <div />}
        </div>

      </div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
