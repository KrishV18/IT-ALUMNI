import { fetchAllStudents } from "@/services/sheetsService";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Student, StudentResult } from "@/types/student";
import PrintButton from "@/components/PrintButton";
import { 
  ArrowLeft, Mail, Phone, Hash, 
  MapPin, Calendar, Briefcase, Award, Target, Landmark, 
  BarChart, Clock, Cpu
} from "lucide-react";

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
);

export const revalidate = 0;

// ─── Helpers ───────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "from-indigo-500 to-violet-500",
  "from-cyan-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-pink-500 to-purple-500"
];

function getAvatarColor(name: string) {
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function getSpecStyle(spec: string) {
  const s = spec.toUpperCase();
  if (s.includes("AIML") || s.includes("AI")) return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
  if (s.includes("FSD") || s.includes("FULL")) return "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20";
  return "bg-white/5 text-muted-foreground border border-white/10";
}

const SKILL_COLORS = [
  "bg-white/5 text-muted-foreground border-white/10",
  "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "bg-purple-500/10 text-purple-400 border-purple-500/20",
];

function getBestCGPA(r?: StudentResult): string {
  if (!r) return "—";
  const vals = [r.sem1,r.sem2,r.sem3,r.sem4,r.sem5,r.sem6,r.sem7,r.sem8].filter((v): v is number => v !== undefined);
  if (!vals.length) return "—";
  return vals[vals.length - 1].toFixed(2);
}

function getAvgCGPA(r?: StudentResult): string {
  if (!r) return "—";
  const vals = [r.sem1,r.sem2,r.sem3,r.sem4,r.sem5,r.sem6,r.sem7,r.sem8].filter((v): v is number => v !== undefined);
  if (!vals.length) return "—";
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
}

function CGPABar({ label, value, delay = 0 }: { label: string; value?: number; delay?: number }) {
  if (value === undefined) return null;
  const pct = Math.min((value / 10) * 100, 100);
  const color = value >= 9 ? "bg-emerald-500" : value >= 8 ? "bg-indigo-500" : value >= 7 ? "bg-amber-500" : "bg-rose-500";
  const textColor = value >= 9 ? "text-emerald-500" : value >= 8 ? "text-indigo-500" : value >= 7 ? "text-amber-500" : "text-rose-500";

  return (
    <div className="mb-4">
      <div className="flex justify-between mb-2">
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        <span className={`text-sm font-bold tabular-nums ${textColor}`}>{value.toFixed(2)}</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full cgpa-bar`}
          style={{ width: `${pct}%`, animationDelay: `${delay}ms`, animationDuration: "0.9s" }}
        />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, colorClass }: { icon: React.ElementType; label: string; value: string | number; colorClass?: string }) {
  return (
    <div className="bg-card/50 border border-white/5 rounded-2xl p-5 text-center hover:border-white/10 transition-colors group">
      <div className={`mx-auto w-9 h-9 rounded-xl bg-white/5 group-hover:bg-white/8 flex items-center justify-center mb-3 transition-colors ${colorClass || "text-foreground"}`}>
        <Icon size={17} />
      </div>
      <div className={`text-2xl font-black tracking-tight mb-1 ${colorClass || "text-foreground"}`}>{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const students = await fetchAllStudents();
  const student = students.find((s) => s.id === decodeURIComponent(id)) as Student | undefined;
  if (!student) notFound();

  const avatarGradient = getAvatarColor(student.name);
  const latestCGPA = getBestCGPA(student.results);
  const avgCGPA = getAvgCGPA(student.results);

  // Map avatar gradient to a banner seed color
  const BANNER_COLORS: Record<string, string> = {
    "from-indigo-500 to-violet-500": "#6366f1",
    "from-cyan-500 to-blue-500": "#06b6d4",
    "from-emerald-500 to-teal-500": "#10b981",
    "from-amber-500 to-orange-500": "#f59e0b",
    "from-rose-500 to-pink-500": "#f43f5e",
    "from-pink-500 to-purple-500": "#ec4899",
  };
  const avatarBannerColor = BANNER_COLORS[avatarGradient] ?? "#6366f1";

  const hasResults = student.results && Object.values(student.results).some(v => v !== undefined);
  const hasInternships = student.internships && student.internships.length > 0;
  const hasActivities = student.activities && student.activities.length > 0;
  const hasPrizes = student.prizes && student.prizes.length > 0;
  const semCount = student.results ? [student.results.sem1,student.results.sem2,student.results.sem3,student.results.sem4,student.results.sem5,student.results.sem6,student.results.sem7,student.results.sem8].filter(v => v !== undefined).length : 0;

  return (
    <div className="bg-background min-h-screen pb-20">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="max-w-4xl mx-auto px-6 pt-10 relative z-10">
        <div className="no-print flex justify-between items-center mb-8 flex-wrap gap-4">
          <Link href="/directory" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg">
            <ArrowLeft size={16} /> Back to Directory
          </Link>
          <PrintButton />
        </div>

        <div className="bg-card border border-white/5 rounded-[2rem] overflow-hidden mb-8 shadow-2xl">
          {/* Mesh gradient banner seeded from avatar color */}
          <div
            className="h-36 border-b border-white/5 relative"
            style={{
              background: `radial-gradient(ellipse at 20% 50%, ${avatarBannerColor}33 0%, transparent 60%),
                           radial-gradient(ellipse at 80% 20%, rgba(99,102,241,0.2) 0%, transparent 55%),
                           radial-gradient(ellipse at 60% 80%, rgba(6,182,212,0.15) 0%, transparent 50%),
                           linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)`,
            }}
          >
            {/* Noise texture */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.05\'/%3E%3C/svg%3E')" }} />
            <div className="absolute bottom-3 right-5 flex gap-2 no-print">
              {student.enrollmentNo && (
                <span className="bg-black/50 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1 font-mono text-xs font-medium text-white/70">
                  #{student.enrollmentNo}
                </span>
              )}
              <span className="bg-black/50 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1 text-xs font-semibold text-white/70">
                Group {student.group}
              </span>
            </div>
          </div>

          <div className="px-8 pb-8">
            <div className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-4xl font-black text-white -mt-14 mb-5 border-[6px] border-card shadow-xl`}>
              {getInitials(student.name)}
            </div>

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
              <div>
                <h1 className="text-4xl font-black mb-3 tracking-tight text-foreground">{student.name}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold tracking-wide uppercase ${getSpecStyle(student.specialization)}`}>
                    {student.specialization || "IT"}
                  </span>
                  {latestCGPA !== "—" && (
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      CGPA {latestCGPA}
                    </span>
                  )}
                  {hasInternships && (
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      {student.internships!.length} Internship{student.internships!.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 no-print">
                {student.linkedin && (
                  <a href={student.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20">
                    <LinkedinIcon width={16} height={16} /> LinkedIn
                  </a>
                )}
                {student.github && (
                  <a href={student.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-foreground px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                    <GithubIcon width={16} height={16} /> GitHub
                  </a>
                )}
                {student.email && (
                  <a href={`mailto:${student.email}`} className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-foreground px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                    <Mail size={16} /> Email
                  </a>
                )}
              </div>
            </div>

            <div className="h-px w-full bg-white/5 mb-8" />

            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${student.expertise.length ? "mb-8" : ""}`}>
              {[
                { label: "Email", value: student.email, icon: Mail },
                { label: "Contact", value: student.contact, icon: Phone },
                { label: "Enrollment ID", value: student.enrollmentNo, icon: Hash },
                { label: "GitHub", value: student.github ? student.github.replace("https://github.com/", "@") : null, icon: GithubIcon },
              ].filter(item => item.value).map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-0.5">{label}</span>
                    <p className="text-sm font-medium text-foreground truncate">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {student.expertise.length > 0 && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-3">🛠 Expertise & Skills</span>
                <div className="flex flex-wrap gap-2">
                  {student.expertise.map((sk, i) => (
                    <span key={sk} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${SKILL_COLORS[i % SKILL_COLORS.length]}`}>
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {(latestCGPA !== "—" || avgCGPA !== "—" || semCount > 0 || hasInternships || hasPrizes) && (
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-8">
            {latestCGPA !== "—" && <StatCard icon={BarChart} label="Latest CGPA" value={latestCGPA} colorClass="text-emerald-400" />}
            {avgCGPA !== "—" && <StatCard icon={Target} label="Avg CGPA" value={avgCGPA} colorClass="text-indigo-400" />}
            {semCount > 0 && <StatCard icon={Calendar} label="Semesters" value={semCount} colorClass="text-blue-400" />}
            {hasInternships && <StatCard icon={Briefcase} label="Internships" value={student.internships!.length} colorClass="text-amber-400" />}
            {hasPrizes && <StatCard icon={Award} label="Prizes" value={student.prizes!.length} colorClass="text-rose-400" />}
          </div>
        )}

        {hasResults && (
          <div className="bg-card border border-white/5 rounded-3xl p-8 mb-8">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center"><BarChart size={18} /></div>
              Academic Performance
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-1">
              {(["sem1","sem2","sem3","sem4","sem5","sem6","sem7","sem8"] as const).map((sem, i) => (
                <CGPABar key={sem} label={`Semester ${i + 1}`} value={student.results?.[sem]} delay={i * 80} />
              ))}
            </div>
          </div>
        )}

        {/* ── Internships ── */}
        {hasInternships && (
          <div className="bg-card border border-white/5 rounded-3xl p-8 mb-8">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center"><Briefcase size={18} /></div>
              Internships
            </h2>
            <div className="space-y-4">
              {student.internships!.map((intern, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-1">{intern.title}</h3>
                      <p className="text-primary font-semibold text-sm">
                        {intern.company || "Company not specified"}
                        {intern.location && <span className="text-muted-foreground font-medium"> • {intern.location}</span>}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {intern.paid && <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{intern.paid}</span>}
                      {intern.mode && <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{intern.mode}</span>}
                      {intern.sector && <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-white/5 text-muted-foreground border border-white/10">{intern.sector}</span>}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                    {intern.duration && <div className="flex items-center gap-2"><Clock size={14} className="opacity-50 shrink-0"/> {intern.duration}</div>}
                    {intern.startDate && !intern.startDate.startsWith("Date(") && <div className="flex items-center gap-2"><Calendar size={14} className="opacity-50 shrink-0"/> {intern.startDate} → {intern.endDate||"Present"}</div>}
                    {intern.stipend && <div className="flex items-center gap-2 col-span-full"><Award size={14} className="opacity-50 shrink-0"/> Stipend: <span className="font-semibold text-foreground">{intern.stipend}</span></div>}
                    {intern.tech && <div className="flex items-start gap-2 col-span-full"><Cpu size={14} className="opacity-50 mt-0.5 shrink-0"/> <span className="leading-relaxed">{intern.tech}</span></div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Prizes ── */}
        {hasPrizes && (
          <div className="bg-card border border-white/5 rounded-3xl p-8 mb-8">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center"><Award size={18} /></div>
              Prizes & Achievements
            </h2>
            <div className="space-y-4">
              {student.prizes!.map((prize, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-foreground mb-1.5">{prize.eventName}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {prize.location && <span className="flex items-center gap-1"><MapPin size={12} /> {prize.location}</span>}
                      {prize.date && !prize.date.startsWith("Date(") && <span className="flex items-center gap-1"><Calendar size={12} /> {prize.date}</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {prize.level && <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20">{prize.level}</span>}
                    {prize.position && <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">🥇 {prize.position}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Activities ── */}
        {hasActivities && (
          <div className="bg-card border border-white/5 rounded-3xl p-8 mb-8">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center"><Target size={18} /></div>
              Extracurricular Activities
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {student.activities!.map((act, i) => (
                <div key={i} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <h3 className="font-bold text-sm text-foreground mb-3">{act.eventName}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${act.role.toLowerCase().includes("organ") ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"}`}>
                      {act.role}
                    </span>
                    {act.place && <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-muted-foreground bg-white/5 border border-white/5 flex items-center gap-1"><MapPin size={10} /> {act.place}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Societies ── */}
        {student.societies && student.societies !== "None" && student.societies !== "none" && (
          <div className="bg-card border border-white/5 rounded-3xl p-8 mb-8">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center"><Landmark size={18} /></div>
              College Societies
            </h2>
            <div className="flex flex-wrap gap-2">
              {student.societies.split(/[,;&/\n]+/).map(s => s.trim()).filter(Boolean).map((soc, i) => (
                <span key={i} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-pink-500/8 border border-pink-500/20 text-pink-300">
                  {soc}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── No Data Placeholder ── */}
        {!hasResults && !hasInternships && !hasActivities && !hasPrizes && (!student.societies || student.societies === "None") && (
          <div className="bg-card/50 border border-dashed border-white/10 rounded-3xl p-16 text-center">
            <div className="w-16 h-16 mx-auto bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-muted-foreground">
              <Briefcase size={32} />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">No Additional Records</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Results, internships, activities, and prizes will appear here once added to the Google Sheet.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
