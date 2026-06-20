// ─── Event types (Hackathon, Technical, Non-Technical, Sport, Cultural) ────
export interface StudentEvent {
  type: "Hackathon" | "Technical" | "Non-Technical" | "Sport" | "Cultural" | "Workshop" | "Society" | "Additional";
  name: string;
  date: string;
  endDate?: string;
  place: string;
  conductor: string;
  position: string;
  category: string;
  certificate: string;
  role?: string; // for society events
  societyName?: string; // for society events
}

// ─── MOOC Course ────────────────────────────────────────────────────────────
export interface MoocCourse {
  name: string;
  startDate: string;
  endDate: string;
  educator: string;
  duration: string;
  grade: string;
  completed: string;
  certificate: string;
}

// ─── NPTEL Course ───────────────────────────────────────────────────────────
export interface NptelCourse {
  name: string;
  duration: string;
  startMonth: string;
  endMonth: string;
  score: string;
  candidatesCertified: string;
  educator: string;
  iit: string;
  certificate: string;
}

// ─── Certification ──────────────────────────────────────────────────────────
export interface Certification {
  name: string;
  startDate: string;
  endDate: string;
  duration: string;
  grade: string;
  educator: string;
  certificate: string;
}

// ─── Internship ─────────────────────────────────────────────────────────────
export interface Internship {
  organization: string;
  title: string;
  technology: string;
  startDate: string;
  endDate: string;
  duration: string;
  trainer: string;
  certificate: string;
}

// ─── Volunteering ───────────────────────────────────────────────────────────
export interface Volunteering {
  organization: string;
  eventName: string;
  startDate: string;
  endDate: string;
  place: string;
  role: string;
  certificate: string;
}

// ─── Startup ────────────────────────────────────────────────────────────────
export interface Startup {
  name: string;
  detail: string;
  founders: string;
  role: string;
  startDate: string;
  location: string;
  email: string;
}

// ─── Project ────────────────────────────────────────────────────────────────
export interface Project {
  title: string;
  type: string;
  teamMembers: string;
  domain: string;
  sdgLevel: string;
  certificate: string;
}

// ─── Research Paper ─────────────────────────────────────────────────────────
export interface ResearchPaper {
  title: string;
  authors: string;
  conference: string;
  conductor: string;
  place: string;
  date: string;
  indexing: string;
  doi: string;
  issn: string;
}

// ─── Higher Education ───────────────────────────────────────────────────────
export interface HigherEducation {
  program: string;
  college: string;
  location: string;
  score: string;
}

// ─── Competitive Coding ─────────────────────────────────────────────────────
export interface CompetitiveCoding {
  platform: string;
  enrolled: boolean;
  profileLink: string;
}

// ─── NGO ────────────────────────────────────────────────────────────────────
export interface NGOWork {
  name: string;
  about: string;
  role: string;
  eventDone: string;
  eventName: string;
  eventDate: string;
  eventPlace: string;
  certificate: string;
}

// ─── Main Student ───────────────────────────────────────────────────────────
export interface Student {
  id: string;
  name: string;
  enrollmentNo: string;
  contact: string;
  email: string;
  group: string;
  mentor: string;
  activitiesSelector: string;
  photograph: string;        // Google Drive thumbnail URL (remote)
  localPhotoPath: string;   // Local /photos/{enrollmentNo}.ext path (served from public/)
  quote: string;

  // Enriched arrays
  events: StudentEvent[];
  moocCourses: MoocCourse[];
  nptelCourses: NptelCourse[];
  certifications: Certification[];
  internships: Internship[];
  volunteering: Volunteering[];
  startups: Startup[];
  projects: Project[];
  researchPapers: ResearchPaper[];
  higherEducation: HigherEducation[];
  competitiveCoding: CompetitiveCoding[];
  ngoWork: NGOWork[];
}
