import { jsPDF } from "jspdf";
import { Student } from "@/types/student";

// ─── Colors ───────────────────────────────────────────────────────────────
type RGB = [number, number, number];
const C = {
  teal: [45, 96, 96] as RGB, tealDark: [30, 69, 69] as RGB,
  gold: [232, 168, 48] as RGB, cream: [250, 248, 243] as RGB,
  white: [255, 255, 255] as RGB, ink: [26, 26, 26] as RGB,
  muted: [107, 94, 78] as RGB, blush: [249, 224, 224] as RGB,
  bg2: [243, 240, 232] as RGB, stickyBg: [255, 249, 224] as RGB,
  badgeBg: [225, 238, 238] as RGB, lightBorder: [210, 205, 195] as RGB,
};

const PW = 210, PH = 297;

// ─── Helpers ──────────────────────────────────────────────────────────────
function sF(d: jsPDF, c: RGB) { d.setFillColor(c[0], c[1], c[2]); }
function sD(d: jsPDF, c: RGB) { d.setDrawColor(c[0], c[1], c[2]); }
function sT(d: jsPDF, c: RGB) { d.setTextColor(c[0], c[1], c[2]); }
function rr(d: jsPDF, x: number, y: number, w: number, h: number, r: number, s: "F"|"S"|"FD"="F") { d.roundedRect(x,y,w,h,r,r,s); }

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase();
}

function trunc(d: jsPDF, t: string, maxW: number): string {
  if (!t) return "";
  if (d.getTextWidth(t) <= maxW) return t;
  let s = t;
  while (s.length > 1 && d.getTextWidth(s + "...") > maxW) s = s.slice(0,-1);
  return s + "...";
}

function wrap(d: jsPDF, t: string, w: number): string[] {
  return t ? d.splitTextToSize(t, w) as string[] : [];
}

// ─── Cover Page ───────────────────────────────────────────────────────────
function drawCover(doc: jsPDF) {
  sF(doc, C.cream); doc.rect(0,0,PW,PH,"F");
  const fm = 12;
  sD(doc, C.gold); doc.setLineWidth(3);
  doc.rect(fm,fm,PW-fm*2,PH-fm*2,"S");
  doc.setLineWidth(1); doc.rect(fm+4,fm+4,PW-(fm+4)*2,PH-(fm+4)*2,"S");

  // Corners
  const ix=fm+4,iy=fm+4,iw=PW-(fm+4)*2,ih=PH-(fm+4)*2;
  doc.setLineWidth(1.5);
  [[ix+8,iy+8,1,0],[ix+8,iy+8,0,1],[ix+iw-8,iy+8,-1,0],[ix+iw-8,iy+8,0,1],
   [ix+8,iy+ih-8,1,0],[ix+8,iy+ih-8,0,-1],[ix+iw-8,iy+ih-8,-1,0],[ix+iw-8,iy+ih-8,0,-1],
  ].forEach(([x,y,dx,dy])=>doc.line(x,y,x+dx*20,y+dy*20));

  const cx = PW/2, bH = 70, bY = PH/2 - bH/2 - 10;
  sF(doc, C.teal); doc.rect(fm+20,bY,PW-(fm+20)*2,bH,"F");
  sD(doc, C.gold); doc.setLineWidth(2); doc.rect(fm+20,bY,PW-(fm+20)*2,bH,"S");

  sT(doc, C.white);
  doc.setFont("helvetica","bold"); doc.setFontSize(28);
  doc.text("MAIT", cx, bY+22, {align:"center"});
  doc.setFontSize(12); doc.setFont("helvetica","normal");
  doc.text("Maharaja Agrasen Institute of Technology", cx, bY+32, {align:"center"});
  sD(doc, C.gold); doc.setLineWidth(1);
  doc.line(fm+40,bY+38,PW-fm-40,bY+38);
  doc.setFont("helvetica","bold"); doc.setFontSize(16);
  doc.text("Department of Information Technology", cx, bY+50, {align:"center"});
  doc.setFontSize(14); doc.setFont("helvetica","normal");
  doc.text("Batch of 2022-2026", cx, bY+62, {align:"center"});

  sT(doc, C.teal); doc.setFont("helvetica","bold"); doc.setFontSize(36);
  doc.text("IT Connect", cx, bY-20, {align:"center"});
  doc.setFontSize(9); doc.setFont("helvetica","normal"); sT(doc, C.muted);
  doc.text("STUDENT YEARBOOK DIRECTORY", cx, bY-10, {align:"center"});
  sT(doc, C.muted); doc.setFontSize(9);
  doc.text("The digital yearbook for IT Department students and alumni", cx, PH-35, {align:"center"});
  sD(doc, C.gold); doc.setLineWidth(1); doc.line(PW/2-30,PH-30,PW/2+30,PH-30);
}

// ─── Group Divider ────────────────────────────────────────────────────────
function drawDivider(doc: jsPDF, name: string) {
  sF(doc, C.cream); doc.rect(0,0,PW,PH,"F");
  sD(doc, C.gold); doc.setLineWidth(2); doc.rect(20,20,PW-40,PH-40,"S");
  const cx=PW/2, cy=PH/2;
  sF(doc, C.teal); rr(doc,40,cy-20,PW-80,40,4,"F");
  sD(doc, C.gold); doc.setLineWidth(1.5); rr(doc,40,cy-20,PW-80,40,4,"S");
  sT(doc, C.white); doc.setFont("helvetica","bold"); doc.setFontSize(28);
  doc.text(`Group ${name}`, cx, cy+4, {align:"center"});
  sT(doc, C.muted); doc.setFont("helvetica","normal"); doc.setFontSize(10);
  doc.text("IT Department - Batch 2022-2026", cx, cy+30, {align:"center"});
}

// ─── Student Page ─────────────────────────────────────────────────────────
function drawStudent(doc: jsPDF, s: Student) {
  sF(doc, C.cream); doc.rect(0,0,PW,PH,"F");
  sD(doc, C.gold); doc.setLineWidth(2); doc.rect(8,8,PW-16,PH-16,"S");

  const px=12, py=12, pw=PW-24;
  sF(doc, C.white); sD(doc, C.ink); doc.setLineWidth(0.8);
  rr(doc, px, py, pw, PH-24, 2, "FD");

  // Header
  sF(doc, C.teal); doc.rect(px, py, pw, 14, "F");
  sT(doc, C.white); doc.setFont("helvetica","bold"); doc.setFontSize(13);
  doc.text("Student Profile", px+8, py+10);
  if (s.group) {
    doc.setFontSize(8);
    const gw = doc.getTextWidth(s.group)+10;
    sF(doc, C.gold); rr(doc, px+pw-gw-6, py+3, gw, 8, 2, "F");
    sT(doc, C.ink); doc.text(s.group, px+pw-gw/2-6, py+8.5, {align:"center"});
  }

  // Info section
  let y = py+18;
  const ix = px+8, cw = pw-16;
  sF(doc, C.teal); doc.rect(px, y, pw, 46, "F");

  // Polaroid
  const phX=ix+2, phY=y+3, phW=30, phH=38;
  sF(doc, C.tealDark); sD(doc, C.ink); doc.setLineWidth(0.5);
  rr(doc, phX-2, phY-2, phW+4, phH+4, 1, "FD");
  sF(doc, C.white); doc.rect(phX, phY, phW, phH-8, "F");
  sT(doc, [200,200,200]); doc.setFont("helvetica","bold"); doc.setFontSize(18);
  doc.text(initials(s.name), phX+phW/2, phY+(phH-8)/2+5, {align:"center"});
  sT(doc, C.white); doc.setFont("helvetica","bold"); doc.setFontSize(7);
  doc.text(trunc(doc, s.name.split(" ")[0]||"", phW), phX+phW/2, phY+phH-2, {align:"center"});

  // Info text
  const dX = phX+phW+12, dMaxW = cw-phW-22;
  let dY = y+9;
  const info = [["Name",s.name],["Enrollment",s.enrollmentNo||"-"],["Email",s.email||"-"],
    ["Group",s.group||"-"],["Mentor",s.mentor||"-"]];
  for (const [l,v] of info) {
    sT(doc, C.white); doc.setFont("helvetica","normal"); doc.setFontSize(8);
    const lt=l+": "; doc.text(lt, dX, dY);
    doc.setFont("helvetica","bold"); doc.text(trunc(doc, v, dMaxW-doc.getTextWidth(lt)), dX+doc.getTextWidth(lt), dY);
    dY += 7;
  }
  if (s.contact) {
    sT(doc, C.white); doc.setFont("helvetica","normal"); doc.setFontSize(8);
    const cl = "Contact: "; doc.text(cl, dX, dY);
    doc.setFont("helvetica","bold"); doc.text(s.contact, dX+doc.getTextWidth(cl), dY);
  }
  y += 49;

  // Career box
  const hasInt = s.internships.length>0, hasSt = s.startups.length>0;
  if (hasInt || hasSt) {
    const tab = hasInt ? "INTERNSHIP DETAILS" : "STARTUP DETAILS";
    doc.setFont("helvetica","bold"); doc.setFontSize(6.5);
    const tw = doc.getTextWidth(tab)+14;
    sF(doc, [254,249,237]); sD(doc, C.ink); doc.setLineWidth(0.4);
    rr(doc, ix+4, y, tw, 7, 1.5, "FD");
    sT(doc, C.ink); doc.text(tab, ix+11, y+4.5);
    const fY = y+6;
    const fi: string[] = [];
    if (hasInt) {
      const i=s.internships[0];
      if (i.organization) fi.push("Organization: "+i.organization);
      if (i.title) fi.push("Role: "+i.title);
      if (i.technology) fi.push("Technology: "+i.technology);
      if (i.duration) fi.push("Duration: "+i.duration);
      if (i.startDate) fi.push("Period: "+i.startDate+(i.endDate?" - "+i.endDate:""));
    } else {
      const st=s.startups[0];
      if (st.name) fi.push("Startup: "+st.name);
      if (st.detail) fi.push("About: "+st.detail.slice(0,70)+(st.detail.length>70?"...":""));
      if (st.role) fi.push("Role: "+st.role);
    }
    const fH = fi.length*6+6;
    sF(doc, C.blush); sD(doc, C.ink); doc.setLineWidth(0.4);
    rr(doc, ix, fY, cw, fH, 2, "FD");
    sT(doc, C.ink); doc.setFont("helvetica","normal"); doc.setFontSize(7.5);
    let fy = fY+5.5;
    for (const f of fi) { doc.text("  "+trunc(doc,f,cw-16), ix+4, fy); fy+=6; }
    y = fY+fH+4;
  }

  // ─── Sections ───────────────────────────────────────────────────────
  const gap=6, colW=(cw-gap)/2, lX=ix, rX=ix+colW+gap;
  const bottom = PH-42;
  let lY=y+2, rY=y+2;

  const labels: Record<string,string> = {
    Hackathon:"HACKATHON", Technical:"TECHNICAL", "Non-Technical":"NON-TECH",
    Sport:"SPORT", Cultural:"CULTURAL", Workshop:"WORKSHOP",
    Society:"SOCIETY", Additional:"OTHER"
  };

  function section(title: string, items: {p:string;s?:string;b?:string}[], cx: number, sy: number, mw: number): number {
    if (!items.length) return sy;
    doc.setFont("helvetica","bold"); doc.setFontSize(7);
    sT(doc, C.ink); doc.text(title, cx+mw/2, sy+2, {align:"center"});
    sy+=5;
    sD(doc, C.gold); doc.setLineWidth(0.6); doc.line(cx+6, sy, cx+mw-6, sy); sy+=4;

    for (const it of items) {
      if (sy > bottom) break;

      // Badge: measure and cap at 40% of column width
      const maxBadgeW = mw * 0.4;
      let bw = 0;
      let badgeText = it.b || "";
      if (badgeText) {
        doc.setFont("helvetica","bold"); doc.setFontSize(5.5);
        const rawBw = doc.getTextWidth(badgeText) + 8;
        if (rawBw > maxBadgeW) {
          badgeText = trunc(doc, badgeText, maxBadgeW - 8);
          bw = doc.getTextWidth(badgeText) + 8;
        } else {
          bw = rawBw;
        }
      }

      // Primary text width accounting for badge
      const txW = mw - 8 - (bw > 0 ? bw + 4 : 0);
      doc.setFont("helvetica","bold"); doc.setFontSize(7);
      const pl = wrap(doc, it.p, txW);
      const pc = Math.min(pl.length, 2);

      // Card height: primary lines + optional secondary
      let ch = 5 + pc * 4;
      if (it.s) ch += 4.5;
      ch = Math.max(ch, bw > 0 ? 11 : 9);
      if (sy + ch > bottom) break;

      // Card background
      sF(doc, C.bg2); rr(doc, cx+1, sy, mw-2, ch, 1.5, "F");

      // Primary text
      sT(doc, C.ink); doc.setFont("helvetica","bold"); doc.setFontSize(7);
      for (let i = 0; i < pc; i++) {
        const lt = (i === pc-1 && pl.length > pc) ? trunc(doc, pl[i], txW) : pl[i];
        doc.text(lt || "", cx+5, sy+4.5+i*4);
      }

      // Badge — right-aligned, vertically centered, truncated
      if (badgeText && bw > 0) {
        doc.setFont("helvetica","bold"); doc.setFontSize(5.5);
        const bx = cx+mw-bw-3, by = sy+(ch-5.5)/2;
        sF(doc, C.badgeBg); sD(doc, C.teal); doc.setLineWidth(0.2);
        rr(doc, bx, by, bw, 5.5, 1.2, "FD");
        sT(doc, C.teal); doc.text(badgeText, bx+3, by+3.8);
      }

      // Secondary text — also avoid badge area
      if (it.s) {
        doc.setFont("helvetica","normal"); doc.setFontSize(6); sT(doc, C.muted);
        const secMaxW = mw - 12;
        doc.text(trunc(doc, it.s, secMaxW), cx+5, sy+4.5+pc*4);
      }
      sy += ch + 2;
    }
    return sy + 2;
  }

  // Left column
  lY = section("EVENTS & COMPETITIONS",
    s.events.map(e=>({p:e.name, b:labels[e.type]||e.type.toUpperCase(), s:e.position||undefined})),
    lX, lY, colW);
  lY = section("VOLUNTEERING",
    s.volunteering.map(v=>({p:v.organization, b:v.role?.toUpperCase(), s:v.eventName||undefined})),
    lX, lY, colW);
  lY = section("NGO WORK",
    s.ngoWork.map(n=>({p:n.name, b:n.role?.toUpperCase(), s:n.about?.slice(0,80)||(undefined as string|undefined)})),
    lX, lY, colW);

  // Right column
  const courses: {p:string;s?:string;b?:string}[] = [];
  for (const c of s.moocCourses) courses.push({p:c.name, b:"MOOC", s:c.educator||c.duration||undefined});
  for (const c of s.nptelCourses) courses.push({p:c.name, b:"NPTEL", s:c.iit||c.educator||undefined});
  for (const c of s.certifications) courses.push({p:c.name, b:"CERT", s:c.educator||c.duration||undefined});
  rY = section("COURSES & CERTIFICATIONS", courses, rX, rY, colW);
  rY = section("PROJECTS",
    s.projects.map(p=>({p:p.title, b:p.type?.toUpperCase(), s:p.domain||undefined})),
    rX, rY, colW);
  rY = section("RESEARCH PAPERS",
    s.researchPapers.map(r=>({p:r.title, s:r.conference||r.authors||undefined})),
    rX, rY, colW);
  rY = section("HIGHER EDUCATION",
    s.higherEducation.map(h=>({p:h.program, b:h.score?"SCORE: "+h.score:undefined, s:h.college||undefined})),
    rX, rY, colW);
  rY = section("COMPETITIVE CODING",
    s.competitiveCoding.map(c=>({p:c.platform, s:c.profileLink||undefined})),
    rX, rY, colW);

  // Column divider — only if both columns have content
  const hasLeft = lY > y+4, hasRight = rY > y+4;
  if (hasLeft && hasRight) {
    const dX = ix+colW+gap/2;
    sD(doc, C.lightBorder); doc.setLineWidth(0.4);
    doc.line(dX, y+2, dX, Math.min(Math.max(lY, rY)-2, bottom));
  }

  // Empty state — if no content at all
  if (!hasLeft && !hasRight && !hasInt && !hasSt) {
    sF(doc, C.bg2); rr(doc, px+20, y+20, pw-40, 30, 3, "F");
    sD(doc, C.lightBorder); doc.setLineWidth(0.4); rr(doc, px+20, y+20, pw-40, 30, 3, "S");
    sT(doc, C.muted); doc.setFont("helvetica","italic"); doc.setFontSize(10);
    doc.text("No activities or achievements recorded yet", PW/2, y+38, {align:"center"});
  }

  // Signature Quote
  const qY=PH-40, qW=pw-24, qX=px+12;
  sF(doc, C.teal); doc.triangle(qX-4, qY+2, qX-4, qY+18, qX+6, qY+18, "F");
  sF(doc, C.stickyBg); sD(doc, C.ink); doc.setLineWidth(0.5);
  rr(doc, qX, qY, qW, 22, 2, "FD");
  doc.setFont("helvetica","bold"); doc.setFontSize(6);
  sT(doc, C.ink); doc.text("SIGNATURE QUOTE", qX+6, qY+4.5);
  doc.setFont("helvetica","italic"); doc.setFontSize(8.5); sT(doc, C.ink);
  const q = s.quote || "Either you run the day, or the day runs you";
  const ql = wrap(doc, '"'+q+'"', qW-14);
  doc.text(ql[0]||"", qX+6, qY+11);
  if (ql[1]) doc.text(trunc(doc, ql[1], qW-14), qX+6, qY+15.5);
  doc.setFont("helvetica","italic"); doc.setFontSize(11);
  doc.text(s.name.split(" ")[0], qX+qW-8, qY+18, {align:"right"});
}

// ─── Export ───────────────────────────────────────────────────────────────
export type ProgressCallback = (current: number, total: number, phase: string) => void;

export async function generateDirectoryPDF(students: Student[], onProgress?: ProgressCallback): Promise<Blob> {
  const order = ["8I1","8I2","8I3","8I4","8I5","8I6","8I7"];
  const sorted = [...students].sort((a,b) => {
    const oA = order.indexOf(a.group.trim().toUpperCase()), oB = order.indexOf(b.group.trim().toUpperCase());
    const rA = oA===-1?999:oA, rB = oB===-1?999:oB;
    if (rA!==rB) return rA-rB;
    return a.enrollmentNo.localeCompare(b.enrollmentNo);
  });

  const total = sorted.length;
  onProgress?.(0, total, "Initializing...");
  const doc = new jsPDF({orientation:"portrait", unit:"mm", format:"a4"});
  onProgress?.(0, total, "Creating cover page...");
  drawCover(doc);

  let curGroup = "";
  for (let i=0; i<sorted.length; i++) {
    const st = sorted[i], g = st.group.trim().toUpperCase();
    if (g!==curGroup && g) { curGroup=g; doc.addPage(); drawDivider(doc, st.group.trim()); }
    doc.addPage(); drawStudent(doc, st);
    onProgress?.(i+1, total, `Rendering ${st.name}...`);
    if (i%10===0) await new Promise(r=>setTimeout(r,0));
  }
  onProgress?.(total, total, "Finalizing PDF...");
  return doc.output("blob");
}
