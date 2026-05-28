"use client";

import { useState, useCallback } from "react";
import { Download, X, FileText, Loader2, CheckCircle2 } from "lucide-react";
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

  const handleDownload = useCallback(async () => {
    setPhase("loading");
    setError("");

    try {
      // If students list is not provided (e.g. from navbar or home client), fetch it on-demand
      let studentsData = students;
      if (!studentsData) {
        setProgress({ current: 0, total: 0, message: "Fetching student directory..." });
        const res = await fetch("/api/students");
        if (!res.ok) {
          throw new Error(`Failed to fetch student data: ${res.statusText}`);
        }
        const json = await res.json();
        studentsData = json.data;
      }

      if (!studentsData || studentsData.length === 0) {
        throw new Error("No student profiles found to export.");
      }

      // Dynamic import — keeps jsPDF out of the main bundle
      const { generateDirectoryPDF } = await import("@/services/pdfGenerator");

      setPhase("generating");

      const blob = await generateDirectoryPDF(studentsData, (current, total, message) => {
        setProgress({ current, total, message });
      });

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "IT_Connect_Student_Directory_2022-2026.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setPhase("done");
      setTimeout(() => setPhase("idle"), 3000);
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

  const percent =
    progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  const isModalOpen = phase === "loading" || phase === "generating" || phase === "done" || phase === "error";

  // Render appropriate button styling depending on variant
  const renderButton = () => {
    if (variant === "navbar") {
      return (
        <button
          onClick={handleDownload}
          disabled={phase !== "idle"}
          className="hidden md:inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-full transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
            background: "#2d6060",
            border: "1.5px solid #2d6060",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.border = "1.5px solid #e8a830";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.border = "1.5px solid #2d6060";
          }}
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
          className="flex items-center justify-center gap-2 w-full py-3 rounded-full text-sm font-semibold text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: "#2d6060",
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
          }}
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
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
            background: "#2d6060",
            border: "2px solid #2d6060",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#e8a830";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#2d6060";
          }}
        >
          <Download size={16} />
          Download PDF
        </button>
      );
    }

    // Default directory page button
    return (
      <button
        onClick={handleDownload}
        disabled={phase !== "idle"}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          fontFamily: "var(--font-sans)",
          fontWeight: 600,
          background: "rgba(45,96,96,0.08)",
          border: "1.5px solid rgba(45,96,96,0.25)",
          color: "#2d6060",
        }}
        title="Download full student directory as PDF"
      >
        <Download size={15} />
        Download PDF
      </button>
    );
  };

  return (
    <>
      {renderButton()}

      {/* Progress Modal Overlay */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{
            background: "rgba(45,96,96,0.18)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          <div
            className="relative w-full max-w-md mx-4 overflow-hidden"
            style={{
              background: "#faf8f3",
              border: "2px solid #e8a830",
              borderRadius: "16px",
              boxShadow: "0 16px 48px rgba(45,96,96,0.20), 0 4px 12px rgba(0,0,0,0.08)",
            }}
          >
            {/* Gold top accent */}
            <div style={{ height: "4px", background: "linear-gradient(90deg, #e8a830, #2d6060, #e8a830)" }} />

            <div className="p-8">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 flex items-center justify-center rounded-lg"
                    style={{
                      background: phase === "error" ? "rgba(220,50,50,0.1)" : phase === "done" ? "rgba(76,175,80,0.1)" : "rgba(45,96,96,0.08)",
                      color: phase === "error" ? "#dc3232" : phase === "done" ? "#4caf50" : "#2d6060",
                    }}
                  >
                    {phase === "error" ? (
                      <X size={20} />
                    ) : phase === "done" ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <FileText size={20} />
                    )}
                  </div>
                  <div>
                    <h3
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: "1.1rem",
                        color: "#1a1a1a",
                      }}
                    >
                      {phase === "loading"
                        ? "Preparing…"
                        : phase === "generating"
                        ? "Generating PDF"
                        : phase === "done"
                        ? "Download Complete!"
                        : "Generation Failed"}
                    </h3>
                    <p
                      className="text-xs mt-0.5"
                      style={{
                        fontFamily: "var(--font-sans)",
                        color: "#6b5e4e",
                      }}
                    >
                      {phase === "loading"
                        ? progress.message
                        : phase === "generating"
                        ? progress.message
                        : phase === "done"
                        ? "Your yearbook PDF is ready"
                        : error}
                    </p>
                  </div>
                </div>

                {(phase === "done" || phase === "error") && (
                  <button
                    onClick={dismiss}
                    className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                    style={{ background: "rgba(45,96,96,0.06)", color: "#6b5e4e" }}
                    aria-label="Close"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              {(phase === "loading" || phase === "generating") && (
                <div className="space-y-3">
                  <div
                    className="w-full overflow-hidden"
                    style={{
                      height: "8px",
                      background: "#eceadf",
                      borderRadius: "999px",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: phase === "loading" && progress.total === 0 ? "15%" : `${percent}%`,
                        background: "linear-gradient(90deg, #2d6060, #e8a830)",
                        borderRadius: "999px",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Loader2
                        size={13}
                        className="animate-spin"
                        style={{ color: "#2d6060" }}
                      />
                      <span
                        className="text-xs"
                        style={{ fontFamily: "var(--font-sans)", color: "#6b5e4e" }}
                      >
                        {phase === "loading" && progress.total === 0
                          ? "Initializing…"
                          : `${progress.current} / ${progress.total} profiles`}
                      </span>
                    </div>
                    {phase === "generating" && (
                      <span
                        className="text-xs font-bold"
                        style={{ fontFamily: "var(--font-sans)", color: "#2d6060" }}
                      >
                        {percent}%
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Done state */}
              {phase === "done" && (
                <div
                  className="flex items-center gap-2 px-4 py-3 rounded-lg"
                  style={{
                    background: "rgba(76,175,80,0.06)",
                    border: "1px solid rgba(76,175,80,0.2)",
                  }}
                >
                  <CheckCircle2 size={16} style={{ color: "#4caf50" }} />
                  <span
                    className="text-sm"
                    style={{ fontFamily: "var(--font-sans)", color: "#2d6060" }}
                  >
                    {progress.total} student profiles saved to PDF
                  </span>
                </div>
              )}

              {/* Error state */}
              {phase === "error" && (
                <div className="flex gap-3 mt-2">
                  <button
                    onClick={handleDownload}
                    className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 600,
                      background: "#2d6060",
                    }}
                  >
                    Retry
                  </button>
                  <button
                    onClick={dismiss}
                    className="flex-1 py-2.5 rounded-full text-sm font-semibold"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 600,
                      background: "rgba(45,96,96,0.08)",
                      color: "#2d6060",
                      border: "1px solid rgba(45,96,96,0.2)",
                    }}
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
