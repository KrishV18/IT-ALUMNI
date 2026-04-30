"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 bg-white border border-black/10 hover:bg-black/5 text-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
    >
      <Printer size={16} />
      Print / Save PDF
    </button>
  );
}
