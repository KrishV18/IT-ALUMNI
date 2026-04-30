"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Home, Users, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

const NAV_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/directory", label: "Directory", icon: Users },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Scroll-aware border
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Escape key closes mobile menu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`sticky top-0 z-50 h-16 flex items-center transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl border-b border-black/5 shadow-sm"
            : "bg-white/60 backdrop-blur-md border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 decoration-transparent group" aria-label="IT Connect Home">
            <motion.div
              whileHover={{ rotate: 12, scale: 1.1 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/20"
            >
              <Zap size={18} className="fill-current" />
            </motion.div>
            <span className="font-bold text-lg text-foreground tracking-tight font-serif">
              IT<span className="text-primary font-serif">Connect</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1 relative">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-black/5 rounded-lg"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon size={15} className="relative z-10" />
                  <span className="relative z-10">{label}</span>
                </Link>
              );
            })}
          </div>

          {/* Desktop CTA + Mobile Hamburger */}
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="hidden md:block"
            >
              <Link
                href="/directory"
                className="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              >
                Explore Students
              </Link>
            </motion.div>

            {/* Hamburger — mobile only */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-black/5 hover:bg-black/10 text-foreground transition-colors"
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
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer panel */}
            <motion.div
              key="drawer"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="fixed top-16 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-xl border-b border-black/5 shadow-2xl"
            >
              <div className="px-6 py-4 flex flex-col gap-1">
                {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-black/5"
                      }`}
                    >
                      <Icon size={16} />
                      {label}
                    </Link>
                  );
                })}

                <div className="pt-2 border-t border-black/5 mt-2">
                  <Link
                    href="/directory"
                    className="flex items-center justify-center gap-2 w-full bg-primary text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-md"
                  >
                    <Zap size={15} className="fill-current" />
                    Explore Students
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
