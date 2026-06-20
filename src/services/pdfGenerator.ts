import { jsPDF } from "jspdf";
import { Student } from "@/types/student";

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
  while (s.length > 1 && d.getTextWidth(s + "\u2026") > maxW) s = s.slice(0,-1);
  return s + "\u2026";
}

function wrap(d: jsPDF, t: string, w: number): string[] {
  return t ? d.splitTextToSize(t, w) as string[] : [];
}

// ─── Photo Loading Utility ──────────────────────────────────────────────────────

/**
 * Fetch a student photo via the /api/photo/:enrollment route and return
 * { dataUrl, format } for jsPDF addImage. 
 * We draw the image onto an HTML5 canvas to standardize the output. This
 * automatically fixes EXIF rotation, transparent PNGs, and CMYK color spaces
 * which usually cause jsPDF to render images sideways or completely black.
 */
async function fetchPhotoBase64(
  enrollmentNo: string
): Promise<{ dataUrl: string; format: "JPEG" | "PNG" } | null> {
  if (!enrollmentNo) return null;
  try {
    const url = `/api/photo/${enrollmentNo}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (blob.size < 100) return null;

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(blob);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("No 2d context"));

        // Fill white background in case of transparent PNGs
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw the image (browser automatically applies EXIF rotation)
        ctx.drawImage(img, 0, 0);

        // Export as standard RGB JPEG
        resolve(canvas.toDataURL("image/jpeg", 0.95));
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Image load failed"));
      };

      img.src = objectUrl;
    });

    return { dataUrl, format: "JPEG" };
  } catch {
    return null;
  }
}

/** Pre-load all student photos in parallel, returning a map of enrollmentNo → base64 data */
async function preloadPhotos(
  students: Student[],
  onProgress?: (loaded: number, total: number) => void
): Promise<Map<string, { dataUrl: string; format: "JPEG" | "PNG" }>> {
  const map = new Map<string, { dataUrl: string; format: "JPEG" | "PNG" }>();
  const BATCH = 10; // fetch in batches to avoid overwhelming the browser
  let loaded = 0;
  const total = students.length;

  for (let i = 0; i < students.length; i += BATCH) {
    const batch = students.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async (s) => {
        if (!s.enrollmentNo) return;
        const result = await fetchPhotoBase64(s.enrollmentNo);
        if (result) map.set(s.enrollmentNo, result);
        loaded++;
        onProgress?.(loaded, total);
      })
    );
    // yield to browser between batches
    await new Promise((r) => setTimeout(r, 0));
  }
  return map;
}

// ─── Cover Page ───────────────────────────────────────────────────────────
function drawCover(doc: jsPDF) {
  sF(doc, C.cream); doc.rect(0,0,PW,PH,"F");
  const fm = 12;
  sD(doc, C.gold); doc.setLineWidth(3);
  doc.rect(fm,fm,PW-fm*2,PH-fm*2,"S");
  doc.setLineWidth(1); doc.rect(fm+4,fm+4,PW-(fm+4)*2,PH-(fm+4)*2,"S");
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
  sD(doc, C.gold); doc.setLineWidth(1); doc.line(fm+40,bY+38,PW-fm-40,bY+38);
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

// ─── Gather all section data for a student ────────────────────────────────
interface SectionItem { p: string; s?: string; b?: string }
interface SectionData { title: string; items: SectionItem[] }

const eventLabels: Record<string,string> = {
  Hackathon:"HACK", Technical:"TECH", "Non-Technical":"NON-TECH",
  Sport:"SPORT", Cultural:"CULTURAL", Workshop:"WORKSHOP",
  Society:"SOCIETY", Additional:"OTHER"
};

function gatherAllSections(s: Student): SectionData[] {
  const all: SectionData[] = [];

  const events = s.events.map(e=>({p:e.name, b:eventLabels[e.type]||e.type.toUpperCase().slice(0,8), s:e.position||undefined}));
  if (events.length) all.push({title:"EVENTS & COMPETITIONS", items:events});

  const vol = s.volunteering.map(v=>({p:v.organization, b:v.role?.toUpperCase().slice(0,12), s:v.eventName||undefined}));
  if (vol.length) all.push({title:"VOLUNTEERING", items:vol});

  const ngo = s.ngoWork.map(n=>({p:n.name, b:n.role?.toUpperCase().slice(0,12), s:undefined as string|undefined}));
  if (ngo.length) all.push({title:"NGO WORK", items:ngo});

  const courses: SectionItem[] = [];
  for (const c of s.moocCourses) courses.push({p:c.name, b:"MOOC", s:c.educator||undefined});
  for (const c of s.nptelCourses) courses.push({p:c.name, b:"NPTEL", s:c.iit||undefined});
  for (const c of s.certifications) courses.push({p:c.name, b:"CERT", s:c.educator||undefined});
  if (courses.length) all.push({title:"COURSES & CERTIFICATIONS", items:courses});

  const proj = s.projects.map(p=>({p:p.title, b:p.type?.toUpperCase().slice(0,8), s:p.domain||undefined}));
  if (proj.length) all.push({title:"PROJECTS", items:proj});

  const res = s.researchPapers.map(r=>({p:r.title, s:r.conference||undefined}));
  if (res.length) all.push({title:"RESEARCH PAPERS", items:res});

  const he = s.higherEducation.map(h=>({p:h.program, b:h.score?"SCORE:"+h.score:undefined, s:h.college||undefined}));
  if (he.length) all.push({title:"HIGHER EDUCATION", items:he});

  const cc = s.competitiveCoding.map(c=>({p:c.platform, s:c.profileLink||undefined}));
  if (cc.length) all.push({title:"COMPETITIVE CODING", items:cc});

  return all;
}

/** Estimate mm height of a section (header + items) at a given per-item height */
function estSectionH(sec: SectionData, perItem: number): number {
  return 8 + sec.items.length * perItem; // 8mm header, perItem mm per item
}

/** Greedy bin-packing: assign sections to two columns to minimize max height */
function balanceColumns(sections: SectionData[], perItem: number): { left: SectionData[]; right: SectionData[] } {
  // Sort sections largest-first for better packing
  const sorted = [...sections].sort((a, b) => b.items.length - a.items.length);
  const left: SectionData[] = [], right: SectionData[] = [];
  let hL = 0, hR = 0;
  for (const sec of sorted) {
    const h = estSectionH(sec, perItem);
    if (hL <= hR) { left.push(sec); hL += h; }
    else { right.push(sec); hR += h; }
  }
  return { left, right };
}

function countAllItems(secs: SectionData[]): number {
  return secs.reduce((n,s)=>n+s.items.length, 0);
}

// ─── Adaptive Student Page ───────────────────────────────────────────────────────────
function drawStudent(
  doc: jsPDF,
  s: Student,
  photoData: { dataUrl: string; format: "JPEG" | "PNG" } | null
) {
  sF(doc, C.cream); doc.rect(0,0,PW,PH,"F");
  sD(doc, C.gold); doc.setLineWidth(2); doc.rect(8,8,PW-16,PH-16,"S");

  const px=12, py=12, pw=PW-24;
  sF(doc, C.white); sD(doc, C.ink); doc.setLineWidth(0.8);
  rr(doc, px, py, pw, PH-24, 2, "FD");

  // Header bar
  sF(doc, C.teal); doc.rect(px, py, pw, 14, "F");
  sT(doc, C.white); doc.setFont("helvetica","bold"); doc.setFontSize(13);
  doc.text("Student Profile", px+8, py+10);
  if (s.group) {
    doc.setFontSize(8);
    const gw = doc.getTextWidth(s.group)+10;
    sF(doc, C.gold); rr(doc, px+pw-gw-6, py+3, gw, 8, 2, "F");
    sT(doc, C.ink); doc.text(s.group, px+pw-gw/2-6, py+8.5, {align:"center"});
  }

  // Info section (teal band)
  let y = py+18;
  const ix = px+8, cw = pw-16;
  sF(doc, C.teal); doc.rect(px, y, pw, 46, "F");
  const phX=ix+2, phY=y+3, phW=30, phH=38;
  sF(doc, C.tealDark); sD(doc, C.ink); doc.setLineWidth(0.5);
  rr(doc, phX-2, phY-2, phW+4, phH+4, 1, "FD");

  // Photo box — embed real photo if available, else show initials
  if (photoData) {
    try {
      // Clip to the photo region with a white background
      sF(doc, C.white); doc.rect(phX, phY, phW, phH-8, "F");
      doc.addImage(
        photoData.dataUrl,
        photoData.format,
        phX, phY,
        phW, phH-8,
        undefined,
        "MEDIUM"
      );
    } catch {
      // fallback to initials if addImage fails
      sF(doc, C.white); doc.rect(phX, phY, phW, phH-8, "F");
      sT(doc, [200,200,200]); doc.setFont("helvetica","bold"); doc.setFontSize(18);
      doc.text(initials(s.name), phX+phW/2, phY+(phH-8)/2+5, {align:"center"});
    }
  } else {
    sF(doc, C.white); doc.rect(phX, phY, phW, phH-8, "F");
    sT(doc, [200,200,200]); doc.setFont("helvetica","bold"); doc.setFontSize(18);
    doc.text(initials(s.name), phX+phW/2, phY+(phH-8)/2+5, {align:"center"});
  }

  sT(doc, C.white); doc.setFont("helvetica","bold"); doc.setFontSize(7);
  doc.text(trunc(doc, s.name.split(" ")[0]||"", phW), phX+phW/2, phY+phH-2, {align:"center"});

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

  // Career box (internship / startup)
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
      if (st.detail) fi.push("About: "+st.detail.slice(0,70)+(st.detail.length>70?"…":""));
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

  // ─── Perfect Fit-to-Page Layout Engine ──────────────────────────────
  const gap = 6;
  const quoteH = 26;
  const bottom = PH - 24 - quoteH;
  const allSections = gatherAllSections(s);
  const totalSections = allSections.length;
  const availH = bottom - y - 2;

  const singleCol = totalSections <= 1;
  const colW = singleCol ? cw : (cw - gap) / 2;
  const lX = ix, rX = singleCol ? ix : ix + colW + gap;

  // Simulator to calculate the height of a layout for a given budget
  const simulateLayout = (budget: number) => {
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
    const cfg = {
      primaryFs: clamp(budget * 0.85, 4.5, 7.5),
      titleFs: clamp(budget * 0.85, 5, 8),
      badgeFs: clamp(budget * 0.85 - 1.5, 3.5, 5.5),
      subFs: clamp(budget * 0.85 - 1, 4, 6),
      itemGap: clamp(budget * 0.15, 0.2, 2.5),
      sectionGap: clamp(budget * 0.25, 0.5, 3.5),
      showSub: budget >= 5,
      maxLines: budget < 4 ? 1 : 2
    };
    const lineH = cfg.primaryFs * 0.42;
    const subLineH = cfg.subFs * 0.42;

    const measureSection = (sec: SectionData) => {
      let h = cfg.titleFs * 0.42 + 3.5; // header height
      for (const it of sec.items) {
        const maxBadgeW = colW * 0.38;
        let bw = 0;
        if (it.b) {
          doc.setFont("helvetica","bold"); doc.setFontSize(cfg.badgeFs);
          const rawBw = doc.getTextWidth(it.b) + 6;
          bw = rawBw > maxBadgeW ? maxBadgeW : rawBw;
        }

        const txW = colW - 8 - (bw > 0 ? bw + 3 : 0);
        doc.setFont("helvetica","bold"); doc.setFontSize(cfg.primaryFs);
        const pl = wrap(doc, it.p, txW);
        const pc = Math.min(pl.length, cfg.maxLines);

        let ch = 2 + pc * lineH;
        if (it.s && cfg.showSub) ch += subLineH + 0.3;
        ch = Math.max(ch, bw > 0 ? cfg.badgeFs * 0.42 + 2.5 : lineH + 2);
        h += ch + cfg.itemGap;
      }
      return h + cfg.sectionGap;
    };

    // Sort sections by exact measured height for optimal bin-packing
    const measured = allSections.map(sec => ({ sec, h: measureSection(sec) }))
                                .sort((a, b) => b.h - a.h);
    
    const leftSecs: SectionData[] = [];
    const rightSecs: SectionData[] = [];
    let hL = 0, hR = 0;

    for (const { sec, h } of measured) {
      if (singleCol || hL <= hR) {
        leftSecs.push(sec);
        hL += h;
      } else {
        rightSecs.push(sec);
        hR += h;
      }
    }

    return { maxH: Math.max(hL, hR), leftSecs, rightSecs, cfg, lineH, subLineH };
  };

  // Binary search to find the absolute maximum budget that fits the page
  let low = 2, high = 15;
  let bestLayout = simulateLayout(2); // fallback to smallest possible
  
  if (totalSections > 0) {
    for (let i = 0; i < 12; i++) {
      const mid = (low + high) / 2;
      const layout = simulateLayout(mid);
      if (layout.maxH <= availH) {
        bestLayout = layout;
        low = mid;
      } else {
        high = mid;
      }
    }
  }

  const { leftSecs, rightSecs, cfg, lineH, subLineH } = bestLayout;
  let lY = y + 2, rY = y + 2;

  function renderSection(title: string, items: SectionItem[], cx: number, sy: number): number {
    if (!items.length || sy >= bottom) return sy;

    // Header
    doc.setFont("helvetica","bold"); doc.setFontSize(cfg.titleFs);
    sT(doc, C.ink);
    doc.text(title, cx + colW / 2, sy + cfg.titleFs * 0.35, {align:"center"});
    sy += cfg.titleFs * 0.42 + 1;
    sD(doc, C.gold); doc.setLineWidth(0.5);
    doc.line(cx + 6, sy, cx + colW - 6, sy);
    sy += 2;

    for (const it of items) {
      if (sy >= bottom) break;

      // Badge
      const maxBadgeW = colW * 0.38;
      let bw = 0, badgeText = it.b || "";
      if (badgeText) {
        doc.setFont("helvetica","bold"); doc.setFontSize(cfg.badgeFs);
        const rawBw = doc.getTextWidth(badgeText) + 6;
        if (rawBw > maxBadgeW) {
          badgeText = trunc(doc, badgeText, maxBadgeW - 6);
          bw = doc.getTextWidth(badgeText) + 6;
        } else { bw = rawBw; }
      }

      // Primary
      const txW = colW - 8 - (bw > 0 ? bw + 3 : 0);
      doc.setFont("helvetica","bold"); doc.setFontSize(cfg.primaryFs);
      const pl = wrap(doc, it.p, txW);
      const pc = Math.min(pl.length, cfg.maxLines);

      // Height
      let ch = 2 + pc * lineH;
      if (it.s && cfg.showSub) ch += subLineH + 0.3;
      ch = Math.max(ch, bw > 0 ? cfg.badgeFs * 0.42 + 2.5 : lineH + 2);
      if (sy + ch > bottom) break;

      // Card BG
      sF(doc, C.bg2); rr(doc, cx + 1, sy, colW - 2, ch, 1.2, "F");

      // Text
      sT(doc, C.ink); doc.setFont("helvetica","bold"); doc.setFontSize(cfg.primaryFs);
      const tY = sy + lineH + 0.6;
      for (let i = 0; i < pc; i++) {
        const lt = (i === pc - 1 && pl.length > pc) ? trunc(doc, pl[i], txW) : pl[i];
        doc.text(lt || "", cx + 4, tY + i * lineH);
      }

      // Badge Draw
      if (badgeText && bw > 0) {
        doc.setFont("helvetica","bold"); doc.setFontSize(cfg.badgeFs);
        const bh = cfg.badgeFs * 0.42 + 1.8;
        const bx = cx + colW - bw - 3, by = sy + (ch - bh) / 2;
        sF(doc, C.badgeBg); sD(doc, C.teal); doc.setLineWidth(0.15);
        rr(doc, bx, by, bw, bh, 1, "FD");
        sT(doc, C.teal); doc.text(badgeText, bx + 2.5, by + bh * 0.68);
      }

      // Secondary
      if (it.s && cfg.showSub) {
        doc.setFont("helvetica","normal"); doc.setFontSize(cfg.subFs); sT(doc, C.muted);
        doc.text(trunc(doc, it.s, colW - 10), cx + 4, tY + pc * lineH + 0.3);
      }
      sy += ch + cfg.itemGap;
    }
    return sy + cfg.sectionGap;
  }

  // Render columns
  for (const sec of leftSecs) { lY = renderSection(sec.title, sec.items, lX, lY); }
  if (!singleCol) {
    for (const sec of rightSecs) { rY = renderSection(sec.title, sec.items, rX, rY); }
  }

  // Column divider — skip in single-column mode
  const hasLeft = lY > y+4, hasRight = rY > y+4;
  if (!singleCol && hasLeft && hasRight) {
    const divX = ix+colW+gap/2;
    sD(doc, C.lightBorder); doc.setLineWidth(0.4);
    doc.line(divX, y+2, divX, Math.min(Math.max(lY, rY)-2, bottom));
  }

  // ─── Empty state for sparse profiles ────────────────────────────────
  if (!hasLeft && !hasRight && !hasInt && !hasSt) {
    const emptyY = y + 10;
    const emptyH = bottom - emptyY - 10;

    // Decorative centered block
    const bw = pw - 40, bx = px + 20;
    sF(doc, C.bg2); rr(doc, bx, emptyY, bw, Math.min(emptyH, 80), 4, "F");
    sD(doc, C.lightBorder); doc.setLineWidth(0.5);
    rr(doc, bx, emptyY, bw, Math.min(emptyH, 80), 4, "S");

    // Icon-like decoration
    const cx = PW / 2;
    sT(doc, C.lightBorder); doc.setFont("helvetica","bold"); doc.setFontSize(28);
    doc.text("~", cx, emptyY + 22, {align:"center"});

    sT(doc, C.muted); doc.setFont("helvetica","italic"); doc.setFontSize(11);
    doc.text("Journey in progress…", cx, emptyY + 36, {align:"center"});

    doc.setFont("helvetica","normal"); doc.setFontSize(8);
    sT(doc, C.lightBorder);
    doc.text("Activities and achievements will appear here", cx, emptyY + 48, {align:"center"});
    doc.text("as this student's profile grows.", cx, emptyY + 55, {align:"center"});

    // Name flourish at bottom of empty block
    sD(doc, C.gold); doc.setLineWidth(0.6);
    doc.line(cx - 25, emptyY + 64, cx + 25, emptyY + 64);
    sT(doc, C.teal); doc.setFont("helvetica","bold"); doc.setFontSize(10);
    doc.text(s.name, cx, emptyY + 72, {align:"center"});
  }

  // Signature quote — always at bottom
  const qY = PH - 24 - quoteH + 4;
  const qW = pw-24, qX = px+12;
  sF(doc, C.stickyBg); sD(doc, C.ink); doc.setLineWidth(0.5);
  rr(doc, qX, qY, qW, 20, 2, "FD");
  doc.setFont("helvetica","bold"); doc.setFontSize(5.5);
  sT(doc, C.ink); doc.text("SIGNATURE QUOTE", qX+5, qY+4);
  doc.setFont("helvetica","italic"); doc.setFontSize(8); sT(doc, C.ink);
  const q = s.quote || "Either you run the day, or the day runs you";
  const ql = wrap(doc, '"'+q+'"', qW-14);
  doc.text(ql[0]||"", qX+5, qY+10);
  if (ql[1]) doc.text(trunc(doc, ql[1], qW-14), qX+5, qY+14);
  doc.setFont("helvetica","italic"); doc.setFontSize(10);
  doc.text(s.name.split(" ")[0], qX+qW-6, qY+16, {align:"right"});
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
  onProgress?.(0, total, "Loading student photos...");

  // Pre-load all photos as base64 before generating PDF
  const photoMap = await preloadPhotos(sorted, (loaded, photoTotal) => {
    onProgress?.(0, total, `Loading photos... ${loaded}/${photoTotal}`);
  });

  onProgress?.(0, total, "Initializing PDF...");
  const doc = new jsPDF({orientation:"portrait", unit:"mm", format:"a4"});
  onProgress?.(0, total, "Creating cover page...");
  drawCover(doc);

  let curGroup = "";
  for (let i=0; i<sorted.length; i++) {
    const st = sorted[i], g = st.group.trim().toUpperCase();
    if (g!==curGroup && g) { curGroup=g; doc.addPage(); drawDivider(doc, st.group.trim()); }
    const photoData = photoMap.get(st.enrollmentNo) ?? null;
    doc.addPage(); drawStudent(doc, st, photoData);
    onProgress?.(i+1, total, `Rendering ${st.name}...`);
    if (i%10===0) await new Promise(r=>setTimeout(r,0));

  }
  onProgress?.(total, total, "Finalizing PDF...");
  return doc.output("blob");
}
