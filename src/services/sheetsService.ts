import { Student, Internship, Activity, Prize, StudentResult, FinalResult, Certification } from "@/types/student";

// ╔════════════════════════════════════════════════════════════════════════════╗
// ║  📡 SHEETS SERVICE — Direct Google Sheets fetcher                        ║
// ║                                                                          ║
// ║  Calls Google Sheets API v4 directly — no internal HTTP roundtrip.       ║
// ║  This works reliably on localhost, Vercel build, and Vercel runtime.     ║
// ╚════════════════════════════════════════════════════════════════════════════╝

const SHEET_ID = "1I_j80q4qQ8Wu9L6E8yiLi_f4rH6Lv8G0YfBVeWqGFsM";
const API_KEY = "AIzaSyCWNiyi5-LF342xKh2nr0eT1TSTSgxooU8";

const SHEET_TABS = {
  STUDENTS:       "1.Student Details",
  FINAL:          "final",
  RESULTS:        "2.Results",
  INTERNSHIPS:    "3.Internship Details",
  ACTIVITIES:     "4.ExtraCurricular Activities",
  PRIZES:         "7.Prize(s) won",
  CERTIFICATIONS: "8.Certification Details",
};

// ─── Helpers ───────────────────────────────────────────────────────────────

interface RawCell { v: string | number | null; f?: string; }
interface RawRow { c: (RawCell | null)[]; }
type ParsedSheet = { rows: RawRow[] };

function normalizeUrl(raw: string): string {
  if (!raw) return "";
  raw = raw.trim();
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("www.") || raw.startsWith("github.com") || raw.startsWith("linkedin.com"))
    return `https://${raw}`;
  return raw;
}

function getCell(row: RawRow, i: number): string {
  const cell = row.c?.[i];
  if (!cell || cell.v === null || cell.v === undefined) return "";
  return cell.f ?? String(cell.v);
}

function getNum(row: RawRow, i: number): number | undefined {
  const cell = row.c?.[i];
  if (!cell || cell.v === null || cell.v === undefined) return undefined;
  const n = parseFloat(String(cell.v));
  return isNaN(n) ? undefined : n;
}

function convertValuesToRawRows(values: string[][] | undefined): RawRow[] {
  if (!values || values.length === 0) return [];
  let dataStartIdx = -1;
  for (let i = 0; i < values.length; i++) {
    const firstCell = String(values[i]?.[0] ?? "").trim();
    if (firstCell === "1") { dataStartIdx = i; break; }
  }
  if (dataStartIdx === -1) return [];
  return values.slice(dataStartIdx).map((row) => ({
    c: row.map((cellValue) => {
      if (cellValue === null || cellValue === undefined || cellValue === "") return { v: null };
      const num = Number(cellValue);
      if (!isNaN(num) && cellValue.trim() !== "") return { v: num, f: cellValue };
      return { v: cellValue };
    }),
  }));
}

async function fetchRawSheet(sheet: string): Promise<ParsedSheet> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(sheet)}?key=${API_KEY}`;
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      console.error(`Sheets API error for "${sheet}": HTTP ${res.status}`);
      return { rows: [] };
    }
    const json = await res.json();
    return { rows: convertValuesToRawRows(json.values) };
  } catch (err) {
    console.error(`Failed to fetch sheet "${sheet}":`, err);
    return { rows: [] };
  }
}

// ─── Parsers ───────────────────────────────────────────────────────────────

function parseStudents(rows: RawRow[]): Student[] {
  return rows
    .map((row, idx) => {
      const g = (i: number) => getCell(row, i);
      const name = g(3).trim();
      if (!name) return null;
      const expertiseRaw = g(10);
      return {
        id: `0-${idx}`,
        sNo: g(0),
        enrollmentNo: g(1),
        group: g(2),
        name,
        specialization: g(4).trim(),
        contact: g(5),
        email: g(6).trim(),
        societies: g(7).trim(),
        linkedin: normalizeUrl(g(8)),
        github: normalizeUrl(g(9)),
        expertise: expertiseRaw ? expertiseRaw.split(",").map((s) => s.trim()).filter(Boolean) : [],
        gid: 0,
      } as Student;
    })
    .filter(Boolean) as Student[];
}

function parseResults(rows: RawRow[]): Map<string, StudentResult> {
  const map = new Map<string, StudentResult>();
  for (const row of rows) {
    const name = getCell(row, 1).trim().toUpperCase();
    if (!name) continue;
    const result: StudentResult = {
      sem1: getNum(row, 2), sem2: getNum(row, 3), sem3: getNum(row, 4),
      sem4: getNum(row, 5), sem5: getNum(row, 6), sem6: getNum(row, 7), sem7: getNum(row, 8),
    };
    if (Object.values(result).some((v) => v !== undefined)) map.set(name, result);
  }
  return map;
}

function parseInternships(rows: RawRow[]): Map<string, Internship[]> {
  const map = new Map<string, Internship[]>();
  let currentName = "";
  for (const row of rows) {
    const nameRaw = getCell(row, 1).trim().toUpperCase();
    if (nameRaw) currentName = nameRaw;
    if (!currentName) continue;
    const title = getCell(row, 2).trim();
    if (!title) continue;
    const entry: Internship = {
      title, company: getCell(row, 8).trim(), location: getCell(row, 9).trim(),
      mode: getCell(row, 10).trim(), tech: getCell(row, 7).trim(), duration: getCell(row, 13).trim(),
      startDate: getCell(row, 14).trim(), endDate: getCell(row, 15).trim(),
      paid: getCell(row, 21).trim(), stipend: getCell(row, 22).trim(),
      companyWebsite: normalizeUrl(getCell(row, 20).trim()), sector: getCell(row, 11).trim(),
    };
    const arr = map.get(currentName) || [];
    arr.push(entry);
    map.set(currentName, arr);
  }
  return map;
}

function parseActivities(rows: RawRow[]): Map<string, Activity[]> {
  const map = new Map<string, Activity[]>();
  for (const row of rows) {
    const name = getCell(row, 1).trim().toUpperCase();
    if (!name) continue;
    const eventName = getCell(row, 2).trim();
    if (!eventName) continue;
    const arr = map.get(name) || [];
    arr.push({ eventName, role: getCell(row, 3).trim(), place: getCell(row, 4).trim(), date: getCell(row, 5).trim() });
    map.set(name, arr);
  }
  return map;
}

function parsePrizes(rows: RawRow[]): Map<string, Prize[]> {
  const map = new Map<string, Prize[]>();
  for (const row of rows) {
    const name = getCell(row, 1).trim().toUpperCase();
    if (!name) continue;
    const eventName = getCell(row, 2).trim();
    if (!eventName) continue;
    const arr = map.get(name) || [];
    arr.push({ eventName, date: getCell(row, 3).trim(), location: getCell(row, 4).trim(), level: getCell(row, 5).trim(), position: getCell(row, 6).trim() });
    map.set(name, arr);
  }
  return map;
}

function parseFinalResults(rows: RawRow[]): Map<string, FinalResult[]> {
  const map = new Map<string, FinalResult[]>();
  for (const row of rows) {
    const name = getCell(row, 1).trim().toUpperCase();
    if (!name) continue;
    const subject = getCell(row, 2).trim();
    if (!subject) continue;
    const arr = map.get(name) || [];
    arr.push({ subject, grade: getCell(row, 3).trim(), marks: getNum(row, 4) });
    map.set(name, arr);
  }
  return map;
}

function parseCertifications(rows: RawRow[]): Map<string, Certification[]> {
  const map = new Map<string, Certification[]>();
  for (const row of rows) {
    const name = getCell(row, 1).trim().toUpperCase();
    if (!name) continue;
    const certName = getCell(row, 2).trim();
    if (!certName) continue;
    const arr = map.get(name) || [];
    arr.push({ name: certName, issuedBy: getCell(row, 3).trim(), date: getCell(row, 4).trim(), credentialId: getCell(row, 5).trim(), url: getCell(row, 6).trim() });
    map.set(name, arr);
  }
  return map;
}

// ─── Main Export ────────────────────────────────────────────────────────────

export async function fetchAllStudents(): Promise<Student[]> {
  try {
    const [studentsSheet, resultsSheet, finalSheet, internshipsSheet, activitiesSheet, prizesSheet, certsSheet] =
      await Promise.all([
        fetchRawSheet(SHEET_TABS.STUDENTS),
        fetchRawSheet(SHEET_TABS.RESULTS),
        fetchRawSheet(SHEET_TABS.FINAL),
        fetchRawSheet(SHEET_TABS.INTERNSHIPS),
        fetchRawSheet(SHEET_TABS.ACTIVITIES),
        fetchRawSheet(SHEET_TABS.PRIZES),
        fetchRawSheet(SHEET_TABS.CERTIFICATIONS),
      ]);

    const students = parseStudents(studentsSheet.rows);
    const resultsMap = parseResults(resultsSheet.rows);
    const finalResultsMap = parseFinalResults(finalSheet.rows);
    const internshipsMap = parseInternships(internshipsSheet.rows);
    const activitiesMap = parseActivities(activitiesSheet.rows);
    const prizesMap = parsePrizes(prizesSheet.rows);
    const certsMap = parseCertifications(certsSheet.rows);

    const enriched = students.map((s) => {
      const key = s.name.toUpperCase();
      return {
        ...s,
        results: resultsMap.get(key),
        finalResults: finalResultsMap.get(key) || [],
        internships: internshipsMap.get(key) || [],
        activities: activitiesMap.get(key) || [],
        prizes: prizesMap.get(key) || [],
        certifications: certsMap.get(key) || [],
      };
    });

    const seen = new Set<string>();
    return enriched.filter((s) => {
      const k = s.enrollmentNo || s.id;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  } catch (err) {
    console.error("Failed to fetch student data:", err);
    return [];
  }
}

export async function fetchStudentById(id: string): Promise<Student | null> {
  const all = await fetchAllStudents();
  return all.find((s) => s.id === id) ?? null;
}
