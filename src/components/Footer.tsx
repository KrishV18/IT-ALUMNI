import Link from "next/link";
import { Zap, Heart, ExternalLink } from "lucide-react";

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
);

export default function Footer() {
  return (
    <footer
      className="relative overflow-hidden"
      style={{ background: "#f0ece2" }}
    >
      {/* Gold micro-rule at very top */}
      <div className="gold-rule" />

      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* Top row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10 border-b border-[rgba(60,50,30,0.10)]">

          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2.5 w-fit group">
              <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center text-white shadow-md shadow-primary/20 ring-1 ring-[#c9973a]/25 group-hover:scale-105 transition-all duration-300">
                <Zap size={16} className="fill-current" />
              </div>
              <span className="font-bold text-foreground">
                <span className="font-serif text-lg">IT</span>
                <span className="font-script text-primary" style={{ fontSize: "1.15rem" }}>Connect</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs font-serif italic">
              The premium networking directory for IT students and alumni. Connect, discover, and excel together.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
              <span className="font-serif italic text-xs">Live data · Updates every 60s</span>
            </div>
          </div>

          {/* Quick links */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground mb-1">
              Quick Links
            </p>
            {[
              { href: "/", label: "Home" },
              { href: "/directory", label: "Student Directory" },
              { href: "/directory?spec=AIML", label: "AIML Students" },
              { href: "/directory?spec=FSD", label: "FSD Students" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 w-fit"
              >
                <span className="w-0 group-hover:w-3 h-px bg-primary transition-all duration-300 overflow-hidden" />
                {label}
              </Link>
            ))}
          </div>

          {/* Platform info */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground mb-1">
              Platform
            </p>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              {[
                "Built with Next.js 16",
                "Data via Google Sheets API",
                "Tailwind CSS v4",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <ExternalLink size={13} className="text-primary/60 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="w-8 h-8 rounded-md bg-[rgba(60,50,30,0.08)] hover:bg-[rgba(60,50,30,0.15)] flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200 border border-[rgba(60,50,30,0.10)]"
              >
                <GithubIcon width={15} height={15} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-8 h-8 rounded-md bg-[rgba(60,50,30,0.08)] hover:bg-[rgba(60,50,30,0.15)] flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200 border border-[rgba(60,50,30,0.10)]"
              >
                <LinkedinIcon width={15} height={15} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-serif italic">
            Built with <Heart size={11} className="text-rose-500 fill-current mx-0.5" /> for the{" "}
            <span className="font-script text-primary" style={{ fontSize: "0.9rem" }}>IT community</span>
          </div>
          <p className="font-serif text-[11px] tracking-wide">
            © {new Date().getFullYear()} IT Department. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
