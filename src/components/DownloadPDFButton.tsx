"use client";

import { useState, useCallback, useEffect } from "react";
import { Download, X, FileText, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Student } from "@/types/student";

type Phase = "idle" | "loading" | "generating" | "done" | "error";

interface Props {
  students?: Student[];
  variant?: "navbar" | "mobile-nav" | "hero" | "default";
}

export default function DownloadPDFButton({ students, variant = "default" }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState({ current: 0, total: 0, message: "" });
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false); // controls entrance animation

  // Lock body scroll when modal is open
  useEffect(() => {
    const isOpen = phase !== "idle";
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // slight delay for animation
      const t = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
      const t = setTimeout(() => {
        document.body.style.overflow = "";
      }, 300);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const handleDownload = useCallback(async () => {
    setPhase("loading");
    setError("");
    setProgress({ current: 0, total: 0, message: "Fetching student directory…" });

    try {
      let studentsData = students;
      if (!studentsData) {
        const res = await fetch("/api/students");
        if (!res.ok) throw new Error(`Failed to fetch student data: ${res.statusText}`);
        const json = await res.json();
        studentsData = json.data;
      }

      if (!studentsData || studentsData.length === 0) {
        throw new Error("No student profiles found to export.");
      }

      setProgress({ current: 0, total: studentsData.length, message: "Loading PDF engine…" });

      const { generateDirectoryPDF } = await import("@/services/pdfGenerator");

      setPhase("generating");

      const blob = await generateDirectoryPDF(studentsData, (current, total, message) => {
        setProgress({ current, total, message });
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "IT_Connect_Student_Directory_2022-2026.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setPhase("done");
      setTimeout(() => setPhase("idle"), 4000);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setError(err instanceof Error ? err.message : "Failed to generate PDF");
      setPhase("error");
    }
  }, [students]);

  const dismiss = useCallback(() => {
    setPhase("idle");
    setError("");
  }, []);

  const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  const isModalOpen = phase !== "idle";

  /* ─── Button variants ─────────────────────────────────────────────── */
  const baseDisabled = "disabled:opacity-60 disabled:cursor-not-allowed";

  const renderButton = () => {
    if (variant === "navbar") {
      return (
        <button
          onClick={handleDownload}
          disabled={phase !== "idle"}
          className={`hidden md:inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-full transition-all duration-200 hover:scale-[1.02] ${baseDisabled}`}
          style={{ fontFamily: "var(--font-sans)", background: "#2d6060", border: "1.5px solid #2d6060" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#e8a830"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#2d6060"; }}
        >
          <Download size={14} />
          Download PDF
        </button>
      );
    }

    if (variant === "mobile-nav") {
      return (
        <button
          onClick={handleDownload}
          disabled={phase !== "idle"}
          className={`flex items-center justify-center gap-2 w-full py-3 rounded-full text-sm font-semibold text-white shadow-md ${baseDisabled}`}
          style={{ background: "#2d6060", fontFamily: "var(--font-sans)" }}
        >
          <Download size={15} />
          Download PDF
        </button>
      );
    }

    if (variant === "hero") {
      return (
        <button
          onClick={handleDownload}
          disabled={phase !== "idle"}
          className={`inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-semibold text-white transition-all duration-200 ${baseDisabled}`}
          style={{ fontFamily: "var(--font-sans)", background: "#2d6060", border: "2px solid #2d6060" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#e8a830"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#2d6060"; }}
        >
          <Download size={16} />
          Download PDF
        </button>
      );
    }

    return (
      <button
        onClick={handleDownload}
        disabled={phase !== "idle"}
        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 hover:scale-[1.02] ${baseDisabled}`}
        style={{ fontFamily: "var(--font-sans)", background: "rgba(45,96,96,0.08)", border: "1.5px solid rgba(45,96,96,0.25)", color: "#2d6060" }}
        title="Download full student directory as PDF"
      >
        <Download size={15} />
        Download PDF
      </button>
    );
  };

  /* ─── Modal title & subtitle helpers ─────────────────────────────── */
  const modalTitle =
    phase === "loading" ? "Preparing…"
    : phase === "generating" ? "Generating PDF"
    : phase === "done" ? "Download Complete!"
    : "Generation Failed";

  const modalSubtitle =
    phase === "loading" ? progress.message || "Loading PDF engine…"
    : phase === "generating" ? progress.message || "Processing profiles…"
    : phase === "done" ? "Your yearbook PDF has been saved."
    : error;

  const iconBg =
    phase === "error" ? "rgba(220,50,50,0.10)"
    : phase === "done" ? "rgba(76,175,80,0.10)"
    : "rgba(45,96,96,0.08)";

  const iconColor =
    phase === "error" ? "#dc3232"
    : phase === "done" ? "#4caf50"
    : "#2d6060";

  const ModalIcon =
    phase === "error" ? AlertTriangle
    : phase === "done" ? CheckCircle2
    : FileText;

  return (
    <>
      {renderButton()}

      {/* ─── Modal overlay ──────────────────────────────────────────── */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="PDF Download Progress"
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
          style={{
            background: visible ? "rgba(15,30,30,0.55)" : "rgba(15,30,30,0)",
            backdropFilter: visible ? "blur(6px)" : "blur(0px)",
            WebkitBackdropFilter: visible ? "blur(6px)" : "blur(0px)",
            transition: "background 0.3s ease, backdrop-filter 0.3s ease",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && (phase === "done" || phase === "error")) dismiss();
          }}
        >
          {/* Card — bottom-sheet on mobile, centered on sm+ */}
          <div
            className="relative w-full sm:max-w-md sm:mx-4 overflow-hidden"
            style={{
              background: "#faf8f3",
              border: "2px solid #e8a830",
              borderRadius: "20px 20px 0 0",
              boxShadow: "0 -8px 40px rgba(45,96,96,0.18), 0 4px 16px rgba(0,0,0,0.10)",
              transform: visible ? "translateY(0)" : "translateY(40px)",
              transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            // On sm+, use centered card style
            // We rely on the parent flex alignment to handle sm centering
          >
            {/* Sm+ override — rounded all sides */}
            <style>{`
              @media (min-width: 640px) {
                .pdf-modal-card {
                  border-radius: 20px !important;
                  transform: ${visible ? "translateY(0) scale(1)" : "translateY(0) scale(0.96)"} !important;
                  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
                }
              }
            `}</style>

            {/* Drag handle (mobile) */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div style={{ width: "40px", height: "4px", borderRadius: "999px", background: "rgba(45,96,96,0.18)" }} />
            </div>

            {/* Gold top accent bar */}
            <div style={{ height: "4px", background: "linear-gradient(90deg, #e8a830 0%, #2d6060 50%, #e8a830 100%)" }} />

            <div className="px-6 py-6 sm:px-8 sm:py-7">
              {/* Header row */}
              <div className="flex items-start justify-between mb-5 gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Icon */}
                  <div
                    className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl"
                    style={{ background: iconBg, color: iconColor }}
                  >
                    {phase === "loading" || phase === "generating"
                      ? <Loader2 size={20} className="animate-spin" />
                      : <ModalIcon size={20} />
                    }
                  </div>

                  {/* Title + subtitle */}
                  <div className="min-w-0">
                    <p
                      className="font-bold text-base leading-tight truncate"
                      style={{ fontFamily: "var(--font-display)", color: "#1a1a1a" }}
                    >
                      {modalTitle}
                    </p>
                    <p
                      className="text-xs mt-0.5 leading-snug"
                      style={{ fontFamily: "var(--font-sans)", color: "#6b5e4e", wordBreak: "break-word" }}
                    >
                      {modalSubtitle}
                    </p>
                  </div>
                </div>

                {/* Close button — only after completion */}
                {(phase === "done" || phase === "error") && (
                  <button
                    onClick={dismiss}
                    aria-label="Close"
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                    style={{ background: "rgba(45,96,96,0.07)", color: "#6b5e4e" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(45,96,96,0.13)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(45,96,96,0.07)"; }}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* ── Progress bar (loading + generating) ── */}
              {(phase === "loading" || phase === "generating") && (
                <div className="space-y-2.5">
                  {/* Track */}
                  <div
                    className="w-full overflow-hidden"
                    style={{ height: "8px", background: "#e8e4d8", borderRadius: "999px" }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: phase === "loading" ? "12%" : `${Math.max(percent, 4)}%`,
                        background: "linear-gradient(90deg, #2d6060, #e8a830)",
                        borderRadius: "999px",
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>

                  {/* Labels row */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-xs"
                      style={{ fontFamily: "var(--font-sans)", color: "#6b5e4e" }}
                    >
                      {phase === "loading"
                        ? "Initializing engine…"
                        : `${progress.current} / ${progress.total} profiles`}
                    </span>
                    {phase === "generating" && progress.total > 0 && (
                      <span
                        className="text-xs font-bold tabular-nums"
                        style={{ fontFamily: "var(--font-sans)", color: "#2d6060" }}
                      >
                        {percent}%
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ── Done state ── */}
              {phase === "done" && (
                <div
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
                  style={{ background: "rgba(76,175,80,0.07)", border: "1px solid rgba(76,175,80,0.25)" }}
                >
                  <CheckCircle2 size={16} style={{ color: "#4caf50", flexShrink: 0 }} />
                  <span
                    className="text-sm"
                    style={{ fontFamily: "var(--font-sans)", color: "#2d6060" }}
                  >
                    {progress.total} student profiles saved to PDF
                  </span>
                </div>
              )}

              {/* ── Error state ── */}
              {phase === "error" && (
                <div className="flex gap-3 mt-1">
                  <button
                    onClick={handleDownload}
                    className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ fontFamily: "var(--font-sans)", background: "#2d6060" }}
                  >
                    Retry
                  </button>
                  <button
                    onClick={dismiss}
                    className="flex-1 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
                    style={{ fontFamily: "var(--font-sans)", background: "rgba(45,96,96,0.09)", color: "#2d6060", border: "1px solid rgba(45,96,96,0.22)" }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
