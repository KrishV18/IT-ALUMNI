import Link from "next/link";

export default function Footer() {
  const TECH_BADGES = ["Next.js 16", "Tailwind CSS v4", "Google Sheets API"];
  const QUICK_LINKS = [
    { href: "/", label: "Home" },
    { href: "/directory", label: "Student Directory" },
    { href: "/directory?spec=AIML", label: "AIML Students" },
    { href: "/directory?spec=FSD", label: "FSD Students" },
  ];

  return (
    <footer className="footer-backcove relative overflow-hidden" style={{ background: "#2d6060", borderTop: "2px solid #e8a830" }}>
      <style>{`
        .footer-link {
          font-family: var(--font-sans);
          font-size: 0.875rem;
          color: rgba(255,255,255,0.60);
          text-decoration: none;
          transition: color 0.15s;
        }
        .footer-link:hover { color: #e8a830; }
      `}</style>

      <div className="max-w-5xl mx-auto px-6 py-14 text-center">

        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-1 mb-3 decoration-transparent">
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "2rem", color: "#fff", letterSpacing: "-0.02em" }}>IT</span>
          <span style={{ fontFamily: "var(--font-sans)", fontWeight: 400, fontSize: "1.6rem", color: "rgba(255,255,255,0.85)" }}>Connect</span>
        </Link>

        {/* Tagline */}
        <p className="mb-8 max-w-xs mx-auto" style={{ fontFamily: "var(--font-sans)", fontWeight: 300, fontSize: "0.95rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.7 }}>
          The digital yearbook for IT Department students and alumni.
        </p>

        {/* Tech colophon stamps */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {TECH_BADGES.map((badge) => (
            <span
              key={badge}
              className="px-3 py-1.5"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "0.6rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                background: "#fff9e0",
                color: "#2d6060",
                border: "1.5px solid rgba(232,168,48,0.60)",
                borderRadius: "3px",
              }}
            >
              {badge}
            </span>
          ))}
        </div>

        {/* Quick links */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-10">
          {QUICK_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className="footer-link">
              {label}
            </Link>
          ))}
        </div>

        {/* Gold micro rule */}
        <div className="mb-8 mx-auto w-32" style={{ height: "1px", background: "rgba(232,168,48,0.40)" }} />

        {/* Caveat tagline — only handwritten text in footer */}
        <p className="mb-4" style={{ fontFamily: "var(--font-script)", fontSize: "1.4rem", color: "rgba(255,255,255,0.80)" }}>
          Built with ♥ for the IT community
        </p>

        <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em" }}>
          © {new Date().getFullYear()} IT Department. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
