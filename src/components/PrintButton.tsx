"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 text-sm font-semibold transition-all duration-150 hover:shadow-sm no-print"
      style={{
        background: "var(--color-card)",
        color: "var(--color-muted-foreground)",
        border: "1.5px solid rgba(60,50,30,0.14)",
        borderRadius: "3px",
        padding: "6px 14px",
        boxShadow: "1px 1px 0 rgba(60,50,30,0.08)",
      }}
    >
      <Printer size={15} />
      Print / Save PDF
    </button>
  );
}
