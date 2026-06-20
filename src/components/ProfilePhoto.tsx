"use client";

import { useState } from "react";

interface ProfilePhotoProps {
  src: string;          // local photo path via /api/photo/:enrollment (primary)
  fallbackSrc?: string; // Drive thumbnail URL (secondary)
  alt: string;
  initials: string;
}

function InitialsAvatar({ initials }: { initials: string }) {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #f3f0e8, #eceadf)",
      }}
    >
      <span
        className="font-bold select-none"
        style={{
          fontFamily: "var(--font-display)",
          color: "#2d6060",
          fontSize: "clamp(2rem, 6vw, 3.5rem)",
          opacity: 0.35,
          letterSpacing: "0.05em",
        }}
      >
        {initials}
      </span>
    </div>
  );
}

/**
 * Shows photo from local API first, falls back to Drive URL, then initials.
 */
export default function ProfilePhoto({ src, fallbackSrc, alt, initials }: ProfilePhotoProps) {
  const [srcIdx, setSrcIdx] = useState(0);
  const sources = [src, fallbackSrc].filter(Boolean) as string[];

  if (!sources.length || srcIdx >= sources.length) {
    return <InitialsAvatar initials={initials} />;
  }

  return (
    <img
      src={sources[srcIdx]}
      alt={alt}
      className="w-full h-full object-cover"
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={() => setSrcIdx((i) => i + 1)}
    />
  );
}
