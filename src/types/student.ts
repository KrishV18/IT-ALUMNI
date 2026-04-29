export interface StudentResult {
  sem1?: number;
  sem2?: number;
  sem3?: number;
  sem4?: number;
  sem5?: number;
  sem6?: number;
  sem7?: number;
  sem8?: number;
}

export interface Internship {
  title: string;
  company: string;
  location: string;
  mode: string;
  tech: string;
  duration: string;
  startDate: string;
  endDate: string;
  paid: string;
  stipend: string;
  companyWebsite: string;
  sector: string;
}

export interface Activity {
  eventName: string;
  role: string; // Participated / Organised
  place: string;
  date: string;
}

export interface Prize {
  eventName: string;
  date: string;
  location: string;
  level: string; // College / National / International
  position: string;
}

export interface Certification {
  name: string;
  issuedBy: string;
  date: string;
  credentialId: string;
  url: string;
}

export interface FinalResult {
  subject: string;
  grade: string;
  marks?: number;
}

export interface Student {
  id: string;
  sNo: string;
  enrollmentNo: string;
  group: string;
  name: string;
  specialization: string;
  contact: string;
  email: string;
  societies: string;
  linkedin: string;
  github: string;
  expertise: string[];
  gid: number;
  // Enriched from other sheets
  results?: StudentResult;
  finalResults?: FinalResult[];
  internships?: Internship[];
  activities?: Activity[];
  prizes?: Prize[];
  certifications?: Certification[];
}

// Raw Google Sheets gviz/tq JSON types
export interface RawCell {
  v: string | number | null;
  f?: string;
}
export interface RawRow {
  c: (RawCell | null)[];
}
export interface RawCol {
  id: string;
  label: string;
  type: string;
}
export interface RawTable {
  cols: RawCol[];
  rows: RawRow[];
  parsedNumHeaders?: number;
}
export interface RawSheetData {
  version: string;
  reqId: string;
  status: string;
  table: RawTable;
}
