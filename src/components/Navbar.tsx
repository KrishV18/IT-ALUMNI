"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Home, Users, Menu, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import DownloadPDFButton from "@/components/DownloadPDFButton";

const NAV_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/directory", label: "Directory", icon: Users },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  // Close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Scroll: detect position + direction for smart hide
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 80);
      if (y > 120) {
        setHidden(y > lastY.current);
      } else {
        setHidden(false);
      }
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Escape key closes drawer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: hidden ? -80 : 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center"
        style={{
          height: "60px",
          background: scrolled
            ? "rgba(250, 248, 243, 0.92)"
            : "rgba(250, 248, 243, 0.98)",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: "2px solid #e8a830",
          boxShadow: scrolled
            ? "0 2px 16px rgba(45, 96, 96, 0.10)"
            : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 decoration-transparent group" aria-label="IT Connect Home">
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: "1.35rem",
                color: "#2d6060",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              IT
            </span>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 400,
                fontSize: "1.1rem",
                color: "#1a1a1a",
                letterSpacing: "0.01em",
                lineHeight: 1,
              }}
            >
              Connect
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className="relative px-4 py-1.5 text-sm overflow-hidden group"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontWeight: 400,
                    color: isActive ? "#2d6060" : "#6b5e4e",
                    textDecoration: "none",
                  }}
                >
                  {label}
                  {/* Teal underline slides in from left */}
                  <span
                    className="absolute bottom-0 left-0 h-0.5 transition-all duration-200"
                    style={{
                      background: "#2d6060",
                      width: isActive ? "100%" : "0%",
                      transformOrigin: "left",
                    }}
                  />
                  {!isActive && (
                    <span
                      className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-200"
                      style={{ background: "#2d6060", transformOrigin: "left" }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* CTA + Hamburger */}
          <div className="flex items-center gap-3">
            {/* Desktop CTA */}
            <DownloadPDFButton variant="navbar" />

            {/* Hamburger — mobile only */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
              style={{
                background: "rgba(45,96,96,0.08)",
                color: "#2d6060",
              }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={mobileOpen ? "close" : "open"}
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.15 }}
                >
                  {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Spacer to prevent content jumping under fixed nav */}
      <div style={{ height: "60px" }} aria-hidden="true" />

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 md:hidden"
              style={{ background: "rgba(45,96,96,0.15)", backdropFilter: "blur(4px)" }}
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer panel */}
            <motion.div
              key="drawer"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="fixed top-[60px] left-0 right-0 z-40 md:hidden"
              style={{
                background: "rgba(250,248,243,0.98)",
                borderBottom: "2px solid #e8a830",
                boxShadow: "0 8px 24px rgba(45,96,96,0.12)",
              }}
            >
              <div className="px-6 py-4 flex flex-col gap-1">
                {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        background: isActive ? "rgba(45,96,96,0.08)" : "transparent",
                        color: isActive ? "#2d6060" : "#6b5e4e",
                        border: isActive ? "1px solid rgba(45,96,96,0.15)" : "1px solid transparent",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      <Icon size={16} />
                      {label}
                    </Link>
                  );
                })}

                <div className="my-2" style={{ borderTop: "1px dashed rgba(45,96,96,0.2)" }} />

                <DownloadPDFButton variant="mobile-nav" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
