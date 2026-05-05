import Link from "next/link";

export default function Footer() {
  const QUICK_LINKS = [
    { href: "/", label: "Home" },
    { href: "/directory", label: "Student Directory" },
  ];

  return (
    <footer className="footer-backcove relative overflow-hidden" style={{ background: "#2d6060", borderTop: "2px solid #e8a830" }}>
      <style>{`
        .footer-link {
          font-family: var(--font-sans);
          font-size: 0.875rem;
          color: rgba(255,255,255,0.70);
          text-decoration: none;
          transition: color 0.15s;
        }
        .footer-link:hover { color: #e8a830; }
        
        .contributor-name {
          color: #e8a830;
          font-weight: 600;
          letter-spacing: 0.02em;
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-6 py-12 text-center">

        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-1 mb-3 decoration-transparent">
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "2rem", color: "#fff", letterSpacing: "-0.02em" }}>IT</span>
          <span style={{ fontFamily: "var(--font-sans)", fontWeight: 400, fontSize: "1.6rem", color: "rgba(255,255,255,0.85)" }}>Connect</span>
        </Link>

        {/* Tagline */}
        <p className="mb-8 max-w-xs mx-auto" style={{ fontFamily: "var(--font-sans)", fontWeight: 300, fontSize: "0.95rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.7 }}>
          The digital yearbook for IT Department students and alumni.
        </p>

        {/* Quick links */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mb-10">
          {QUICK_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className="footer-link">
              {label}
            </Link>
          ))}
        </div>

        {/* Gold micro rule */}
        <div className="mb-8 mx-auto w-16" style={{ height: "2px", background: "rgba(232,168,48,0.50)", borderRadius: "2px" }} />

        {/* Contribution Highlight */}
        <div className="mb-6 flex flex-col items-center justify-center gap-2">
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.95rem", color: "rgba(255,255,255,0.8)" }}>
            Contributed by{" "}
            <a href="https://www.linkedin.com/in/krish-vishwakarma-46481527a/" target="_blank" rel="noopener noreferrer" className="contributor-name">
              Krish Vishwakarma
            </a>{" "}
            &amp;{" "}
            <a href="https://www.linkedin.com/in/shubham-raj-62755628b/" target="_blank" rel="noopener noreferrer" className="contributor-name">
              Shubham Raj
            </a>
          </p>
        </div>

        {/* Caveat tagline */}
        <p className="mb-4 mt-2" style={{ fontFamily: "var(--font-script)", fontSize: "1.3rem", color: "rgba(255,255,255,0.60)" }}>
          Built with ♥ for the IT community
        </p>

        <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em" }}>
          © {new Date().getFullYear()} IT Department. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
