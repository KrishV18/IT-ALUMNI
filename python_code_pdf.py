#!/usr/bin/env python3
"""
Complete adaptive yearbook generator
====================================

Designed for:
Department of Information Technology
Maharaja Agrasen Institute of Technology (MAIT), Rohini, Delhi
B.Tech Batch 2022-2026

Input workbook:
    Yearbook_Production_Data_2022_26_Enhanced.xlsx

Expected sheet:
    Yearbook_Profiles

Optional sheets used for front matter:
    Institutional_Content
    Readiness_Summary

Each student receives exactly ONE complete A4 page.
The layout changes automatically depending on:
    - photograph available / not available
    - number of verified highlights
    - number of skills
    - amount of profile text
    - available space in each content box

Important publication rules:
    - mobile number is never printed on student pages
    - private email/address fields are never printed
    - no achievement is invented merely to fill space
    - missing photograph => initials/monogram layout, not an empty photo box
    - uploaded/local signature image can be used when provided;
      otherwise a decorative name mark is used

Example:
python generate_complete_yearbook.py \
    --master Yearbook_Production_Data_2022_26_Enhanced.xlsx \
    --out IT_Yearbook_2022_26.pdf \
    --photo-dir ./photos \
    --photo-map photo_map.csv \
    --signature-dir ./signatures \
    --signature-map signature_map.csv

For a two-student preview:
python generate_complete_yearbook.py \
    --master Yearbook_Production_Data_2022_26_Enhanced.xlsx \
    --out preview.pdf \
    --photo-map photo_map.csv \
    --only "Manya Mangla,DEVVRATH GIRI"
"""

import argparse
import csv
import json
import math
import os
import re
import sys
import tempfile
import urllib.request
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


# ---------------------------------------------------------------------------
# 1. INSTITUTIONAL IDENTITY
# ---------------------------------------------------------------------------

INSTITUTE = "Maharaja Agrasen Institute of Technology"
DEPARTMENT = "Department of Information Technology"
LOCATION = "Rohini, Delhi"
BATCH = "B.Tech Batch 2022-2026"
WEBSITES = "www.mait.ac.in  |  it.mait.ac.in"

DEFAULT_ADDRESS = "PSP Area, Plot No. 1, Sector-22, Rohini, Delhi-110086, India"

DEFAULT_VISION = (
    "To establish a center of excellence promoting Information Technology related "
    "education and research for preparing technocrats and entrepreneurs with strong "
    "ethical values."
)

DEFAULT_MISSION = [
    "Impart quality education and skills for software development and applications.",
    "Promote intellectual growth and research.",
    "Encourage entrepreneurial skills, innovation and product development.",
    "Encourage competitive events, industry interaction and continuous learning.",
]


# ---------------------------------------------------------------------------
# 2. FONTS
# ---------------------------------------------------------------------------

def _find_font(candidates: List[str]) -> str:
    """Return first existing font path from candidates list."""
    for p in candidates:
        if Path(p).exists():
            return p
    raise FileNotFoundError(f"None of the candidate fonts found: {candidates}")

# Windows paths first, then Linux/macOS fallbacks
FONT_REG = _find_font([
    r"C:\Windows\Fonts\calibri.ttf",
    r"C:\Windows\Fonts\arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
])
FONT_BOLD = _find_font([
    r"C:\Windows\Fonts\calibrib.ttf",
    r"C:\Windows\Fonts\arialbd.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
])
FONT_ITALIC = _find_font([
    r"C:\Windows\Fonts\calibrii.ttf",
    r"C:\Windows\Fonts\ariali.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
])

pdfmetrics.registerFont(TTFont("YB-Regular", FONT_REG))
pdfmetrics.registerFont(TTFont("YB-Bold", FONT_BOLD))
pdfmetrics.registerFont(TTFont("YB-Italic", FONT_ITALIC))


# ---------------------------------------------------------------------------
# 3. SUBTLE PROFESSIONAL THEMES
# ---------------------------------------------------------------------------

THEMES = {
    "Slate Blue": {
        "primary": HexColor("#234A68"),
        "accent": HexColor("#6D8DA6"),
        "soft": HexColor("#EAF0F4"),
        "soft2": HexColor("#F5F7F9"),
        "highlight1": HexColor("#E9F2F4"),
        "highlight2": HexColor("#F3ECEC"),
    },
    "Teal": {
        "primary": HexColor("#225E5A"),
        "accent": HexColor("#6B9893"),
        "soft": HexColor("#E9F3F1"),
        "soft2": HexColor("#F5F8F7"),
        "highlight1": HexColor("#EDF4EF"),
        "highlight2": HexColor("#F5EFE8"),
    },
    "Burgundy": {
        "primary": HexColor("#6A3744"),
        "accent": HexColor("#A26D79"),
        "soft": HexColor("#F4EBED"),
        "soft2": HexColor("#FAF7F8"),
        "highlight1": HexColor("#EEF2F5"),
        "highlight2": HexColor("#F5F0E8"),
    },
    "Forest": {
        "primary": HexColor("#355A49"),
        "accent": HexColor("#718C7E"),
        "soft": HexColor("#EDF2EF"),
        "soft2": HexColor("#F7F8F7"),
        "highlight1": HexColor("#EEF3F6"),
        "highlight2": HexColor("#F5ECEB"),
    },
}

WHITE = HexColor("#FFFFFF")
INK = HexColor("#24333F")
MUTED = HexColor("#687782")
LINE = HexColor("#D8E0E4")
PAPER = HexColor("#FBFAF7")
GOLD = HexColor("#C89B49")


# ---------------------------------------------------------------------------
# 4. GENERAL HELPERS
# ---------------------------------------------------------------------------

def blank(v) -> bool:
    if v is None:
        return True
    try:
        if isinstance(v, float) and math.isnan(v):
            return True
    except Exception:
        pass
    return str(v).replace("\u200b", "").strip().lower() in {
        "", "na", "n/a", "none", "null", "nan"
    }


def text(v) -> str:
    return "" if blank(v) else str(v).strip()


def safe_filename(s: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "_", s.strip()).strip("_")
    return s or "student"


def norm_name(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", str(s).lower())


def parse_list_cell(s: str, sep: str = "•") -> List[str]:
    if blank(s):
        return []
    parts = [x.strip() for x in str(s).split(sep)]
    return [x for x in parts if x]


def wrap_text(txt: str, font: str, size: float, width: float,
              max_lines: Optional[int] = None) -> List[str]:
    words = str(txt).split()
    lines: List[str] = []
    current = ""

    for word in words:
        trial = word if not current else current + " " + word
        if stringWidth(trial, font, size) <= width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word

    if current:
        lines.append(current)

    if max_lines and len(lines) > max_lines:
        lines = lines[:max_lines]
        last = lines[-1]
        while last and stringWidth(last + "...", font, size) > width:
            last = last[:-1]
        lines[-1] = last.rstrip() + "..."

    return lines


def draw_wrapped(c, txt, x, y_top, width, font="YB-Regular", size=9,
                 leading=12, color=INK, max_lines=None):
    c.setFont(font, size)
    c.setFillColor(color)
    y = y_top
    for line in wrap_text(txt, font, size, width, max_lines):
        c.drawString(x, y, line)
        y -= leading
    return y


def fitted_text_layout(txt: str, font: str, width: float, height: float,
                       max_size: float, min_size: float = 6.2,
                       leading_ratio: float = 1.28,
                       max_lines: Optional[int] = None):
    """Return (font_size, leading, lines) that fits the text in a box.

    This is used throughout the student page so typography expands when content
    is short and contracts modestly when content is long. It avoids both large
    empty boxes and excessively small text.
    """
    if blank(txt):
        return max_size, max_size * leading_ratio, []

    size = max_size
    while size >= min_size:
        leading = size * leading_ratio
        lines = wrap_text(txt, font, size, width, max_lines=None)
        if max_lines is not None and len(lines) > max_lines:
            size -= 0.35
            continue
        required_h = max(1, len(lines)) * leading
        if required_h <= height:
            return size, leading, lines
        size -= 0.35

    size = min_size
    leading = size * leading_ratio
    line_cap = max(1, int(height // leading))
    if max_lines is not None:
        line_cap = min(line_cap, max_lines)
    lines = wrap_text(txt, font, size, width, max_lines=line_cap)
    return size, leading, lines


def draw_fitted_text(c, txt, x, y_top, width, height,
                     font="YB-Regular", max_size=10, min_size=6.2,
                     color=INK, max_lines=None, leading_ratio=1.28,
                     align="left", fill_height=False):
    size, leading, lines = fitted_text_layout(
        txt, font, width, height, max_size, min_size,
        leading_ratio=leading_ratio, max_lines=max_lines
    )
    # When fill_height is True, spread lines to use the full box height
    if fill_height and len(lines) > 1:
        required_h = len(lines) * leading
        if required_h < height * 0.85:
            # Increase leading to fill the box (capped at 2x base leading)
            new_leading = height / len(lines)
            leading = min(new_leading, leading * 2.0)
    c.setFont(font, size)
    c.setFillColor(color)
    y = y_top
    for line in lines:
        if align == "center":
            c.drawCentredString(x + width/2, y, line)
        else:
            c.drawString(x, y, line)
        y -= leading
    return y, size, lines


def rounded_box(c, x, y, w, h, fill=WHITE, stroke=LINE,
                radius=10, line_width=0.7):
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.setLineWidth(line_width)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=1)


def section_label(c, txt, x, y, theme):
    c.setFillColor(theme["primary"])
    c.setFont("YB-Bold", 8)
    c.drawString(x, y, txt.upper())


def initials(name: str) -> str:
    parts = [p for p in str(name).split() if p]
    if not parts:
        return "IT"
    return "".join(p[0].upper() for p in parts[:2])


# ---------------------------------------------------------------------------
# 5. DATA LOADING — Google Sheets API + Excel/JSON fallback
# ---------------------------------------------------------------------------

# ── Google Sheets connection details (mirror of sheetsService.ts) ────────────
SHEET_ID  = os.environ.get("GOOGLE_SHEETS_SHEET_ID", "")
API_KEY   = os.environ.get("GOOGLE_SHEETS_API_KEY", "")
SHEET_TAB = os.environ.get("GOOGLE_SHEETS_TAB", "Sheet1")

# Column indices (0-based), identical to COL map in sheetsService.ts
_C = dict(
    TIMESTAMP=0, EMAIL_LOGIN=1, NAME=2, ENROLLMENT=3, CONTACT=4, EMAIL=5,
    GROUP=6, MENTOR=7, ACTIVITIES_SEL=8,
    # Hackathon
    HACK_NAME=9, HACK_DATE=10, HACK_PLACE=11, HACK_CONDUCTOR=12,
    HACK_POSITION=13, HACK_CATEGORY=14, HACK_CERT=15,
    # Technical
    TECH_NAME=16, TECH_DATE=17, TECH_PLACE=18, TECH_CONDUCTOR=19,
    TECH_POSITION=20, TECH_CATEGORY=21, TECH_CERT=22,
    # Non-Technical
    NTECH_NAME=23, NTECH_DATE=24, NTECH_PLACE=25, NTECH_CONDUCTOR=26,
    NTECH_POSITION=27, NTECH_CATEGORY=28, NTECH_CERT=29,
    # Sport
    SPORT_NAME=30, SPORT_DATE=31, SPORT_PLACE=32, SPORT_CONDUCTOR=33,
    SPORT_POSITION=34, SPORT_CATEGORY=35, SPORT_CERT=36,
    # Cultural
    CULT_NAME=37, CULT_DATE=38, CULT_PLACE=39, CULT_CONDUCTOR=40,
    CULT_POSITION=41, CULT_CATEGORY=42, CULT_CERT=43,
    # MOOC
    MOOC_NAME=44, MOOC_START=45, MOOC_END=46, MOOC_EDUCATOR=47,
    MOOC_DURATION=48, MOOC_GRADE=49, MOOC_COMPLETED=50, MOOC_CERT=51,
    # NPTEL
    NPTEL_NAME=52, NPTEL_DURATION=53, NPTEL_START=54, NPTEL_END=55,
    NPTEL_SCORE=56, NPTEL_CANDIDATES=57, NPTEL_EDUCATOR=58, NPTEL_IIT=59, NPTEL_CERT=60,
    # Certification
    CERT_NAME=61, CERT_START=62, CERT_END=63, CERT_DURATION=64,
    CERT_GRADE=65, CERT_EDUCATOR=66, CERT_CERT=67,
    # Internship
    INT_ORG=68, INT_TITLE=69, INT_TECH=70, INT_START=71,
    INT_END=72, INT_DURATION=73, INT_TRAINER=74, INT_CERT=75,
    # Workshop 1
    WS1_NAME=76, WS1_START=77, WS1_END=78, WS1_PLACE=79,
    WS1_POSITION=80, WS1_CERT=81,
    # Workshop 2
    WS2_NAME=82, WS2_START=83, WS2_END=84, WS2_PLACE=85,
    WS2_POSITION=86, WS2_CERT=87,
    # Society 1
    SOC1_SOCIETY=88, SOC1_EVENT=89, SOC1_ROLE=90, SOC1_DATE=91,
    SOC1_PLACE=92, SOC1_CATEGORY=93, SOC1_CERT=94,
    # Society 2
    SOC2_SOCIETY=95, SOC2_EVENT=96, SOC2_ROLE=97, SOC2_START=98,
    SOC2_END=99, SOC2_PLACE=100, SOC2_CATEGORY=101, SOC2_CERT=102,
    # Volunteering
    VOL_ORG=103, VOL_EVENT=104, VOL_START=105, VOL_END=106,
    VOL_PLACE=107, VOL_ROLE=108, VOL_CERT=109,
    # Startup
    STARTUP_NAME=110, STARTUP_DETAIL=111, STARTUP_FOUNDERS=112,
    STARTUP_START=117, STARTUP_ADDR=118, STARTUP_EMAIL=120, STARTUP_ROLE=121,
    # Project
    PROJ_TITLE=139, PROJ_TYPE=140, PROJ_TEAM=141,
    PROJ_DOMAIN=142, PROJ_SDG=143, PROJ_CERT=144,
    # NGO
    NGO_NAME=145, NGO_ABOUT=146, NGO_ROLE=147, NGO_EVENT_DONE=148,
    NGO_EVENT_NAME=149, NGO_EVENT_DATE=150, NGO_EVENT_PLACE=151, NGO_CERT=152,
    # Research
    RES_TITLE=153, RES_AUTHORS=154, RES_CONF=155, RES_CONDUCTOR=156,
    RES_PLACE=157, RES_DATE=158, RES_INDEXING=160, RES_DOI=161, RES_ISSN=162,
    # Higher Education
    HE_PROGRAM=165, HE_COLLEGE=166, HE_LOCATION=167, HE_SCORE=168,
    # GATE/CAT
    GATE_YEAR=170, GATE_SCORE=171, GATE_PERCENTILE=172,
    # LeetCode
    LC_ENROLLED=174, LC_LINK=175,
    # HackerRank
    HR_ENROLLED=177, HR_LINK=178,
    # Additional events (10 slots at 180-199)
    EXTRA_EVENTS_START=180,
    # Quote / Photo
    QUOTE=200, PHOTO=201, SIGNATURE=203,
)


def _gc(row: List[str], col_name: str) -> str:
    """Get a Google Sheets cell value by column name."""
    idx = _C.get(col_name, -1)
    if idx < 0 or idx >= len(row):
        return ""
    return str(row[idx]).strip()


def fetch_sheets_rows() -> List[List[str]]:
    """Fetch all data rows from Google Sheets API."""
    url = (
        f"https://sheets.googleapis.com/v4/spreadsheets/{SHEET_ID}/values/"
        f"{SHEET_TAB}?key={API_KEY}"
    )
    with urllib.request.urlopen(url, timeout=30) as resp:
        data = json.loads(resp.read().decode())
    values = data.get("values", [])
    if len(values) < 2:
        return []
    return values[1:]  # skip header row


def _build_highlights_from_row(row: List[str]) -> List[Dict[str, str]]:
    """Convert a Sheets row into up to 6 Highlight dicts for the PDF."""
    highlights: List[Dict[str, str]] = []

    # Internship → Highlight
    org   = _gc(row, "INT_ORG")
    title = _gc(row, "INT_TITLE")
    tech  = _gc(row, "INT_TECH")
    dur   = _gc(row, "INT_DURATION")
    if org or title:
        head = f"{title} at {org}" if title and org else (title or org)
        det_parts = []
        if tech:  det_parts.append(f"Tech: {tech}")
        if dur:   det_parts.append(f"Duration: {dur}")
        highlights.append({"category": "Internship", "headline": head,
                           "details": "  •  ".join(det_parts)})

    # Startup → Highlight
    sname  = _gc(row, "STARTUP_NAME")
    sdetail = _gc(row, "STARTUP_DETAIL")
    srole   = _gc(row, "STARTUP_ROLE")
    if sname:
        det = sdetail[:120] + ("…" if len(sdetail) > 120 else "") if sdetail else ""
        if srole:
            det = f"Role: {srole}" + ("  •  " + det if det else "")
        highlights.append({"category": "Startup / Entrepreneurship",
                           "headline": sname, "details": det})

    # Research paper → Highlight
    rtitle  = _gc(row, "RES_TITLE")
    rconf   = _gc(row, "RES_CONF")
    rauthors = _gc(row, "RES_AUTHORS")
    if rtitle:
        highlights.append({"category": "Research", "headline": rtitle,
                           "details": "  •  ".join(filter(None, [rconf, rauthors]))})

    # Project → Highlight
    ptitle  = _gc(row, "PROJ_TITLE")
    pdomain = _gc(row, "PROJ_DOMAIN")
    ptype   = _gc(row, "PROJ_TYPE")
    if ptitle:
        highlights.append({"category": f"Project — {ptype}" if ptype else "Project",
                           "headline": ptitle,
                           "details": pdomain})

    # Hackathon → Highlight
    hname = _gc(row, "HACK_NAME")
    hpos  = _gc(row, "HACK_POSITION")
    hplace = _gc(row, "HACK_PLACE")
    if hname:
        det = "  •  ".join(filter(None, [f"Position: {hpos}" if hpos else "", hplace]))
        highlights.append({"category": "Hackathon", "headline": hname,
                           "details": det})

    # Technical event → Highlight
    tname = _gc(row, "TECH_NAME")
    tpos  = _gc(row, "TECH_POSITION")
    tcat  = _gc(row, "TECH_CATEGORY")
    if tname:
        highlights.append({"category": f"Technical — {tcat}" if tcat else "Technical Event",
                           "headline": tname,
                           "details": f"Position: {tpos}" if tpos else ""})

    # Higher Education → Highlight
    heprog  = _gc(row, "HE_PROGRAM")
    hecollege = _gc(row, "HE_COLLEGE")
    hescore  = _gc(row, "HE_SCORE")
    if heprog:
        det = "  •  ".join(filter(None, [hecollege, f"Score: {hescore}" if hescore else ""]))
        highlights.append({"category": "Higher Education",
                           "headline": heprog, "details": det})

    # Cultural / Sport events
    for cat_key, name_key, pos_key in [
        ("Cultural",     "CULT_NAME",  "CULT_POSITION"),
        ("Sports",       "SPORT_NAME", "SPORT_POSITION"),
        ("Non-Technical","NTECH_NAME", "NTECH_POSITION"),
    ]:
        evname = _gc(row, name_key)
        evpos  = _gc(row, pos_key)
        if evname:
            highlights.append({"category": cat_key, "headline": evname,
                               "details": f"Position: {evpos}" if evpos else ""})

    # Workshop events
    for ws_name in ["WS1_NAME", "WS2_NAME"]:
        wn = _gc(row, ws_name)
        if wn:
            highlights.append({"category": "Workshop / Seminar", "headline": wn, "details": ""})

    # Society participation
    soc_name = _gc(row, "SOC1_SOCIETY")
    soc_role = _gc(row, "SOC1_ROLE")
    soc_event = _gc(row, "SOC1_EVENT")
    if soc_name:
        highlights.append({"category": "Society",
                           "headline": soc_name,
                           "details": "  •  ".join(filter(None, [soc_event, f"Role: {soc_role}" if soc_role else ""]))})

    # Volunteering / NGO
    vol_org   = _gc(row, "VOL_ORG")
    vol_event = _gc(row, "VOL_EVENT")
    vol_role  = _gc(row, "VOL_ROLE")
    if vol_org or vol_event:
        head = vol_org or vol_event
        det  = f"Role: {vol_role}" if vol_role else ""
        highlights.append({"category": "Volunteering", "headline": head, "details": det})

    ngo_name = _gc(row, "NGO_NAME")
    ngo_role = _gc(row, "NGO_ROLE")
    if ngo_name:
        highlights.append({"category": "NGO Work", "headline": ngo_name,
                           "details": f"Role: {ngo_role}" if ngo_role else ""})

    # Additional events (up to 10 slots at cols 180-199)
    for i in range(10):
        ev_col = _C["EXTRA_EVENTS_START"] + i * 2
        if ev_col < len(row) and str(row[ev_col]).strip():
            highlights.append({"category": "Achievement",
                               "headline": str(row[ev_col]).strip(), "details": ""})

    return highlights[:6]  # page fits max 6


def _build_skills_from_row(row: List[str]) -> str:
    """Build a bullet-separated skills string from courses, tech, coding platforms."""
    skills = []

    tech  = _gc(row, "INT_TECH")
    if tech:
        for t in re.split(r'[,/;|]+', tech):
            t = t.strip()
            if t and len(t) <= 30:
                skills.append(t)

    for name_key in ["MOOC_NAME", "NPTEL_NAME", "CERT_NAME"]:
        n = _gc(row, name_key)
        if n and len(n) <= 40:
            skills.append(n)

    if _gc(row, "LC_ENROLLED").lower() == "yes" or _gc(row, "LC_LINK"):
        skills.append("LeetCode")
    if _gc(row, "HR_ENROLLED").lower() == "yes" or _gc(row, "HR_LINK"):
        skills.append("HackerRank")

    # Deduplicate preserving order
    seen = set()
    unique = []
    for s in skills:
        sl = s.lower()
        if sl not in seen:
            seen.add(sl)
            unique.append(s)

    return " • ".join(unique)


def _build_glance_from_row(row: List[str]) -> List[Tuple[str, str]]:
    """Build up to 3 At-a-Glance stats from quantitative row data."""
    glance: List[Tuple[str, str]] = []

    # Count events
    event_count = sum(1 for key in [
        "HACK_NAME", "TECH_NAME", "NTECH_NAME",
        "SPORT_NAME", "CULT_NAME", "WS1_NAME", "WS2_NAME",
    ] if _gc(row, key))
    if event_count:
        glance.append((str(event_count), "Events & Competitions"))

    # Courses / certs
    course_count = sum(1 for key in ["MOOC_NAME", "NPTEL_NAME", "CERT_NAME"]
                       if _gc(row, key))
    if course_count:
        glance.append((str(course_count), "Courses & Certifications"))

    # NPTEL score
    nptel_score = _gc(row, "NPTEL_SCORE")
    if nptel_score:
        glance.append((f"{nptel_score}%", "NPTEL Score"))
    elif _gc(row, "INT_ORG") or _gc(row, "INT_TITLE"):
        glance.append(("1", "Industry Internship"))

    return glance[:3]


def _build_profile_summary(row: List[str]) -> str:
    """Compose a concise profile paragraph from verified data."""
    name  = _gc(row, "NAME")
    group = _gc(row, "GROUP")

    parts = []
    prefix = f"{name}" if name else "This student"
    prefix += f" (Group {group})" if group else ""
    parts.append(prefix)

    # Internship
    org   = _gc(row, "INT_ORG")
    title = _gc(row, "INT_TITLE")
    tech  = _gc(row, "INT_TECH")
    if org or title:
        line = "completed an internship"
        if title:  line += f" as {title}"
        if org:    line += f" at {org}"
        if tech:   line += f" using {tech}"
        parts.append(line)

    # Research
    if _gc(row, "RES_TITLE"):
        conf = _gc(row, "RES_CONF")
        line = f"co-authored a research paper"
        if conf: line += f" presented at {conf}"
        parts.append(line)

    # Project
    ptitle = _gc(row, "PROJ_TITLE")
    if ptitle:
        dom = _gc(row, "PROJ_DOMAIN")
        line = f"developed a project — {ptitle[:60]}"
        if dom: line += f" (Domain: {dom})"
        parts.append(line)

    # Higher education
    prog = _gc(row, "HE_PROGRAM")
    if prog:
        college = _gc(row, "HE_COLLEGE")
        line = f"is pursuing {prog}"
        if college: line += f" at {college}"
        parts.append(line)

    # Courses
    courses = []
    for key in ["MOOC_NAME", "NPTEL_NAME", "CERT_NAME"]:
        v = _gc(row, key)
        if v:
            courses.append(v[:50])
    if courses:
        parts.append(f"completed {'and '.join(courses[:2])}")

    # Events
    events = []
    for key in ["HACK_NAME", "TECH_NAME", "CULT_NAME", "SPORT_NAME"]:
        v = _gc(row, key)
        if v:
            events.append(v[:50])
    if events:
        parts.append(f"participated in events including {events[0]}"
                     + (f" and {len(events)-1} more" if len(events) > 1 else ""))

    if len(parts) <= 1:
        parts.append("is an IT Department student at MAIT, Batch 2022-2026")

    return "; ".join(parts) + "."


def _pick_accent_theme(row: List[str]) -> str:
    """Assign an accent theme based on the student's group for visual variety."""
    group = _gc(row, "GROUP").upper().strip()
    mapping = {
        "8I1": "Teal",
        "8I2": "Slate Blue",
        "8I3": "Burgundy",
        "8I4": "Forest",
        "8I5": "Teal",
        "8I6": "Slate Blue",
        "8I7": "Burgundy",
    }
    return mapping.get(group, "Teal")


def sheets_row_to_dict(row: List[str]) -> Optional[Dict[str, str]]:
    """Convert a raw Google Sheets row to the student profile dict the PDF engine expects."""
    name = _gc(row, "NAME")
    if not name:
        return None

    highlights = _build_highlights_from_row(row)
    skills_str = _build_skills_from_row(row)
    glance     = _build_glance_from_row(row)
    profile    = _build_profile_summary(row)

    d: Dict[str, str] = {
        "Student Name":    name,
        "Roll No.":        _gc(row, "ENROLLMENT"),
        "Group":           _gc(row, "GROUP"),
        "Mentor":          _gc(row, "MENTOR"),
        "Email":           _gc(row, "EMAIL") or _gc(row, "EMAIL_LOGIN"),
        "Yearbook Quote":  _gc(row, "QUOTE") or "Either you run the day, or the day runs you.",
        "Profile Summary": profile,
        "Core Skills / Tech Stack": skills_str,
        "Accent Theme":    _pick_accent_theme(row),
        # Photo – will be resolved from data/photos/ by resolve_image()
        "Photograph Link": "",
        "Signature / Name Mark": "",
    }

    # Inject Highlights
    for i, h in enumerate(highlights, 1):
        d[f"Highlight {i} Category"] = h.get("category", "")
        d[f"Highlight {i} Headline"] = h.get("headline", "")
        d[f"Highlight {i} Details"]  = h.get("details", "")

    # Inject Glance
    for i, (metric, desc) in enumerate(glance, 1):
        d[f"At a Glance {i} Metric"]      = metric
        d[f"At a Glance {i} Description"] = desc

    return d


def load_yearbook_data(master_path: str):
    """Load data from a JSON/Excel file (legacy) or Google Sheets (when master_path='sheets')."""
    if master_path == "sheets":
        print("Fetching data from Google Sheets…", file=sys.stderr)
        raw_rows = fetch_sheets_rows()
        print(f"  → {len(raw_rows)} rows received.", file=sys.stderr)
        return None, [], raw_rows, {}, {}

    if str(master_path).lower().endswith(".json"):
        with open(master_path, "r", encoding="utf-8") as f:
            payload = json.load(f)
        return None, payload.get("headers", []), payload.get("rows", []), payload.get("institutional", {}), payload.get("readiness", {})

    # Legacy Excel path (artifact_tool only available in specific environments)
    try:
        from artifact_tool import Blob, SpreadsheetFile
    except ImportError:
        raise RuntimeError(
            "artifact_tool not available. Use --master sheets (Google Sheets) "
            "or --master data.json instead."
        )
    def read_sheet(workbook, sheet_name, cell_range):
        ws = workbook.worksheets.get_item(sheet_name)
        return ws.get_range(cell_range).values
    wb = SpreadsheetFile.import_xlsx(Blob.load(master_path))
    values = read_sheet(wb, "Yearbook_Profiles", "A1:AZ500")
    headers = [text(h) for h in values[0]]
    rows = []
    for row in values[1:]:
        if len(row) < 2 or blank(row[1]):
            continue
        rows.append(list(row))
    institutional, readiness = {}, {}
    try:
        ivals = read_sheet(wb, "Institutional_Content", "A1:D100")
        for r in ivals[1:]:
            if not r or blank(r[0]):
                continue
            institutional[text(r[0])] = text(r[1])
    except Exception:
        pass
    try:
        svals = read_sheet(wb, "Readiness_Summary", "A1:B50")
        for r in svals[1:]:
            if not r or blank(r[0]):
                continue
            readiness[text(r[0])] = r[1]
    except Exception:
        pass
    return wb, headers, rows, institutional, readiness


def row_dict(headers: List[str], row: List) -> Dict[str, str]:
    """Convert a raw Sheets or Excel row to a profile dict.

    When headers is empty the row came from Google Sheets and we use the
    column-index based sheets_row_to_dict() mapper instead.
    """
    if not headers:
        return sheets_row_to_dict(row) or {}
    out = {}
    for i, h in enumerate(headers):
        if not h:
            continue
        if i < len(row):
            out[h] = text(row[i])
    return out


# ---------------------------------------------------------------------------
# 6. PHOTO / SIGNATURE RESOLUTION
# ---------------------------------------------------------------------------

IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp"]


def load_path_map(csv_path: Optional[str]) -> Dict[str, str]:
    """
    CSV accepted formats:
      Student Name,Photo Path
      Student Name,Signature Path

    The second column name does not matter.
    """
    mapping = {}
    if not csv_path:
        return mapping
    p = Path(csv_path)
    if not p.exists():
        return mapping

    with p.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f)
        rows = list(reader)

    if not rows:
        return mapping

    start = 1 if rows[0] and "student" in rows[0][0].lower() else 0
    for r in rows[start:]:
        if len(r) < 2:
            continue
        name = norm_name(r[0])
        path = r[1].strip()
        if name and path:
            mapping[name] = path
    return mapping


def resolve_image(name: str, roll: str, direct_value: str,
                  directory: Optional[str], mapping: Dict[str, str]) -> Optional[str]:
    key = norm_name(name)

    # 1. Explicit mapping has highest priority.
    mapped = mapping.get(key)
    if mapped and Path(mapped).exists():
        return mapped

    # 2. If workbook field itself contains a local path.
    if direct_value and not direct_value.lower().startswith(("http://", "https://")):
        if Path(direct_value).exists():
            return direct_value

    # 3. Search local directory with safe deterministic patterns.
    if directory:
        d = Path(directory)
        if d.exists():
            # Try enrollment/roll number directly (photos are named like 00114803122.jpg)
            if roll:
                clean_roll = roll.strip().replace("/", "").replace(" ", "")
                # Try raw, then zero-padded to 11 digits (photo naming convention)
                roll_variants = [clean_roll]
                if clean_roll.isdigit():
                    roll_variants.append(clean_roll.zfill(11))
                for rv in roll_variants:
                    for ext in IMAGE_EXTS:
                        p = d / f"{rv}{ext}"
                        if p.exists():
                            return str(p)

            base_candidates = [
                safe_filename(name),
                safe_filename(name).lower(),
                f"{roll}_{safe_filename(name)}",
                f"{roll}_{safe_filename(name).lower()}",
            ]
            for base in base_candidates:
                for ext in IMAGE_EXTS:
                    p = d / f"{base}{ext}"
                    if p.exists():
                        return str(p)

            # Case-insensitive normalized-name fallback.
            for p in d.iterdir():
                if not p.is_file() or p.suffix.lower() not in IMAGE_EXTS:
                    continue
                if norm_name(p.stem) == key:
                    return str(p)

    return None


def crop_photo(src: str, dst: str, size=(640, 900), radius=0):
    """Fast print-resolution crop for the modest portrait frame.

    640 px across a ~2.0 inch printed portrait is ~300 dpi. JPEG output is
    much faster and smaller than per-student alpha PNG while preserving print
    quality; the surrounding rounded card provides the visual treatment.
    """
    im = Image.open(src).convert("RGB")
    target_ratio = size[0] / size[1]
    src_ratio = im.width / im.height
    if src_ratio > target_ratio:
        new_w = int(im.height * target_ratio)
        left = (im.width - new_w) // 2
        im = im.crop((left, 0, left + new_w, im.height))
    else:
        new_h = int(im.width / target_ratio)
        top = max(0, (im.height - new_h) // 2)
        im = im.crop((0, top, im.width, top + new_h))
    im = im.resize(size, Image.LANCZOS)
    if str(dst).lower().endswith(('.jpg','.jpeg')):
        im.save(dst, 'JPEG', quality=92, optimize=True, subsampling=0, dpi=(300,300))
    else:
        im.save(dst, optimize=True)

def make_monogram(name: str, dst: str, size=(900, 1100), radius=44,
                  bg=(236, 241, 244), fg=(35, 74, 104)):
    im = Image.new("RGB", size, bg)
    d = ImageDraw.Draw(im)
    mon = initials(name)

    try:
        font = ImageFont.truetype(FONT_BOLD, 220)
    except Exception:
        font = None

    box = d.textbbox((0, 0), mon, font=font)
    tw, th = box[2]-box[0], box[3]-box[1]
    d.text(((size[0]-tw)/2, (size[1]-th)/2 - 25), mon, fill=fg, font=font)

    mask = Image.new("L", size, 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle((0, 0, size[0]-1, size[1]-1), radius=radius, fill=255)

    out = im.convert("RGBA")
    out.putalpha(mask)
    out.save(dst)


# ---------------------------------------------------------------------------
# 7. STUDENT CONTENT EXTRACTION
# ---------------------------------------------------------------------------

def get_highlights(d: Dict[str, str]) -> List[Dict[str, str]]:
    result = []
    for n in range(1, 7):
        cat = d.get(f"Highlight {n} Category", "")
        head = d.get(f"Highlight {n} Headline", "")
        det = d.get(f"Highlight {n} Details", "")
        if head:
            result.append({"category": cat or "Highlight", "headline": head, "details": det})
    return result


def get_glance(d: Dict[str, str]) -> List[Tuple[str, str]]:
    items = []
    seen = set()
    for n in range(1, 4):
        metric = d.get(f"At a Glance {n} Metric", "")
        desc = d.get(f"At a Glance {n} Description", "")
        if metric:
            key=(metric.strip().lower(), desc.strip().lower())
            if key in seen:
                continue
            seen.add(key)
            items.append((metric, desc))
    return items


# ---------------------------------------------------------------------------
# 8. COVER / FRONT MATTER
# ---------------------------------------------------------------------------

def page_footer(c, page_no: Optional[int] = None):
    W, _ = A4
    c.setStrokeColor(LINE)
    c.line(32, 36, W-32, 36)
    c.setFillColor(MUTED)
    c.setFont("YB-Regular", 7.0)
    c.drawString(32, 22, f"{DEPARTMENT} | MAIT")
    c.drawCentredString(W/2, 22, BATCH)
    c.drawRightString(W-32, 22, WEBSITES)


def draw_cover(c):
    W, H = A4
    c.setFillColor(PAPER)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # restrained institutional composition
    c.setFillColor(HexColor("#234A68"))
    c.rect(0, H*0.62, W, H*0.38, fill=1, stroke=0)

    c.setFillColor(WHITE)
    c.setFont("YB-Bold", 14)
    c.drawString(42, H-74, DEPARTMENT)

    c.setFont("YB-Regular", 10)
    c.drawString(42, H-94, INSTITUTE)
    c.drawString(42, H-111, LOCATION)

    c.setFillColor(HexColor("#234A68"))
    c.setFont("YB-Bold", 35)
    c.drawString(42, H*0.52, "YEARBOOK")

    c.setFillColor(GOLD)
    c.setFont("YB-Bold", 25)
    c.drawString(42, H*0.52-38, "2022-2026")

    c.setFillColor(INK)
    c.setFont("YB-Regular", 15)
    c.drawString(42, H*0.52-76, "B.Tech - Information Technology")

    c.setFillColor(MUTED)
    c.setFont("YB-Regular", 9)
    c.drawString(42, 68, WEBSITES)

    # simple editorial linework
    c.setStrokeColor(HexColor("#B8C6CE"))
    c.setLineWidth(1)
    c.line(42, H*0.39, W-42, H*0.39)
    c.line(42, H*0.37, W*0.58, H*0.37)

    c.showPage()


def draw_department_page(c, institutional: Dict[str, str]):
    """Department identity page with stronger, publication-style typography.

    Institutional content is intentionally larger and bolder than ordinary student-page
    body text, while retaining generous whitespace and a formal academic appearance.
    """
    W, H = A4
    c.setFillColor(PAPER)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    primary = HexColor("#234A68")
    soft = HexColor("#F0F4F6")

    # Strong institutional header
    c.setFillColor(primary)
    dept_title = "Department of Information Technology"
    dept_title_size = 28
    while dept_title_size > 21 and stringWidth(dept_title, "YB-Bold", dept_title_size) > W-84:
        dept_title_size -= 0.5
    c.setFont("YB-Bold", dept_title_size)
    c.drawString(42, H-66, dept_title)

    c.setFillColor(INK)
    c.setFont("YB-Bold", 11.5)
    c.drawString(42, H-91, INSTITUTE)

    c.setFillColor(MUTED)
    c.setFont("YB-Bold", 10.2)
    c.drawString(42, H-110, f"{LOCATION}  |  B.Tech Information Technology  |  Batch 2022-2026")

    # About Department
    rounded_box(c, 42, H-270, W-84, 132, fill=soft, stroke=soft)
    c.setFillColor(primary)
    c.setFont("YB-Bold", 12)
    c.drawString(58, H-163, "ABOUT THE DEPARTMENT")

    about = institutional.get(
        "Department Overview",
        "The Department of Information Technology emphasizes practical learning, "
        "research-oriented teaching, modern computing infrastructure, innovation, "
        "industry interaction, internships and student participation in technical events."
    )
    draw_wrapped(c, about, 58, H-191, W-116,
                 font="YB-Bold", size=10.2, leading=14.2,
                 color=INK, max_lines=5)

    # Vision
    rounded_box(c, 42, H-445, W-84, 145, fill=WHITE)
    c.setFillColor(primary)
    c.setFont("YB-Bold", 12)
    c.drawString(58, H-327, "DEPARTMENT VISION")

    vision = institutional.get("Department Vision", DEFAULT_VISION)
    draw_wrapped(c, vision, 58, H-356, W-116,
                 font="YB-Bold", size=10.6, leading=14.8,
                 color=INK, max_lines=6)

    # Mission - larger text with clearer visual hierarchy
    rounded_box(c, 42, H-710, W-84, 235, fill=WHITE)
    c.setFillColor(primary)
    c.setFont("YB-Bold", 12)
    c.drawString(58, H-503, "DEPARTMENT MISSION")

    mission = []
    for key in ["Department Mission M1", "Department Mission M2",
                "Department Mission M3", "Department Mission M4"]:
        if institutional.get(key):
            mission.append(institutional[key])
    mission = mission or DEFAULT_MISSION

    y = H-536
    for i, item in enumerate(mission[:4], 1):
        # Mission number badge
        c.setFillColor(primary)
        c.circle(69, y+2, 13, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("YB-Bold", 8.5)
        c.drawCentredString(69, y-1, f"M{i}")

        y = draw_wrapped(c, item, 92, y+5, W-158,
                         font="YB-Bold", size=9.4, leading=12.6,
                         color=INK, max_lines=3) - 10

    # Official websites - prominent but restrained
    c.setFillColor(primary)
    c.setFont("YB-Bold", 9.5)
    c.drawString(42, 74, institutional.get("Websites", WEBSITES))

    page_footer(c)
    c.showPage()

def draw_batch_snapshot(c, readiness: Dict[str, object]):
    W, H = A4
    c.setFillColor(PAPER)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    primary = HexColor("#355A49")
    c.setFillColor(primary)
    c.setFont("YB-Bold", 26)
    c.drawString(42, H-68, "Batch 2022-2026")

    c.setFillColor(MUTED)
    c.setFont("YB-Regular", 10)
    c.drawString(42, H-90, "Yearbook production snapshot")

    def number(key, default=0):
        v = readiness.get(key, default)
        try:
            return int(float(v))
        except Exception:
            return default

    cards = [
        ("Students", number("Total Students", 0)),
        ("Photo Available", number("Photo Available", 0)),
        ("No Photo / Initials", number("No Photo / Use Initials", 0)),
        ("Ready Profiles", number("Ready / Ready with Name Mark", 0)),
        ("Rich Profiles", number("Rich Profiles", 0)),
        ("Good Profiles", number("Good Profiles", 0)),
    ]

    x0, y0 = 42, H-180
    gap = 12
    card_w = (W-84-gap)/2
    card_h = 105

    for idx, (label_txt, value) in enumerate(cards):
        col = idx % 2
        row = idx // 2
        x = x0 + col*(card_w+gap)
        y = y0 - row*(card_h+gap)
        rounded_box(c, x, y-card_h, card_w, card_h,
                    fill=HexColor("#F2F5F3"))
        c.setFillColor(primary)
        c.setFont("YB-Bold", 28)
        c.drawString(x+18, y-42, str(value))
        c.setFillColor(INK)
        c.setFont("YB-Bold", 9)
        c.drawString(x+18, y-68, label_txt)

    # editorial note
    rounded_box(c, 42, 84, W-84, 140, fill=WHITE)
    section_label(c, "Editorial Approach", 58, 197, {"primary": primary})
    note = (
        "Every student receives one full A4 page. Pages use a restrained academic "
        "design with adaptive composition: real photographs are used when available; "
        "otherwise the layout shifts to a monogram/profile-led page. Verified achievements "
        "are prioritized, while private contact information is retained only in the master data."
    )
    draw_wrapped(c, note, 58, 174, W-116, size=9, leading=13, max_lines=7)

    page_footer(c)
    c.showPage()


# ---------------------------------------------------------------------------
# 9. STUDENT PAGE COMPONENTS
# ---------------------------------------------------------------------------

def theme_for(d: Dict[str, str]):
    name = d.get("Accent Theme", "Slate Blue")
    return THEMES.get(name, THEMES["Slate Blue"])


def draw_identity_header(c, d, theme):
    W, H = A4
    x, y, w, h = 32, H-118, W-64, 82

    rounded_box(c, x, y, w, h, fill=theme["primary"],
                stroke=theme["primary"], radius=12, line_width=0)

    name = d.get("Student Name", "Student")
    name_width = w - 110
    name_size, _, name_lines = fitted_text_layout(
        name, "YB-Bold", name_width, 29,
        max_size=24, min_size=15, leading_ratio=1.0, max_lines=1
    )
    c.setFillColor(WHITE)
    c.setFont("YB-Bold", name_size)
    c.drawString(x+20, y+44, name_lines[0] if name_lines else name)

    meta = (
        f"Roll No. {d.get('Roll No.','')}   |   "
        f"Group {d.get('Group','')}   |   "
        f"Mentor: {d.get('Mentor','')}"
    )
    meta_size, _, meta_lines = fitted_text_layout(
        meta, "YB-Regular", name_width, 16,
        max_size=8.8, min_size=6.8, leading_ratio=1.0, max_lines=1
    )
    c.setFont("YB-Regular", meta_size)
    c.setFillColor(HexColor("#E4ECF0"))
    c.drawString(x+20, y+22, meta_lines[0] if meta_lines else meta)

    # Roll medallion
    c.setFillColor(WHITE)
    c.circle(x+w-34, y+h/2, 19, fill=1, stroke=0)
    c.setFillColor(theme["primary"])
    c.setFont("YB-Bold", 9)
    roll = d.get("Roll No.", "")
    c.drawCentredString(x+w-34, y+h/2-3, roll)


def draw_photo_panel(c, d, theme, photo_path, signature_path,
                     left_x, body_top, left_w, body_bottom):
    """Photo-led left column that consumes the complete available height."""
    name = d.get("Student Name", "")
    quote = d.get("Yearbook Quote", "")
    glance = get_glance(d)

    body_h = body_top-body_bottom
    gap = 10

    # A longer quote slightly reduces the portrait area; short quotes get more portrait.
    qlen = len(quote)
    photo_ratio = 0.43 if qlen < 85 else (0.40 if qlen < 145 else 0.37)
    quote_ratio = 0.18 if qlen < 85 else (0.21 if qlen < 145 else 0.24)
    photo_h = body_h*photo_ratio
    quote_h = body_h*quote_ratio
    glance_h = 102 if glance else 0

    y = body_top

    rounded_box(c, left_x, y-photo_h, left_w, photo_h,
                fill=WHITE, radius=12)
    _tmp_dir = tempfile.gettempdir()
    temp_photo = os.path.join(_tmp_dir, f"_yb_photo_print_{safe_filename(name)}.jpg")
    inner_w = left_w-16
    inner_h = photo_h-16
    target_px_w = 640
    target_px_h = max(720, int(target_px_w * inner_h / inner_w))
    crop_photo(photo_path, temp_photo, size=(target_px_w, target_px_h), radius=44)
    c.drawImage(ImageReader(temp_photo),
                left_x+8, y-photo_h+8,
                width=inner_w, height=inner_h,
                preserveAspectRatio=False, mask="auto")
    y -= photo_h+gap

    rounded_box(c, left_x, y-quote_h, left_w, quote_h,
                fill=theme["soft"], stroke=theme["soft"], radius=12)
    section_label(c, "Yearbook Quote", left_x+12, y-19, theme)
    quote_text = f'"{quote}"'
    quote_text_h = max(30, quote_h-44)
    draw_fitted_text(
        c, quote_text, left_x+12, y-42, left_w-24, quote_text_h,
        font="YB-Italic", max_size=11.2, min_size=7.4,
        color=theme["primary"], max_lines=7, leading_ratio=1.34
    )
    y -= quote_h+gap

    if glance_h:
        rounded_box(c, left_x, y-glance_h, left_w, glance_h,
                    fill=WHITE, radius=12)
        section_label(c, "At a Glance", left_x+12, y-18, theme)
        slot_h = (glance_h-30)/max(1, len(glance[:3]))
        gy = y-37
        for metric, desc in glance[:3]:
            metric_h = slot_h*0.40
            desc_h = slot_h*0.48
            _, ms, _ = draw_fitted_text(
                c, metric, left_x+12, gy, left_w-24, metric_h,
                font="YB-Bold", max_size=9.2, min_size=6.8,
                color=theme["primary"], max_lines=2, leading_ratio=1.10
            )
            draw_fitted_text(
                c, desc, left_x+12, gy-ms-5, left_w-24, desc_h,
                font="YB-Regular", max_size=6.7, min_size=5.8,
                color=MUTED, max_lines=2, leading_ratio=1.18
            )
            gy -= slot_h
        y -= glance_h+gap

    sig_h = max(62, y-body_bottom)
    rounded_box(c, left_x, body_bottom, left_w, sig_h,
                fill=WHITE, radius=12)
    section_label(c, "Signature / Name Mark",
                  left_x+12, body_bottom+sig_h-18, theme)

    if signature_path and Path(signature_path).exists():
        c.drawImage(ImageReader(signature_path),
                    left_x+18, body_bottom+14,
                    width=left_w-36, height=max(30, sig_h-42),
                    preserveAspectRatio=True, mask="auto")
    else:
        draw_fitted_text(
            c, name, left_x+10, body_bottom+sig_h/2+4,
            left_w-20, max(22, sig_h/2-18),
            font="YB-Italic", max_size=16, min_size=9,
            color=theme["primary"], max_lines=2,
            leading_ratio=1.1, align="center"
        )


def draw_no_photo_identity_panel(c, d, theme, left_x, body_top,
                                 left_w, body_bottom, signature_path):
    """No-photo mode: intentional monogram/profile composition; never an empty frame."""
    name = d.get("Student Name", "")
    quote = d.get("Yearbook Quote", "")
    glance = get_glance(d)

    gap = 10
    body_h = body_top-body_bottom
    qlen = len(quote)

    hero_h = body_h*(0.34 if qlen < 120 else 0.30)
    quote_h = body_h*(0.21 if qlen < 120 else 0.25)
    glance_h = 105 if glance else 0
    y = body_top

    rounded_box(c, left_x, y-hero_h, left_w, hero_h,
                fill=theme["soft"], stroke=theme["soft"], radius=12)

    c.setFillColor(WHITE)
    radius = min(left_w*0.29, hero_h*0.27, 44)
    c.circle(left_x+left_w/2, y-hero_h*0.43, radius,
             fill=1, stroke=0)

    mon = initials(name)
    mon_size = min(30, max(20, radius*0.70))
    c.setFillColor(theme["primary"])
    c.setFont("YB-Bold", mon_size)
    c.drawCentredString(left_x+left_w/2,
                       y-hero_h*0.43-mon_size*0.34, mon)

    c.setFont("YB-Bold", 8.5)
    c.drawCentredString(left_x+left_w/2, y-hero_h+28,
                       "LEARN  |  BUILD  |  GROW")
    y -= hero_h+gap

    rounded_box(c, left_x, y-quote_h, left_w, quote_h,
                fill=theme["highlight2"], stroke=theme["highlight2"],
                radius=12)
    section_label(c, "Yearbook Quote", left_x+12, y-19, theme)
    draw_fitted_text(
        c, f'"{quote}"', left_x+12, y-42, left_w-24, max(30, quote_h-44),
        font="YB-Italic", max_size=11.2, min_size=7.2,
        color=theme["primary"], max_lines=8, leading_ratio=1.32
    )
    y -= quote_h+gap

    if glance_h:
        rounded_box(c, left_x, y-glance_h, left_w, glance_h,
                    fill=WHITE, radius=12)
        section_label(c, "At a Glance", left_x+12, y-18, theme)
        slot_h = (glance_h-30)/max(1, len(glance[:3]))
        gy = y-37
        for metric, desc in glance[:3]:
            _, ms, _ = draw_fitted_text(
                c, metric, left_x+12, gy, left_w-24, slot_h*0.40,
                font="YB-Bold", max_size=9.2, min_size=6.8,
                color=theme["primary"], max_lines=2, leading_ratio=1.10
            )
            draw_fitted_text(
                c, desc, left_x+12, gy-ms-5, left_w-24, slot_h*0.48,
                font="YB-Regular", max_size=6.7, min_size=5.8,
                color=MUTED, max_lines=2, leading_ratio=1.18
            )
            gy -= slot_h
        y -= glance_h+gap

    sig_h = max(60, y-body_bottom)
    rounded_box(c, left_x, body_bottom, left_w, sig_h,
                fill=WHITE, radius=12)
    section_label(c, "Signature / Name Mark",
                  left_x+12, body_bottom+sig_h-18, theme)

    if signature_path and Path(signature_path).exists():
        c.drawImage(ImageReader(signature_path),
                    left_x+18, body_bottom+14,
                    width=left_w-36, height=max(28, sig_h-42),
                    preserveAspectRatio=True, mask="auto")
    else:
        draw_fitted_text(
            c, name, left_x+10, body_bottom+sig_h/2+4,
            left_w-20, max(22, sig_h/2-18),
            font="YB-Italic", max_size=16, min_size=9,
            color=theme["primary"], max_lines=2,
            leading_ratio=1.1, align="center"
        )


def draw_skill_chips(c, skills: List[str], x, y_top, w, h, theme):
    rounded_box(c, x, y_top-h, w, h, fill=WHITE, radius=12)
    section_label(c, "Core Skills / Tech Stack", x+14, y_top-18, theme)

    if not skills:
        # Do not invent technical abilities for sparse profiles.
        c.setFillColor(MUTED)
        draw_fitted_text(
            c, "Verified technical-skill data is not available in the consolidated record.",
            x+14, y_top-43, w-28, max(28, h-54),
            font="YB-Regular", max_size=9.4, min_size=7.2,
            color=MUTED, max_lines=4, leading_ratio=1.28, align="left"
        )
        return

    count = min(10, len(skills))
    if count <= 4 and h >= 90:
        base_size = 8.4
    else:
        base_size = 7.6 if count <= 5 else (7.1 if count <= 8 else 6.6)
    chip_h = 19 if h >= 90 else 18
    row_step = chip_h + 6

    chip_x = x+14
    chip_y = y_top-43
    max_x = x+w-14
    max_bottom = y_top-h+12

    for skill in skills[:10]:
        font_size = base_size
        max_chip_w = w-28
        while font_size > 5.8 and stringWidth(skill, "YB-Bold", font_size)+18 > max_chip_w:
            font_size -= 0.3
        tw = min(max_chip_w, stringWidth(skill, "YB-Bold", font_size)+18)

        if chip_x+tw > max_x:
            chip_x = x+14
            chip_y -= row_step

        if chip_y-chip_h/2 < max_bottom:
            break

        c.setFillColor(theme["soft"])
        c.setStrokeColor(theme["soft"])
        c.roundRect(chip_x, chip_y-chip_h/2, tw, chip_h, chip_h/2,
                    fill=1, stroke=0)
        c.setFillColor(theme["primary"])
        c.setFont("YB-Bold", font_size)
        shown = skill
        while shown and stringWidth(shown, "YB-Bold", font_size) > tw-12:
            shown = shown[:-1]
        if shown != skill:
            shown = shown.rstrip()+"..."
        c.drawCentredString(chip_x+tw/2, chip_y-font_size*0.35, shown)
        chip_x += tw+6


def draw_profile_box(c, d, x, y_top, w, h, theme, no_photo=False):
    rounded_box(c, x, y_top-h, w, h,
                fill=theme["soft2"], stroke=theme["soft2"], radius=12)

    section_label(c, "Profile", x+14, y_top-20, theme)

    summary = d.get("Profile Summary", "")
    if not summary:
        summary = (
            "A student profile based on the strongest verified academic and "
            "professional information available in the yearbook master data."
        )

    text_h = max(45, h-50)
    # Short summaries are allowed to breathe; long summaries shrink only as needed.
    if h >= 160 and len(summary) < 220:
        max_size = 12.2
    else:
        max_size = 10.1 if len(summary) < 180 else 9.1
    if no_photo and len(summary) < 220:
        max_size += 0.4
    draw_fitted_text(
        c, summary, x+14, y_top-44, w-28, text_h,
        font="YB-Regular", max_size=max_size, min_size=7.0,
        color=INK, max_lines=9, leading_ratio=1.30
    )


def draw_highlight_grid(c, highlights: List[Dict[str, str]],
                        x, y, w, h, theme):
    """Adaptive grid: both card geometry and typography use the available space."""
    if not highlights:
        highlights = [{
            "category": "Academic Journey",
            "headline": "Learning & Professional Development",
            "details": "Profile based on the verified information currently available."
        }]

    highlights = highlights[:6]
    n = len(highlights)
    gap = 9

    if n == 1:
        positions = [(x, y, w, h)]
    elif n == 2:
        ch = (h-gap)/2
        positions = [(x, y+ch+gap, w, ch), (x, y, w, ch)]
    elif n == 3:
        top_h = (h-gap)/2
        bottom_h = h-gap-top_h
        cw = (w-gap)/2
        positions = [
            (x, y+bottom_h+gap, w, top_h),
            (x, y, cw, bottom_h),
            (x+cw+gap, y, cw, bottom_h),
        ]
    elif n == 4:
        cw = (w-gap)/2
        ch = (h-gap)/2
        positions = [
            (x, y+ch+gap, cw, ch),
            (x+cw+gap, y+ch+gap, cw, ch),
            (x, y, cw, ch),
            (x+cw+gap, y, cw, ch),
        ]
    else:
        cw = (w-gap)/2
        ch = (h-2*gap)/3
        positions = []
        for r in range(3):
            yy = y+(2-r)*(ch+gap)
            for col in range(2):
                positions.append((x+col*(cw+gap), yy, cw, ch))
        positions = positions[:n]

    fills = [
        theme["highlight1"], theme["highlight2"], theme["soft"],
        HexColor("#F4F3EE"), HexColor("#EFF2F5"), HexColor("#F3EFEF"),
    ]

    for idx, (item, (cx, cy, cw, ch)) in enumerate(zip(highlights, positions)):
        rounded_box(c, cx, cy, cw, ch, fill=WHITE, radius=10)

        band_h = min(28, max(21, ch*0.16))
        c.setFillColor(fills[idx % len(fills)])
        c.roundRect(cx, cy+ch-band_h, cw, band_h, 10, fill=1, stroke=0)

        cat = item.get("category", "Highlight").upper()
        cat_size, _, cat_lines = fitted_text_layout(
            cat, "YB-Bold", cw-22, band_h-8,
            max_size=8.1, min_size=6.1, leading_ratio=1.0, max_lines=1
        )
        c.setFillColor(theme["primary"])
        c.setFont("YB-Bold", cat_size)
        c.drawString(cx+11, cy+ch-band_h+(band_h-cat_size)/2-1,
                     cat_lines[0] if cat_lines else cat)

        headline = item.get("headline", "")
        details = item.get("details", "")

        text_top = cy+ch-band_h-14
        available_h = max(30, ch-band_h-22)
        # Sparse profiles often have one or two large cards. Move concise content
        # toward the visual center rather than leaving all information at the top.
        if n == 1:
            content_target = 92 if details else 62
            text_top -= max(0, (available_h-content_target)/2)
        elif n == 2 and (not details or len(details) < 75):
            content_target = 78 if details else 52
            text_top -= max(0, (available_h-content_target)/2)
        # Reserve more space for the headline when it is long.
        if n <= 2:
            head_share = 0.34 if len(headline) < 90 else 0.42
        else:
            head_share = 0.46 if len(headline) > 85 else 0.38
        head_h = available_h*head_share
        detail_h = available_h-head_h-5

        if n <= 2 and ch > 180:
            headline_max = 17.0
        elif n <= 3 and ch > 150:
            headline_max = 13.5
        else:
            headline_max = 11.2 if ch > 170 else (10.0 if ch > 120 else 9.0)
        _, head_size, head_lines = draw_fitted_text(
            c, headline, cx+11, text_top, cw-22, head_h,
            font="YB-Bold", max_size=headline_max, min_size=6.8,
            color=INK, max_lines=4 if ch > 150 else 3,
            leading_ratio=1.22
        )
        used_head_h = max(1, len(head_lines))*head_size*1.22
        detail_top = text_top-used_head_h-5

        if n <= 2 and ch > 180:
            detail_max = 11.2
        elif n <= 3 and ch > 150:
            detail_max = 9.6
        else:
            detail_max = 8.4 if ch > 170 else (7.8 if ch > 120 else 7.1)
        draw_fitted_text(
            c, details, cx+11, detail_top, cw-22, max(16, detail_h),
            font="YB-Regular", max_size=detail_max, min_size=5.9,
            color=MUTED, max_lines=6 if ch > 150 else 4,
            leading_ratio=1.24
        )


def draw_student_page(c, d: Dict[str, str],
                      photo_path: Optional[str],
                      signature_path: Optional[str],
                      page_no: int):
    W, H = A4
    theme = theme_for(d)

    c.setFillColor(PAPER)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    draw_identity_header(c, d, theme)

    body_top = H-134
    body_bottom = 51
    left_x = 32
    left_w = 154
    gap = 12
    right_x = left_x+left_w+gap
    right_w = W-32-right_x

    highlights = get_highlights(d)
    skills = parse_list_cell(d.get("Core Skills / Tech Stack", ""))
    summary = d.get("Profile Summary", "")
    no_photo = not photo_path

    # Content-aware right-column allocation. The highlight grid always receives
    # all remaining height, so the page never ends with a large unused block.
    summary_len = len(summary)
    skill_count = len(skills)
    highlight_count = max(1, len(highlights))

    base_profile = 104
    profile_extra = min(42, max(0, (summary_len-150)/5.5))
    if no_photo:
        profile_extra += 8
    profile_h = min(154, base_profile + profile_extra)

    if skill_count <= 4:
        skills_h = 70
    elif skill_count <= 7:
        skills_h = 84
    else:
        skills_h = 98

    # Balance sparse and rich profiles. Sparse pages receive a larger profile and
    # skills area so the typography can breathe instead of leaving oversized,
    # mostly empty highlight cards. Rich pages protect more space for the grid.
    if highlight_count >= 5:
        profile_h = min(profile_h, 122)
        skills_h = min(skills_h, 88)
    elif highlight_count <= 2:
        profile_h = max(profile_h, 168 if summary_len < 260 else 154)
        skills_h = max(skills_h, 98)
    elif highlight_count == 3 and summary_len < 220:
        profile_h = max(profile_h, 145)
        skills_h = max(skills_h, 90)

    right_y = body_top
    draw_profile_box(c, d, right_x, right_y, right_w,
                     profile_h, theme, no_photo=no_photo)
    right_y -= profile_h+10

    draw_skill_chips(c, skills, right_x, right_y, right_w,
                     skills_h, theme)
    right_y -= skills_h+14

    section_label(c, "Selected Highlights", right_x, right_y-1, theme)
    grid_top = right_y-18
    grid_h = max(120, grid_top-body_bottom)
    draw_highlight_grid(c, highlights, right_x, body_bottom,
                        right_w, grid_h, theme)

    if photo_path:
        draw_photo_panel(c, d, theme, photo_path, signature_path,
                         left_x, body_top, left_w, body_bottom)
    else:
        draw_no_photo_identity_panel(c, d, theme, left_x,
                                     body_top, left_w,
                                     body_bottom, signature_path)

    page_footer(c, page_no)
    c.showPage()


# ---------------------------------------------------------------------------
# 10. CLOSING PAGE
# ---------------------------------------------------------------------------

def draw_closing(c):
    W, H = A4
    c.setFillColor(PAPER)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    primary = HexColor("#234A68")
    c.setFillColor(primary)
    c.setFont("YB-Bold", 27)
    c.drawCentredString(W/2, H*0.66, "Batch 2022-2026")

    c.setFont("YB-Bold", 13)
    c.drawCentredString(W/2, H*0.61, DEPARTMENT)

    c.setFillColor(INK)
    message = (
        "May the curiosity, resilience, technical skills and values developed during "
        "these years continue to guide every graduate toward meaningful innovation, "
        "professional excellence and service to society."
    )
    lines = wrap_text(message, "YB-Regular", 11, W-120, 6)
    y = H*0.52
    c.setFont("YB-Regular", 11)
    for ln in lines:
        c.drawCentredString(W/2, y, ln)
        y -= 17

    c.setFillColor(MUTED)
    c.setFont("YB-Regular", 9)
    c.drawCentredString(W/2, H*0.30, INSTITUTE)
    c.drawCentredString(W/2, H*0.27, DEFAULT_ADDRESS)
    c.drawCentredString(W/2, H*0.24, WEBSITES)

    c.showPage()



# ---------------------------------------------------------------------------
# 10B. PRINT-READY FRONT / BACK MATTER OVERRIDES
# ---------------------------------------------------------------------------

# Asset paths — look in <project>/data/assets/ relative to this script's location
_SCRIPT_DIR = Path(__file__).parent
_ASSETS = _SCRIPT_DIR / "data" / "assets"

def _resolve_asset(base_path: str) -> str:
    """Try multiple image extensions (.jpg, .jpeg, .png, .webp) for an asset path."""
    p = Path(base_path)
    if p.exists():
        return str(p)
    stem = p.stem
    parent = p.parent
    for ext in ['.jpg', '.jpeg', '.png', '.webp']:
        candidate = parent / (stem + ext)
        if candidate.exists():
            return str(candidate)
    return base_path  # return original even if not found

ASSET_LOGO          = _resolve_asset(str(_ASSETS / "IT Logo.jpg"))
ASSET_FACULTY       = _resolve_asset(str(_ASSETS / "12_IT_DEPARTMENT_Faculties_Staff.jpg"))
ASSET_CAMPUS        = _resolve_asset(str(_ASSETS / "Maharaja_Agrasen_Institute_of_Technology.jpg"))
ASSET_GROUP         = _resolve_asset(str(_ASSETS / "year book.jpg"))
ASSET_CAMPUS_SMALL  = _resolve_asset(str(_ASSETS / "back page.jpeg"))

# New front-matter page assets
ASSET_DEPT_PHOTO    = _resolve_asset(str(_ASSETS / "department_photo.jpg"))
ASSET_HOD_PHOTO     = _resolve_asset(str(_ASSETS / "hod_photo.jpg"))
# Editorial board member photos resolved dynamically in draw_editorial_board_page()

_PRINT_IMAGE_CACHE = {}

def _print_image(src, w_pt, h_pt, mode="cover", dpi=300):
    """Create a page-placement raster at approximately `dpi`.

    Source images are never stretched. In cover mode they are center-cropped;
    in contain mode they are fitted onto a white canvas. This keeps print
    placement predictable while text remains vector in the final PDF.
    """
    if not src or not Path(src).exists():
        return None
    key=(src, round(w_pt,2), round(h_pt,2), mode, dpi)
    if key in _PRINT_IMAGE_CACHE:
        return _PRINT_IMAGE_CACHE[key]
    px_w=max(8, int(round(w_pt/72*dpi)))
    px_h=max(8, int(round(h_pt/72*dpi)))
    im=Image.open(src).convert('RGB')
    if mode == 'contain':
        scale=min(px_w/im.width, px_h/im.height)
        nw=max(1,int(im.width*scale)); nh=max(1,int(im.height*scale))
        rim=im.resize((nw,nh), Image.LANCZOS)
        canvas_im=Image.new('RGB',(px_w,px_h),(255,255,255))
        canvas_im.paste(rim,((px_w-nw)//2,(px_h-nh)//2))
        outim=canvas_im
    else:
        target=px_w/px_h
        sr=im.width/im.height
        if sr>target:
            nw=int(im.height*target); left=(im.width-nw)//2
            im=im.crop((left,0,left+nw,im.height))
        else:
            nh=int(im.width/target); top=(im.height-nh)//2
            im=im.crop((0,top,im.width,top+nh))
        outim=im.resize((px_w,px_h),Image.LANCZOS)
    stem=safe_filename(Path(src).stem)
    p=os.path.join(tempfile.gettempdir(), f"_print_asset_{stem}_{px_w}x{px_h}_{mode}.jpg")
    outim.save(p,'JPEG',quality=95,optimize=True,subsampling=0,dpi=(dpi,dpi))
    _PRINT_IMAGE_CACHE[key]=p
    return p


def _draw_image(c, src, x, y, w, h, mode='cover', dpi=300):
    p=_print_image(src,w,h,mode=mode,dpi=dpi)
    if p:
        c.drawImage(ImageReader(p),x,y,width=w,height=h,mask='auto')
        return True
    return False


def _fit_single_line(c, txt, x, y, max_width, font='YB-Bold', max_size=26, min_size=13, color=INK):
    size=float(max_size)
    while size>min_size and stringWidth(txt,font,size)>max_width:
        size-=0.4
    c.setFillColor(color); c.setFont(font,size); c.drawString(x,y,txt)
    return size


def draw_cover(c):
    """Clean, text-only IT department cover with MAIT logo in top right."""
    W, H = A4
    navy = HexColor('#164773')
    red = HexColor('#E3262E')
    pale = HexColor('#F5F7F8')
    gold = HexColor('#C89B49')

    c.setFillColor(WHITE)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # ── Top navy band with logo in top-right ──
    header_h = 82
    c.setFillColor(navy)
    c.rect(0, H - header_h, W, header_h, fill=1, stroke=0)

    # MAIT logo in top right
    if Path(ASSET_CAMPUS).exists():
        campus_img = _print_image(ASSET_CAMPUS, 62, 62, mode='contain', dpi=300)
        c.drawImage(ImageReader(campus_img), W - 94, H - 72, width=62, height=62, mask='auto')

    c.setFillColor(WHITE)
    c.setFont('YB-Bold', 11)
    c.drawString(40, H - 38, INSTITUTE)
    c.setFont('YB-Regular', 8.5)
    c.drawString(40, H - 55, f'{LOCATION}  |  Affiliated to GGSIPU, Delhi')
    c.setFont('YB-Regular', 7.5)
    c.drawString(40, H - 70, DEFAULT_ADDRESS)

    # ── Red accent line ──
    c.setStrokeColor(red)
    c.setLineWidth(3)
    c.line(40, H - header_h - 8, W - 40, H - header_h - 8)

    # ── Central title composition ──
    cx = W / 2
    title_y = H * 0.58

    c.setFillColor(navy)
    c.setFont('YB-Bold', 16)
    c.drawCentredString(cx, title_y + 95, DEPARTMENT)

    # Decorative line
    c.setStrokeColor(gold)
    c.setLineWidth(1.5)
    c.line(cx - 80, title_y + 82, cx + 80, title_y + 82)

    c.setFillColor(navy)
    c.setFont('YB-Bold', 48)
    c.drawCentredString(cx, title_y + 30, 'YEARBOOK')

    c.setFillColor(red)
    c.setFont('YB-Bold', 36)
    c.drawCentredString(cx, title_y - 20, '2022 \u2013 2026')

    # Decorative line
    c.setStrokeColor(gold)
    c.setLineWidth(1.5)
    c.line(cx - 80, title_y - 35, cx + 80, title_y - 35)

    c.setFillColor(INK)
    c.setFont('YB-Bold', 14)
    c.drawCentredString(cx, title_y - 60, 'B.Tech \u2014 Information Technology')

    # ── Values tagline ──
    c.setFillColor(pale)
    c.rect(0, 140, W, 70, fill=1, stroke=0)
    c.setFillColor(navy)
    c.setFont('YB-Bold', 12)
    c.drawCentredString(cx, 182, 'LEARN  |  INNOVATE  |  BUILD  |  LEAD')
    c.setFillColor(MUTED)
    c.setFont('YB-Regular', 9)
    c.drawCentredString(cx, 160, 'A record of learning, projects, research, industry exposure and student journeys.')

    # ── Bottom navy band ──
    c.setFillColor(navy)
    c.rect(0, 0, W, 110, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont('YB-Bold', 10)
    c.drawCentredString(cx, 82, 'MAHARAJA AGRASEN INSTITUTE OF TECHNOLOGY')
    c.setFont('YB-Regular', 8.5)
    c.drawCentredString(cx, 62, 'PSP Area, Plot No. 1, Sector-22, Rohini, Delhi-110086')
    c.setFont('YB-Bold', 8.5)
    c.drawCentredString(cx, 42, WEBSITES)

    # Corner accents
    c.setStrokeColor(gold)
    c.setLineWidth(2)
    # Top-left
    c.line(20, H - header_h - 18, 20, H - header_h - 50)
    c.line(20, H - header_h - 18, 52, H - header_h - 18)
    # Top-right
    c.line(W - 20, H - header_h - 18, W - 20, H - header_h - 50)
    c.line(W - 20, H - header_h - 18, W - 52, H - header_h - 18)
    # Bottom-left
    c.line(20, 140, 20, 172)
    c.line(20, 140, 52, 140)
    # Bottom-right
    c.line(W - 20, 140, W - 20, 172)
    c.line(W - 20, 140, W - 52, 140)

    c.showPage()


def draw_department_page(c, institutional: Dict[str,str]):
    """Department identity page: real faculty/campus images and concise verified context."""
    W,H=A4; navy=HexColor('#164773'); red=HexColor('#E3262E'); soft=HexColor('#F3F7F9')
    c.setFillColor(WHITE); c.rect(0,0,W,H,fill=1,stroke=0)

    # Header with high-resolution department logo
    if Path(ASSET_LOGO).exists():
        logo=_print_image(ASSET_LOGO,62,62,mode='contain',dpi=300)
        c.drawImage(ImageReader(logo),34,H-84,width=62,height=62,mask='auto')
    _fit_single_line(c,DEPARTMENT,112,H-48,W-146,max_size=21,min_size=15,color=navy)
    c.setFillColor(INK); c.setFont('YB-Bold',9.8); c.drawString(112,H-70,INSTITUTE)
    c.setFillColor(red); c.setFont('YB-Bold',9.2); c.drawString(112,H-89,f'{LOCATION}  |  {BATCH}')

    # Faculty/staff image
    fx,fy,fw,fh=34,H-364,W-68,245
    rounded_box(c,fx,fy,fw,fh,fill=WHITE,stroke=LINE,radius=7,line_width=.7)
    _draw_image(c,ASSET_FACULTY,fx+4,fy+4,fw-8,fh-8,'cover',300)
    c.setFillColor(navy); c.rect(fx,fy,170,23,fill=1,stroke=0)
    c.setFillColor(WHITE); c.setFont('YB-Bold',8.4); c.drawString(fx+10,fy+7,'OUR FACULTY & STAFF')

    # Two smaller authentic campus/community images
    gap=10; small_w=(fw-gap)/2; small_h=117; sy=fy-small_h-12
    rounded_box(c,fx,sy,small_w,small_h,fill=WHITE,stroke=LINE,radius=6,line_width=.6)
    _draw_image(c,ASSET_GROUP,fx+3,sy+3,small_w-6,small_h-6,'cover',300)
    rounded_box(c,fx+small_w+gap,sy,small_w,small_h,fill=WHITE,stroke=LINE,radius=6,line_width=.6)
    _draw_image(c,ASSET_CAMPUS,fx+small_w+gap+3,sy+3,small_w-6,small_h-6,'cover',300)

    # About and focus: concise, larger typography.
    about_y=80; about_h=138
    rounded_box(c,34,about_y,W-68,about_h,fill=soft,stroke=soft,radius=10,line_width=0)
    c.setFillColor(navy); c.setFont('YB-Bold',11.5); c.drawString(50,about_y+about_h-28,'ABOUT THE DEPARTMENT')
    about=institutional.get('Department Overview',
        'The IT Department emphasizes practical learning, research-oriented teaching, modern computing infrastructure, innovation, internships and meaningful industry interaction.')
    # Keep this front-matter text crisp and readable for print.
    draw_fitted_text(c,about,50,about_y+about_h-49,W-100,66,font='YB-Bold',max_size=11,min_size=7.8,color=INK,max_lines=5,leading_ratio=1.25,fill_height=True)
    focus=institutional.get('Specializations','Artificial Intelligence & Machine Learning | Machine Learning & Data Analytics | Full Stack Development | Cybersecurity')
    c.setFillColor(red); c.setFont('YB-Bold',7.9); c.drawString(50,about_y+18,focus)
    page_footer(c)
    c.showPage()


def draw_department_vision_page(c, institutional: Dict[str,str]):
    """Dedicated Vision / Mission page so institutional text can stay large and bold."""
    W,H=A4; navy=HexColor('#164773'); red=HexColor('#E3262E'); soft=HexColor('#F3F7F9')
    c.setFillColor(WHITE); c.rect(0,0,W,H,fill=1,stroke=0)

    c.setFillColor(navy); c.setFont('YB-Bold',25); c.drawString(40,H-64,'Vision, Mission & Academic Focus')
    c.setFillColor(MUTED); c.setFont('YB-Bold',9.5); c.drawString(40,H-86,f'{DEPARTMENT} | {INSTITUTE}')
    c.setStrokeColor(red); c.setLineWidth(2); c.line(40,H-100,200,H-100)

    vision=institutional.get('Department Vision',DEFAULT_VISION)
    rounded_box(c,40,H-250,W-80,116,fill=soft,stroke=soft,radius=10,line_width=0)
    c.setFillColor(navy); c.setFont('YB-Bold',12.5); c.drawString(56,H-161,'DEPARTMENT VISION')
    draw_fitted_text(c,vision,56,H-190,W-112,58,font='YB-Bold',max_size=12.0,min_size=8.8,color=INK,max_lines=5,leading_ratio=1.28,fill_height=True)

    mission=[]
    for key in ['Department Mission M1','Department Mission M2','Department Mission M3','Department Mission M4']:
        if institutional.get(key): mission.append(institutional[key])
    mission=mission or DEFAULT_MISSION
    c.setFillColor(navy); c.setFont('YB-Bold',12.5); c.drawString(40,H-286,'DEPARTMENT MISSION')

    card_gap=10; card_w=(W-80-card_gap)/2; card_h=142
    positions=[(40,H-450),(40+card_w+card_gap,H-450),(40,H-602),(40+card_w+card_gap,H-602)]
    for i,(item,(x,y)) in enumerate(zip(mission[:4],positions),1):
        rounded_box(c,x,y,card_w,card_h,fill=WHITE,stroke=LINE,radius=9,line_width=.8)
        c.setFillColor(red if i in (1,3) else navy); c.circle(x+24,y+card_h-26,13,fill=1,stroke=0)
        c.setFillColor(WHITE); c.setFont('YB-Bold',8); c.drawCentredString(x+24,y+card_h-29,f'M{i}')
        fsize, leading, lines = fitted_text_layout(item,'YB-Bold',card_w-60,card_h-42,max_size=10.4,min_size=7.8,leading_ratio=1.25,max_lines=7)
        text_h=max(1,len(lines))*leading
        start_y=y+(card_h+text_h)/2-7
        c.setFillColor(INK); c.setFont('YB-Bold',fsize)
        yy=start_y
        for ln in lines:
            c.drawString(x+46,yy,ln); yy-=leading

    focus=institutional.get('Specializations','Artificial Intelligence & Machine Learning | Machine Learning & Data Analytics | Full Stack Development | Cybersecurity')
    rounded_box(c,40,78,W-80,100,fill=soft,stroke=soft,radius=10,line_width=0)
    c.setFillColor(navy); c.setFont('YB-Bold',11.5); c.drawString(56,148,'ACADEMIC FOCUS')
    draw_fitted_text(c,focus,56,123,W-112,44,font='YB-Bold',max_size=11,min_size=7.5,color=INK,max_lines=4,leading_ratio=1.25,fill_height=True)
    page_footer(c)
    c.showPage()


# ---------------------------------------------------------------------------
# 10C. NEW FRONT-MATTER PAGES (After Cover, Before Dept/Vision)
# ---------------------------------------------------------------------------

# Default content — user will replace with actual content later
_DEFAULT_ABOUT_DEPT = (
    "The Department of Information Technology at Maharaja Agrasen Institute of Technology, located at Sector 22, Rohini Delhi was formed to provide an outstanding research environment complemented by excellence in teaching. The Department offers B.Tech degree affiliated to Guru Gobind Singh Indraprastha University, Delhi. The Department has a comprehensive curriculum on topics related to all aspects of Computer Science and Engineering with an emphasis on practical learning. The Department has state-of-the-art infrastructure and computing equipment supported by high speed Ethernet and WiFi networks. Our faculty members aim at delivering top class education blending their rich research experience with classroom teaching. A number of conferences, symposia and workshops are organized by the faculty members which attracts more participation from students."
)

_DEFAULT_YEAR_EST = "2000"

_DEFAULT_SPECIALIZATIONS = [
    "Artificial Intelligence & Machine Learning",
    "Machine Learning & Data Analytics",
    "Full Stack Development",
    "Cybersecurity & Networking",
]

_DEFAULT_HOD_NAME = "Dr. Amita Goel"
_DEFAULT_HOD_DESIGNATION = "Head of Department, Information Technology"
_DEFAULT_HOD_MSG_PARA1 = (
    "Dear Students,\n\n"
    "It gives me immense pleasure to present this yearbook of the Batch 2022-2026. "
    "Over the past four years, you have grown not just as students but as individuals "
    "ready to make meaningful contributions to society. Your achievements in academics, "
    "research, hackathons, and co-curricular activities reflect the values of hard work, "
    "innovation, and resilience that this department stands for.\n\n"
    "As you step into the next phase of your journey, carry with you the knowledge, "
    "friendships, and experiences that MAIT has given you. The department will always "
    "be your home, and we look forward to seeing you achieve great heights.\n\n"
    "Warm regards"
)

_DEFAULT_HOD_MSG_PARA2 = (
    "Dear Reader,\n\n"
    "Since its inception in the year 2001, the Department of Information Technology "
    "has come a long way. We have progressed continuously and thrived to attain the "
    "goal envisioned in the Vision and Mission document. Department has an intake of "
    "180 students and well qualified faculty members. "
    "Students from all over the country are imparted quality education with a vision "
    "to serve the nation with high standards of professional and interpersonal skills.\n\n"
    "The department is committed to maintain the quality of education by way of university "
    "curriculum, internal and external competition, organizing hackathons, extra-curricular "
    "and co-curricular activities, industry visits, internships and industry-academia "
    "interactions. We have a strong mentor-mentee relation by way of which every student "
    "can share his grievances with their experienced faculty mentors. Regular parents-faculty "
    "interactions are organized for bi-directional communication. We have a strong feedback "
    "mechanism to enhance the quality of overall academic and curricular activities.\n\n"
    "Over the years the students of IT Department of MAIT have brought recognition to the "
    "department as well as to the institute by way of excellent placement, higher education, "
    "entrepreneurship and start-ups. The excellent placement record makes the IT department "
    "of MAIT a preferred destination for students."
)

_DEFAULT_EDITORIAL_BOARD = [
    {"name": "Mr Vibhor Sharma", "role": "Faculty Advisor", "photo": ""},
    {"name": "Krish Vishwakarma", "role": "Editor-in-Chief", "photo": ""},
    {"name": "Shubham Raj", "role": "Co-Editor", "photo": ""},
]


def draw_about_department_new_page(c, institutional: Dict[str, str]):
    """About Department page — fills the page with photo, about text, est. badge, and specializations."""
    W, H = A4
    navy = HexColor('#164773')
    red = HexColor('#E3262E')
    soft = HexColor('#F3F7F9')
    warm = HexColor('#FDF8F0')

    c.setFillColor(WHITE)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # ── Page title header ──
    c.setFillColor(navy)
    c.rect(0, H - 62, W, 62, fill=1, stroke=0)
    if Path(ASSET_LOGO).exists():
        logo = _print_image(ASSET_LOGO, 44, 44, mode='contain', dpi=300)
        c.drawImage(ImageReader(logo), W - 76, H - 53, width=44, height=44, mask='auto')
    c.setFillColor(WHITE)
    c.setFont('YB-Bold', 20)
    c.drawString(40, H - 42, 'About the Department')
    c.setFont('YB-Regular', 8.5)
    c.drawString(40, H - 56, f'{DEPARTMENT} | {INSTITUTE}')

    # ── Department group/campus photo (larger) ──
    photo_x = 34
    photo_y = H - 340
    photo_w = W - 68
    photo_h = 260
    rounded_box(c, photo_x, photo_y, photo_w, photo_h,
                fill=HexColor('#EEF2F5'), stroke=LINE, radius=10, line_width=0.7)

    if Path(ASSET_DEPT_PHOTO).exists():
        _draw_image(c, ASSET_DEPT_PHOTO, photo_x + 5, photo_y + 5,
                    photo_w - 10, photo_h - 10, 'cover', 300)
    else:
        c.setFillColor(HexColor('#C8D6DE'))
        c.setFont('YB-Bold', 14)
        c.drawCentredString(W / 2, photo_y + photo_h / 2 + 10, 'Department Photo')
        c.setFillColor(MUTED)
        c.setFont('YB-Regular', 8.5)
        c.drawCentredString(W / 2, photo_y + photo_h / 2 - 10,
                           'Place department_photo.jpg in data/assets/')

    # ── Year of Establishment badge ──
    est_year = institutional.get('Year of Establishment', _DEFAULT_YEAR_EST)
    badge_w = 180
    badge_h = 36
    badge_x = W / 2 - badge_w / 2
    badge_y = photo_y - badge_h - 12
    c.setFillColor(navy)
    c.roundRect(badge_x, badge_y, badge_w, badge_h, 6, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont('YB-Bold', 13)
    c.drawCentredString(W / 2, badge_y + 11, f'Established {est_year}')

    # ── About text (expanded to fill available space) ──
    about_y = badge_y - 14
    about_bottom = 150
    about_h = about_y - about_bottom
    rounded_box(c, 34, about_bottom, W - 68, about_h,
                fill=soft, stroke=soft, radius=10, line_width=0)
    c.setFillColor(navy)
    c.setFont('YB-Bold', 12)
    c.drawString(50, about_y - 22, 'ABOUT THE DEPARTMENT')

    about_text = institutional.get('Department Overview', _DEFAULT_ABOUT_DEPT)
    draw_fitted_text(c, about_text, 50, about_y - 44, W - 100, about_h - 56,
                     font='YB-Regular', max_size=13, min_size=8,
                     color=INK, max_lines=12, leading_ratio=1.45, fill_height=True)

    # ── Specializations bar at bottom ──
    spec_h = 56
    spec_y = 56
    rounded_box(c, 34, spec_y, W - 68, spec_h,
                fill=warm, stroke=warm, radius=10, line_width=0)
    c.setFillColor(navy)
    c.setFont('YB-Bold', 9)
    c.drawString(50, spec_y + spec_h - 18, 'AREAS OF SPECIALIZATION')

    spec_text = institutional.get('Specializations', '')
    if spec_text:
        specs = [s.strip() for s in spec_text.replace('|', ',').split(',') if s.strip()]
    else:
        specs = _DEFAULT_SPECIALIZATIONS

    chip_x = 50
    chip_y = spec_y + spec_h - 40
    chip_h = 20
    max_x = W - 50

    for spec in specs[:8]:
        font_size = 8.5
        tw = stringWidth(spec, 'YB-Bold', font_size) + 20
        if chip_x + tw > max_x:
            chip_x = 50
            chip_y -= chip_h + 6
        if chip_y - chip_h < spec_y + 4:
            break
        c.setFillColor(WHITE)
        c.roundRect(chip_x, chip_y - chip_h / 2, tw, chip_h, chip_h / 2,
                    fill=1, stroke=0)
        c.setFillColor(navy)
        c.setFont('YB-Bold', font_size)
        c.drawCentredString(chip_x + tw / 2, chip_y - font_size * 0.35, spec)
        chip_x += tw + 8

    page_footer(c)
    c.showPage()


def draw_hod_message_page(c, institutional: Dict[str, str]):
    """Message from HOD page with 2 distinct paragraphs filling the full page."""
    W, H = A4
    navy = HexColor('#164773')
    red = HexColor('#E3262E')
    soft = HexColor('#F3F7F9')
    gold_soft = HexColor('#FBF5E6')

    c.setFillColor(WHITE)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # ── Page title header ──
    c.setFillColor(navy)
    c.rect(0, H - 62, W, 62, fill=1, stroke=0)
    if Path(ASSET_LOGO).exists():
        logo = _print_image(ASSET_LOGO, 44, 44, mode='contain', dpi=300)
        c.drawImage(ImageReader(logo), W - 76, H - 53, width=44, height=44, mask='auto')
    c.setFillColor(WHITE)
    c.setFont('YB-Bold', 20)
    c.drawString(40, H - 42, 'Message from the HOD')
    c.setFont('YB-Regular', 8.5)
    c.drawString(40, H - 56, f'{DEPARTMENT} | {INSTITUTE}')

    # ── Layout: Photo + name on left, Paragraph 1 on right ──
    content_top = H - 82
    margin = 34

    # HOD Photo (left side)
    photo_w = 150
    photo_h = 190
    photo_x = margin
    photo_y = content_top - photo_h

    rounded_box(c, photo_x, photo_y, photo_w, photo_h,
                fill=HexColor('#EEF2F5'), stroke=LINE, radius=10, line_width=0.7)

    if Path(ASSET_HOD_PHOTO).exists():
        _draw_image(c, ASSET_HOD_PHOTO, photo_x + 6, photo_y + 6,
                    photo_w - 12, photo_h - 12, 'cover', 300)
    else:
        c.setFillColor(HexColor('#C8D6DE'))
        c.setFont('YB-Bold', 12)
        c.drawCentredString(photo_x + photo_w / 2, photo_y + photo_h / 2 + 10,
                           'HOD Photo')
        c.setFillColor(MUTED)
        c.setFont('YB-Regular', 7.5)
        c.drawCentredString(photo_x + photo_w / 2, photo_y + photo_h / 2 - 8,
                           'Place hod_photo.jpg')
        c.drawCentredString(photo_x + photo_w / 2, photo_y + photo_h / 2 - 20,
                           'in data/assets/')

    # Name and designation below photo
    hod_name = institutional.get('HOD Name', _DEFAULT_HOD_NAME)
    hod_desg = institutional.get('HOD Designation', _DEFAULT_HOD_DESIGNATION)

    name_box_y = photo_y - 48
    rounded_box(c, photo_x, name_box_y, photo_w, 40,
                fill=navy, stroke=navy, radius=8, line_width=0)
    c.setFillColor(WHITE)
    name_fs = 10.5
    while name_fs > 7 and stringWidth(hod_name, 'YB-Bold', name_fs) > photo_w - 20:
        name_fs -= 0.4
    c.setFont('YB-Bold', name_fs)
    c.drawCentredString(photo_x + photo_w / 2, name_box_y + 20, hod_name)
    desg_fs = 7
    while desg_fs > 5.5 and stringWidth(hod_desg, 'YB-Regular', desg_fs) > photo_w - 16:
        desg_fs -= 0.3
    c.setFont('YB-Regular', desg_fs)
    c.drawCentredString(photo_x + photo_w / 2, name_box_y + 7, hod_desg)

    # ── Paragraph 1 (right side box — personal yearbook message) ──
    msg_x = photo_x + photo_w + 14
    msg_w = W - margin - msg_x
    msg_top = content_top
    msg_h = photo_h + 48  # aligns with photo + name box

    rounded_box(c, msg_x, msg_top - msg_h, msg_w, msg_h,
                fill=gold_soft, stroke=gold_soft, radius=10, line_width=0)

    # Decorative open-quote
    c.setFillColor(HexColor('#D4C4A0'))
    c.setFont('YB-Bold', 42)
    c.drawString(msg_x + 8, msg_top - 36, '\u201C')

    para1 = institutional.get('HOD Message Para1', _DEFAULT_HOD_MSG_PARA1)
    para1_lines = [p.strip() for p in para1.split('\n') if p.strip()]
    para1_text = '  '.join(para1_lines)

    draw_fitted_text(c, para1_text, msg_x + 12, msg_top - 48, msg_w - 24, msg_h - 60,
                     font='YB-Regular', max_size=30, min_size=6.8,
                     color=INK, max_lines=20, leading_ratio=1.40, fill_height=False)

    # ── Paragraph 2 (full-width bottom area — formal department message) ──
    para2_top = name_box_y - 14
    para2_bottom = 56
    para2_h = para2_top - para2_bottom

    rounded_box(c, margin, para2_bottom, W - 2 * margin, para2_h,
                fill=soft, stroke=soft, radius=10, line_width=0)

    # Section label
    c.setFillColor(navy)
    c.setFont('YB-Bold', 10)
    c.drawString(margin + 16, para2_top - 20, 'FROM THE HOD\u2019S DESK')
    c.setStrokeColor(red)
    c.setLineWidth(1.5)
    c.line(margin + 16, para2_top - 26, margin + 140, para2_top - 26)

    para2 = institutional.get('HOD Message Para2', _DEFAULT_HOD_MSG_PARA2)
    para2_lines = [p.strip() for p in para2.split('\n') if p.strip()]
    para2_text = '  '.join(para2_lines)

    draw_fitted_text(c, para2_text, margin + 16, para2_top - 38,
                     W - 2 * margin - 32, para2_h - 52,
                     font='YB-Regular', max_size=30, min_size=6.5,
                     color=INK, max_lines=22, leading_ratio=1.38, fill_height=False)

    page_footer(c)
    c.showPage()


def draw_editorial_board_page(c, institutional: Dict[str, str]):
    """Editorial Board page with photo, name, and role for each member (4-6 members)."""
    W, H = A4
    navy = HexColor('#164773')
    red = HexColor('#E3262E')
    soft = HexColor('#F3F7F9')
    warm = HexColor('#FDF8F0')

    c.setFillColor(WHITE)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # ── Page title header ──
    c.setFillColor(navy)
    c.rect(0, H - 62, W, 62, fill=1, stroke=0)
    if Path(ASSET_LOGO).exists():
        logo = _print_image(ASSET_LOGO, 44, 44, mode='contain', dpi=300)
        c.drawImage(ImageReader(logo), 34, H - 53, width=44, height=44, mask='auto')
    c.setFillColor(WHITE)
    c.setFont('YB-Bold', 20)
    c.drawString(90, H - 42, 'Editorial Board')
    c.setFont('YB-Regular', 8.5)
    c.drawString(90, H - 56, f'Yearbook {BATCH}')

    # ── Subtitle ──
    c.setFillColor(navy)
    c.setFont('YB-Bold', 12)
    c.drawCentredString(W / 2, H - 94,
                       'The team behind this yearbook')
    c.setStrokeColor(red)
    c.setLineWidth(2)
    c.line(W / 2 - 50, H - 102, W / 2 + 50, H - 102)

    # ── Load editorial board members ──
    board = []
    # Try loading from institutional data first
    for i in range(1, 7):
        name = institutional.get(f'Editorial Member {i} Name', '')
        role = institutional.get(f'Editorial Member {i} Role', '')
        if name:
            board.append({
                'name': name,
                'role': role,
                'photo': _resolve_asset(str(_ASSETS / f'editorial_{i}.jpg')),
            })
    # Fall back to defaults if nothing configured
    if not board:
        board = _DEFAULT_EDITORIAL_BOARD
        for i, member in enumerate(board, 1):
            member['photo'] = _resolve_asset(str(_ASSETS / f'editorial_{i}.jpg'))

    n = len(board)

    # ── Grid layout: 2 or 3 columns ──
    margin = 34
    grid_top = H - 120
    grid_bottom = 94
    grid_h = grid_top - grid_bottom
    usable_w = W - 2 * margin
    gap = 14

    if n <= 3:
        cols = n
        rows_count = 1
    elif n <= 4:
        cols = 2
        rows_count = 2
    else:
        cols = 3
        rows_count = 2

    card_w = (usable_w - (cols - 1) * gap) / cols
    card_h = (grid_h - (rows_count - 1) * gap) / rows_count
    photo_card_h = card_h * 0.62
    info_h = card_h - photo_card_h

    for idx, member in enumerate(board[:6]):
        col = idx % cols
        row = idx // cols
        cx = margin + col * (card_w + gap)
        cy = grid_top - row * (card_h + gap) - card_h

        # ── Card background ──
        rounded_box(c, cx, cy, card_w, card_h,
                    fill=WHITE, stroke=LINE, radius=10, line_width=0.6)

        # ── Photo area ──
        photo_area_y = cy + info_h
        photo_pad = 8
        rounded_box(c, cx + photo_pad, photo_area_y + photo_pad,
                    card_w - 2 * photo_pad, photo_card_h - 2 * photo_pad,
                    fill=HexColor('#EEF2F5'), stroke=HexColor('#EEF2F5'),
                    radius=8, line_width=0)

        photo_path = member.get('photo', '')
        if photo_path and Path(photo_path).exists():
            _draw_image(c, photo_path,
                       cx + photo_pad + 3, photo_area_y + photo_pad + 3,
                       card_w - 2 * photo_pad - 6, photo_card_h - 2 * photo_pad - 6,
                       'cover', 300)
        else:
            # Placeholder initials circle
            center_x = cx + card_w / 2
            center_y = photo_area_y + photo_card_h / 2
            circle_r = min(card_w * 0.18, photo_card_h * 0.22)
            c.setFillColor(HexColor('#D8E3EA'))
            c.circle(center_x, center_y, circle_r, fill=1, stroke=0)
            c.setFillColor(navy)
            c.setFont('YB-Bold', circle_r * 0.75)
            mon = initials(member.get('name', 'M'))
            c.drawCentredString(center_x, center_y - circle_r * 0.28, mon)

        # ── Name and role info area ──
        # Name band
        name_band_h = info_h * 0.55
        c.setFillColor(navy)
        c.roundRect(cx, cy, card_w, name_band_h, 10, fill=1, stroke=0)
        # Mask the top corners to keep card clean (overlay rectangle)
        c.rect(cx, cy + name_band_h - 10, card_w, 10, fill=1, stroke=0)

        member_name = member.get('name', '')
        member_role = member.get('role', '')

        # Fit member name
        name_fs = 10
        while name_fs > 6.5 and stringWidth(member_name, 'YB-Bold', name_fs) > card_w - 16:
            name_fs -= 0.4
        c.setFillColor(WHITE)
        c.setFont('YB-Bold', name_fs)
        c.drawCentredString(cx + card_w / 2, cy + name_band_h - 16, member_name)

        # Role
        role_fs = 7.5
        while role_fs > 5.5 and stringWidth(member_role, 'YB-Bold', role_fs) > card_w - 16:
            role_fs -= 0.3
        c.setFillColor(HexColor('#E4ECF0'))
        c.setFont('YB-Bold', role_fs)
        c.drawCentredString(cx + card_w / 2, cy + 10, member_role)

    # ── Footer acknowledgment ──
    c.setFillColor(MUTED)
    c.setFont('YB-Regular', 8)
    c.drawCentredString(W / 2, 72,
                       f'{DEPARTMENT} | {INSTITUTE} | Yearbook {BATCH}')

    page_footer(c)
    c.showPage()


def draw_closing(c):
    """Print-ready back/closing page using an authentic campus image."""
    W,H=A4; navy=HexColor('#164773'); red=HexColor('#E3262E')
    c.setFillColor(WHITE); c.rect(0,0,W,H,fill=1,stroke=0)
    # Campus image occupies more than half the page, but with a white safe border.
    img_x=32; img_y=274; img_w=W-64; img_h=360
    rounded_box(c,img_x,img_y,img_w,img_h,fill=WHITE,stroke=LINE,radius=8,line_width=.7)
    _draw_image(c,ASSET_CAMPUS,img_x+5,img_y+5,img_w-10,img_h-10,'cover',300)

    if Path(ASSET_LOGO).exists():
        logo=_print_image(ASSET_LOGO,76,76,mode='contain',dpi=300)
        c.drawImage(ImageReader(logo),40,H-110,width=76,height=76,mask='auto')
    c.setFillColor(navy); c.setFont('YB-Bold',24); c.drawString(132,H-72,'Batch 2022-2026')
    c.setFont('YB-Bold',12); c.drawString(132,H-95,DEPARTMENT)

    message=('May the curiosity, resilience, technical skills and values developed during these years continue to guide every graduate toward meaningful innovation, professional excellence and service to society.')
    rounded_box(c,40,108,W-80,118,fill=HexColor('#F4F7F8'),stroke=HexColor('#F4F7F8'),radius=10,line_width=0)
    draw_fitted_text(c,message,56,198,W-112,76,font='YB-Bold',max_size=10.8,min_size=8.5,color=INK,max_lines=5,leading_ratio=1.30,align='center')

    c.setFillColor(navy); c.rect(0,0,W,76,fill=1,stroke=0)
    c.setFillColor(WHITE); c.setFont('YB-Bold',9.2); c.drawCentredString(W/2,48,INSTITUTE)
    c.setFont('YB-Regular',7.8); c.drawCentredString(W/2,31,DEFAULT_ADDRESS)
    c.setFont('YB-Bold',8.2); c.drawCentredString(W/2,15,WEBSITES)
    c.showPage()


# ---------------------------------------------------------------------------
# 11. MAIN YEARBOOK BUILD
# ---------------------------------------------------------------------------

def build_yearbook(args):
    _, headers, rows, institutional, readiness = load_yearbook_data(args.master)

    photo_map = load_path_map(args.photo_map)
    signature_map = load_path_map(args.signature_map)

    # Default photo directory to <project>/data/photos if not specified
    if not args.photo_dir:
        default_photo_dir = str(_SCRIPT_DIR / "data" / "photos")
        if Path(default_photo_dir).exists():
            args.photo_dir = default_photo_dir

    # Optional filter for preview / selected students.
    only = []
    if args.only:
        only = [norm_name(x) for x in args.only.split(",") if x.strip()]

    selected = []
    seen_rolls = set()
    for raw_row in rows:
        d = row_dict(headers, raw_row)
        if not d or not d.get("Student Name"):
            continue
        # Deduplicate by enrollment number
        roll = d.get("Roll No.", "").strip()
        dedup_key = roll or d.get("Student Name", "")
        if dedup_key in seen_rolls:
            continue
        seen_rolls.add(dedup_key)
        if only and norm_name(d.get("Student Name", "")) not in only:
            continue
        selected.append(d)

    # Sort by group then roll number (mirrors TypeScript sort)
    group_order = ["8I1", "8I2", "8I3", "8I4", "8I5", "8I6", "8I7"]
    def sort_key(d):
        g = d.get("Group", "").strip().upper()
        gi = group_order.index(g) if g in group_order else 999
        return (gi, d.get("Roll No.", ""))
    selected.sort(key=sort_key)

    if args.limit and args.limit > 0:
        selected = selected[:args.limit]

    c = canvas.Canvas(args.out, pagesize=A4, pageCompression=1)
    c.setTitle(f"{DEPARTMENT} Yearbook {BATCH}")
    c.setAuthor(f"{DEPARTMENT}, {INSTITUTE}")
    c.setSubject(f"B.Tech Information Technology Yearbook, Batch 2022-2026")
    c.setKeywords("MAIT, Information Technology, Yearbook, B.Tech, 2022-2026")

    # Print-ready front matter
    if not args.students_only:
        c.bookmarkPage("cover"); c.addOutlineEntry("Cover", "cover", level=0, closed=False)
        draw_cover(c)

        # New front-matter pages (after cover, before department/vision)
        c.bookmarkPage("about_dept"); c.addOutlineEntry("About Department", "about_dept", level=0, closed=False)
        draw_about_department_new_page(c, institutional)
        c.bookmarkPage("hod_message"); c.addOutlineEntry("Message from HOD", "hod_message", level=0, closed=False)
        draw_hod_message_page(c, institutional)
        c.bookmarkPage("editorial_board"); c.addOutlineEntry("Editorial Board", "editorial_board", level=0, closed=False)
        draw_editorial_board_page(c, institutional)

        c.bookmarkPage("vision_mission"); c.addOutlineEntry("Vision & Mission", "vision_mission", level=0, closed=False)
        draw_department_vision_page(c, institutional)

    page_no = 1
    for d in selected:
        name = d.get("Student Name", "")
        roll = d.get("Roll No.", "")

        photo_path = resolve_image(
            name=name,
            roll=roll,
            direct_value=d.get("Photograph Link", ""),
            directory=args.photo_dir,
            mapping=photo_map,
        )

        signature_path = resolve_image(
            name=name,
            roll=roll,
            direct_value=d.get("Signature / Name Mark", ""),
            directory=args.signature_dir,
            mapping=signature_map,
        )

        key=f"student_{page_no:03d}_{safe_filename(name)}"
        c.bookmarkPage(key)
        outline_level = 0 if args.students_only else 1
        c.addOutlineEntry(f"{page_no:03d} - {name}", key, level=outline_level, closed=True)
        draw_student_page(
            c, d, photo_path=photo_path,
            signature_path=signature_path,
            page_no=page_no
        )
        page_no += 1

    if not args.students_only:
        pass # Removed closing page

    c.save()
    print(f"Created: {args.out}")
    print(f"Student pages: {len(selected)}")
    print("Layout automatically handled photo / no-photo cases.")


def build_arg_parser():
    p = argparse.ArgumentParser(
        description="Generate the complete MAIT IT B.Tech 2022-2026 yearbook."
    )
    p.add_argument(
        "--master", default="sheets",
        help=(
            "Data source. Use 'sheets' (default) to fetch live from Google Sheets, "
            "or a path to an .xlsx / .json file for offline generation."
        ),
    )
    p.add_argument("--out", required=True,
                   help="Output PDF path.")

    p.add_argument("--photo-dir", default="",
                   help="Directory containing student photos (default: data/photos/)")
    p.add_argument("--photo-map", default="",
                   help="Optional CSV: Student Name, Photo Path.")

    p.add_argument("--signature-dir", default="",
                   help="Optional directory containing signature images.")
    p.add_argument("--signature-map", default="",
                   help="Optional CSV: Student Name, Signature Path.")

    p.add_argument("--only", default="",
                   help='Comma-separated student names for preview, e.g. '
                        '"Manya Mangla,DEVVRATH GIRI".')
    p.add_argument("--limit", type=int, default=0,
                   help="Generate only first N selected students.")
    p.add_argument("--students-only", action="store_true",
                   help="Skip cover/front matter/closing and generate student pages only.")
    return p


if __name__ == "__main__":
    parser = build_arg_parser()
    build_yearbook(parser.parse_args())
