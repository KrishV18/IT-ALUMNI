import {
  Student, StudentEvent, MoocCourse, NptelCourse, Certification,
  Internship, Volunteering, Startup, Project, ResearchPaper,
  HigherEducation, CompetitiveCoding, NGOWork,
} from "@/types/student";

// ╔════════════════════════════════════════════════════════════════════════════╗
// ║  📡 SHEETS SERVICE — Single-tab Google Form responses parser             ║
// ║                                                                          ║
// ║  Fetches from "Form responses 1" tab — one row per student.             ║
// ╚════════════════════════════════════════════════════════════════════════════╝

const SHEET_ID = "1-1A5iMLsigYm9qRNg1M9WmUUjCV6yN5s4kfDv4Jntvk";
const API_KEY = "AIzaSyCWNiyi5-LF342xKh2nr0eT1TSTSgxooU8";
const SHEET_TAB = "Form responses 1";

// ─── Helpers ───────────────────────────────────────────────────────────────

function g(row: string[], i: number): string {
  return (row[i] ?? "").trim();
}

function hasValue(row: string[], i: number): boolean {
  return g(row, i).length > 0;
}

/** Convert Google Drive "open" link to a direct thumbnail URL */
function driveThumb(raw: string): string {
  if (!raw) return "";
  const m = raw.match(/id=([a-zA-Z0-9_-]+)/);
  if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w400`;
  const m2 = raw.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (m2) return `https://drive.google.com/thumbnail?id=${m2[1]}&sz=w400`;
  return raw;
}

// ─── Column index map (0-based) ────────────────────────────────────────────
// Student basics
const COL = {
  TIMESTAMP: 0,
  EMAIL_LOGIN: 1,
  NAME: 2,
  ENROLLMENT: 3,
  CONTACT: 4,
  EMAIL: 5,
  GROUP: 6,
  MENTOR: 7,
  ACTIVITIES_SEL: 8,

  // Hackathon: 9-15
  HACK_NAME: 9, HACK_DATE: 10, HACK_PLACE: 11, HACK_CONDUCTOR: 12,
  HACK_POSITION: 13, HACK_CATEGORY: 14, HACK_CERT: 15,

  // Technical: 16-22
  TECH_NAME: 16, TECH_DATE: 17, TECH_PLACE: 18, TECH_CONDUCTOR: 19,
  TECH_POSITION: 20, TECH_CATEGORY: 21, TECH_CERT: 22,

  // Non-Technical: 23-29
  NTECH_NAME: 23, NTECH_DATE: 24, NTECH_PLACE: 25, NTECH_CONDUCTOR: 26,
  NTECH_POSITION: 27, NTECH_CATEGORY: 28, NTECH_CERT: 29,

  // Sport: 30-36
  SPORT_NAME: 30, SPORT_DATE: 31, SPORT_PLACE: 32, SPORT_CONDUCTOR: 33,
  SPORT_POSITION: 34, SPORT_CATEGORY: 35, SPORT_CERT: 36,

  // Cultural: 37-43
  CULT_NAME: 37, CULT_DATE: 38, CULT_PLACE: 39, CULT_CONDUCTOR: 40,
  CULT_POSITION: 41, CULT_CATEGORY: 42, CULT_CERT: 43,

  // MOOC: 44-51
  MOOC_NAME: 44, MOOC_START: 45, MOOC_END: 46, MOOC_EDUCATOR: 47,
  MOOC_DURATION: 48, MOOC_GRADE: 49, MOOC_COMPLETED: 50, MOOC_CERT: 51,

  // NPTEL: 52-60
  NPTEL_NAME: 52, NPTEL_DURATION: 53, NPTEL_START: 54, NPTEL_END: 55,
  NPTEL_SCORE: 56, NPTEL_CANDIDATES: 57, NPTEL_EDUCATOR: 58, NPTEL_IIT: 59, NPTEL_CERT: 60,

  // Certification: 61-67
  CERT_NAME: 61, CERT_START: 62, CERT_END: 63, CERT_DURATION: 64,
  CERT_GRADE: 65, CERT_EDUCATOR: 66, CERT_CERT: 67,

  // Internship: 68-75
  INT_ORG: 68, INT_TITLE: 69, INT_TECH: 70, INT_START: 71,
  INT_END: 72, INT_DURATION: 73, INT_TRAINER: 74, INT_CERT: 75,

  // Workshop/Seminar 1: 76-81
  WS1_NAME: 76, WS1_START: 77, WS1_END: 78, WS1_PLACE: 79,
  WS1_POSITION: 80, WS1_CERT: 81,

  // Workshop/Seminar 2: 82-87
  WS2_NAME: 82, WS2_START: 83, WS2_END: 84, WS2_PLACE: 85,
  WS2_POSITION: 86, WS2_CERT: 87,

  // Society 1: 88-94
  SOC1_SOCIETY: 88, SOC1_EVENT: 89, SOC1_ROLE: 90, SOC1_DATE: 91,
  SOC1_PLACE: 92, SOC1_CATEGORY: 93, SOC1_CERT: 94,

  // Society 2: 95-102
  SOC2_SOCIETY: 95, SOC2_EVENT: 96, SOC2_ROLE: 97, SOC2_START: 98,
  SOC2_END: 99, SOC2_PLACE: 100, SOC2_CATEGORY: 101, SOC2_CERT: 102,

  // Volunteering: 103-109
  VOL_ORG: 103, VOL_EVENT: 104, VOL_START: 105, VOL_END: 106,
  VOL_PLACE: 107, VOL_ROLE: 108, VOL_CERT: 109,

  // Startup: 110-129
  STARTUP_NAME: 110, STARTUP_DETAIL: 111, STARTUP_FOUNDERS: 112,
  STARTUP_START: 117, STARTUP_ADDR: 118, STARTUP_EMAIL: 120, STARTUP_ROLE: 121,

  // Entrepreneurship: 130-138 (we won't display all of these)
  ENTREP_COMPANY: 130, ENTREP_PROFILE: 131,

  // Project: 139-144
  PROJ_TITLE: 139, PROJ_TYPE: 140, PROJ_TEAM: 141,
  PROJ_DOMAIN: 142, PROJ_SDG: 143, PROJ_CERT: 144,

  // NGO: 145-152
  NGO_NAME: 145, NGO_ABOUT: 146, NGO_ROLE: 147, NGO_EVENT_DONE: 148,
  NGO_EVENT_NAME: 149, NGO_EVENT_DATE: 150, NGO_EVENT_PLACE: 151, NGO_CERT: 152,

  // Research: 153-164
  RES_TITLE: 153, RES_AUTHORS: 154, RES_CONF: 155, RES_CONDUCTOR: 156,
  RES_PLACE: 157, RES_DATE: 158, RES_INDEXING: 160, RES_DOI: 161, RES_ISSN: 162,

  // Higher Education: 165-169
  HE_PROGRAM: 165, HE_COLLEGE: 166, HE_LOCATION: 167, HE_SCORE: 168,

  // GATE/CAT: 170-173
  GATE_YEAR: 170, GATE_SCORE: 171, GATE_PERCENTILE: 172,

  // LeetCode: 174-176
  LC_ENROLLED: 174, LC_LINK: 175,

  // HackerRank: 177-179
  HR_ENROLLED: 177, HR_LINK: 178,

  // Additional events: 180-199 (pairs of event+cert, 10 of them)
  EXTRA_EVENTS_START: 180,

  // Quote, Photo, Signature
  QUOTE: 200,
  PHOTO: 201,
  SIGNATURE: 203,
} as const;

// ─── Row → Student parser ──────────────────────────────────────────────────

function parseEvent(
  row: string[],
  type: StudentEvent["type"],
  nameCol: number,
  dateCol: number,
  placeCol: number,
  conductorCol: number,
  positionCol: number,
  categoryCol: number,
  certCol: number,
  opts?: { endDateCol?: number; societyName?: string; roleCol?: number }
): StudentEvent | null {
  const name = g(row, nameCol);
  if (!name) return null;
  return {
    type,
    name,
    date: g(row, dateCol),
    endDate: opts?.endDateCol ? g(row, opts.endDateCol) : undefined,
    place: g(row, placeCol),
    conductor: g(row, conductorCol),
    position: g(row, positionCol),
    category: g(row, categoryCol),
    certificate: g(row, certCol),
    role: opts?.roleCol ? g(row, opts.roleCol) : undefined,
    societyName: opts?.societyName,
  };
}

function parseRow(row: string[], idx: number): Student | null {
  const name = g(row, COL.NAME);
  if (!name) return null;

  // ── Events ──
  const events: StudentEvent[] = [];

  // 5 main event types
  const eventDefs: [StudentEvent["type"], number, number, number, number, number, number, number][] = [
    ["Hackathon", COL.HACK_NAME, COL.HACK_DATE, COL.HACK_PLACE, COL.HACK_CONDUCTOR, COL.HACK_POSITION, COL.HACK_CATEGORY, COL.HACK_CERT],
    ["Technical", COL.TECH_NAME, COL.TECH_DATE, COL.TECH_PLACE, COL.TECH_CONDUCTOR, COL.TECH_POSITION, COL.TECH_CATEGORY, COL.TECH_CERT],
    ["Non-Technical", COL.NTECH_NAME, COL.NTECH_DATE, COL.NTECH_PLACE, COL.NTECH_CONDUCTOR, COL.NTECH_POSITION, COL.NTECH_CATEGORY, COL.NTECH_CERT],
    ["Sport", COL.SPORT_NAME, COL.SPORT_DATE, COL.SPORT_PLACE, COL.SPORT_CONDUCTOR, COL.SPORT_POSITION, COL.SPORT_CATEGORY, COL.SPORT_CERT],
    ["Cultural", COL.CULT_NAME, COL.CULT_DATE, COL.CULT_PLACE, COL.CULT_CONDUCTOR, COL.CULT_POSITION, COL.CULT_CATEGORY, COL.CULT_CERT],
  ];
  for (const [type, n, d, p, c, pos, cat, cert] of eventDefs) {
    const ev = parseEvent(row, type, n, d, p, c, pos, cat, cert);
    if (ev) events.push(ev);
  }

  // Workshop/Seminar events (type as "Workshop")
  if (hasValue(row, COL.WS1_NAME)) {
    events.push({
      type: "Workshop", name: g(row, COL.WS1_NAME), date: g(row, COL.WS1_START),
      endDate: g(row, COL.WS1_END), place: g(row, COL.WS1_PLACE), conductor: "",
      position: g(row, COL.WS1_POSITION), category: "", certificate: g(row, COL.WS1_CERT),
    });
  }
  if (hasValue(row, COL.WS2_NAME)) {
    events.push({
      type: "Workshop", name: g(row, COL.WS2_NAME), date: g(row, COL.WS2_START),
      endDate: g(row, COL.WS2_END), place: g(row, COL.WS2_PLACE), conductor: "",
      position: g(row, COL.WS2_POSITION), category: "", certificate: g(row, COL.WS2_CERT),
    });
  }

  // Society events
  if (hasValue(row, COL.SOC1_EVENT)) {
    events.push({
      type: "Society", name: g(row, COL.SOC1_EVENT), date: g(row, COL.SOC1_DATE),
      place: g(row, COL.SOC1_PLACE), conductor: "", position: "",
      category: g(row, COL.SOC1_CATEGORY), certificate: g(row, COL.SOC1_CERT),
      role: g(row, COL.SOC1_ROLE), societyName: g(row, COL.SOC1_SOCIETY),
    });
  }
  if (hasValue(row, COL.SOC2_EVENT)) {
    events.push({
      type: "Society", name: g(row, COL.SOC2_EVENT), date: g(row, COL.SOC2_START),
      endDate: g(row, COL.SOC2_END), place: g(row, COL.SOC2_PLACE), conductor: "",
      position: "", category: g(row, COL.SOC2_CATEGORY), certificate: g(row, COL.SOC2_CERT),
      role: g(row, COL.SOC2_ROLE), societyName: g(row, COL.SOC2_SOCIETY),
    });
  }

  // Additional events (10 slots at cols 180-199, pairs of event+cert)
  for (let i = 0; i < 10; i++) {
    const evCol = COL.EXTRA_EVENTS_START + i * 2;
    const certCol = evCol + 1;
    const evText = g(row, evCol);
    if (evText) {
      events.push({
        type: "Additional", name: evText, date: "", place: "", conductor: "",
        position: "", category: "", certificate: g(row, certCol),
      });
    }
  }

  // ── MOOC ──
  const moocCourses: MoocCourse[] = [];
  if (hasValue(row, COL.MOOC_NAME)) {
    moocCourses.push({
      name: g(row, COL.MOOC_NAME), startDate: g(row, COL.MOOC_START),
      endDate: g(row, COL.MOOC_END), educator: g(row, COL.MOOC_EDUCATOR),
      duration: g(row, COL.MOOC_DURATION), grade: g(row, COL.MOOC_GRADE),
      completed: g(row, COL.MOOC_COMPLETED), certificate: g(row, COL.MOOC_CERT),
    });
  }

  // ── NPTEL ──
  const nptelCourses: NptelCourse[] = [];
  if (hasValue(row, COL.NPTEL_NAME)) {
    nptelCourses.push({
      name: g(row, COL.NPTEL_NAME), duration: g(row, COL.NPTEL_DURATION),
      startMonth: g(row, COL.NPTEL_START), endMonth: g(row, COL.NPTEL_END),
      score: g(row, COL.NPTEL_SCORE), candidatesCertified: g(row, COL.NPTEL_CANDIDATES),
      educator: g(row, COL.NPTEL_EDUCATOR), iit: g(row, COL.NPTEL_IIT),
      certificate: g(row, COL.NPTEL_CERT),
    });
  }

  // ── Certification ──
  const certifications: Certification[] = [];
  if (hasValue(row, COL.CERT_NAME)) {
    certifications.push({
      name: g(row, COL.CERT_NAME), startDate: g(row, COL.CERT_START),
      endDate: g(row, COL.CERT_END), duration: g(row, COL.CERT_DURATION),
      grade: g(row, COL.CERT_GRADE), educator: g(row, COL.CERT_EDUCATOR),
      certificate: g(row, COL.CERT_CERT),
    });
  }

  // ── Internship ──
  const internships: Internship[] = [];
  if (hasValue(row, COL.INT_TITLE) || hasValue(row, COL.INT_ORG)) {
    internships.push({
      organization: g(row, COL.INT_ORG), title: g(row, COL.INT_TITLE),
      technology: g(row, COL.INT_TECH), startDate: g(row, COL.INT_START),
      endDate: g(row, COL.INT_END), duration: g(row, COL.INT_DURATION),
      trainer: g(row, COL.INT_TRAINER), certificate: g(row, COL.INT_CERT),
    });
  }

  // ── Volunteering ──
  const volunteering: Volunteering[] = [];
  if (hasValue(row, COL.VOL_ORG) || hasValue(row, COL.VOL_EVENT)) {
    volunteering.push({
      organization: g(row, COL.VOL_ORG), eventName: g(row, COL.VOL_EVENT),
      startDate: g(row, COL.VOL_START), endDate: g(row, COL.VOL_END),
      place: g(row, COL.VOL_PLACE), role: g(row, COL.VOL_ROLE),
      certificate: g(row, COL.VOL_CERT),
    });
  }

  // ── Startup ──
  const startups: Startup[] = [];
  if (hasValue(row, COL.STARTUP_NAME)) {
    startups.push({
      name: g(row, COL.STARTUP_NAME), detail: g(row, COL.STARTUP_DETAIL),
      founders: g(row, COL.STARTUP_FOUNDERS), role: g(row, COL.STARTUP_ROLE),
      startDate: g(row, COL.STARTUP_START), location: g(row, COL.STARTUP_ADDR),
      email: g(row, COL.STARTUP_EMAIL),
    });
  }

  // ── Projects ──
  const projects: Project[] = [];
  if (hasValue(row, COL.PROJ_TITLE)) {
    projects.push({
      title: g(row, COL.PROJ_TITLE), type: g(row, COL.PROJ_TYPE),
      teamMembers: g(row, COL.PROJ_TEAM), domain: g(row, COL.PROJ_DOMAIN),
      sdgLevel: g(row, COL.PROJ_SDG), certificate: g(row, COL.PROJ_CERT),
    });
  }

  // ── NGO ──
  const ngoWork: NGOWork[] = [];
  if (hasValue(row, COL.NGO_NAME)) {
    ngoWork.push({
      name: g(row, COL.NGO_NAME), about: g(row, COL.NGO_ABOUT),
      role: g(row, COL.NGO_ROLE), eventDone: g(row, COL.NGO_EVENT_DONE),
      eventName: g(row, COL.NGO_EVENT_NAME), eventDate: g(row, COL.NGO_EVENT_DATE),
      eventPlace: g(row, COL.NGO_EVENT_PLACE), certificate: g(row, COL.NGO_CERT),
    });
  }

  // ── Research ──
  const researchPapers: ResearchPaper[] = [];
  if (hasValue(row, COL.RES_TITLE)) {
    researchPapers.push({
      title: g(row, COL.RES_TITLE), authors: g(row, COL.RES_AUTHORS),
      conference: g(row, COL.RES_CONF), conductor: g(row, COL.RES_CONDUCTOR),
      place: g(row, COL.RES_PLACE), date: g(row, COL.RES_DATE),
      indexing: g(row, COL.RES_INDEXING), doi: g(row, COL.RES_DOI),
      issn: g(row, COL.RES_ISSN),
    });
  }

  // ── Higher Education ──
  const higherEducation: HigherEducation[] = [];
  if (hasValue(row, COL.HE_PROGRAM)) {
    higherEducation.push({
      program: g(row, COL.HE_PROGRAM), college: g(row, COL.HE_COLLEGE),
      location: g(row, COL.HE_LOCATION), score: g(row, COL.HE_SCORE),
    });
  }

  // ── Competitive Coding ──
  const competitiveCoding: CompetitiveCoding[] = [];
  const lcEnrolled = g(row, COL.LC_ENROLLED).toLowerCase();
  if (lcEnrolled === "yes" || hasValue(row, COL.LC_LINK)) {
    competitiveCoding.push({
      platform: "LeetCode", enrolled: lcEnrolled === "yes",
      profileLink: g(row, COL.LC_LINK),
    });
  }
  const hrEnrolled = g(row, COL.HR_ENROLLED).toLowerCase();
  if (hrEnrolled === "yes" || hasValue(row, COL.HR_LINK)) {
    competitiveCoding.push({
      platform: "HackerRank", enrolled: hrEnrolled === "yes",
      profileLink: g(row, COL.HR_LINK),
    });
  }

  return {
    id: `s-${idx}`,
    name,
    enrollmentNo: g(row, COL.ENROLLMENT),
    contact: g(row, COL.CONTACT),
    email: g(row, COL.EMAIL) || g(row, COL.EMAIL_LOGIN),
    group: g(row, COL.GROUP),
    mentor: g(row, COL.MENTOR),
    activitiesSelector: g(row, COL.ACTIVITIES_SEL),
    photograph: driveThumb(g(row, COL.PHOTO)),
    quote: g(row, COL.QUOTE),
    events,
    moocCourses,
    nptelCourses,
    certifications,
    internships,
    volunteering,
    startups,
    projects,
    researchPapers,
    higherEducation,
    competitiveCoding,
    ngoWork,
  };
}

// ─── Fetch ─────────────────────────────────────────────────────────────────

export async function fetchAllStudents(): Promise<Student[]> {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(SHEET_TAB)}?key=${API_KEY}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      console.error(`Sheets API error: HTTP ${res.status}`);
      return [];
    }
    const json = await res.json();
    const values: string[][] = json.values ?? [];
    if (values.length < 2) return [];

    // Row 0 = headers, rows 1+ = data
    const dataRows = values.slice(1);
    const students: Student[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < dataRows.length; i++) {
      const s = parseRow(dataRows[i], i);
      if (!s) continue;
      const key = s.enrollmentNo || s.id;
      if (seen.has(key)) continue;
      seen.add(key);
      students.push(s);
    }

    return students;
  } catch (err) {
    console.error("Failed to fetch student data:", err);
    return [];
  }
}

export async function fetchStudentById(id: string): Promise<Student | null> {
  const all = await fetchAllStudents();
  return all.find((s) => s.id === id) ?? null;
}
