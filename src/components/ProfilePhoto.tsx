"use client";

import { useState } from "react";

interface ProfilePhotoProps {
  src: string;
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

export default function ProfilePhoto({ src, alt, initials }: ProfilePhotoProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <InitialsAvatar initials={initials} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={() => setFailed(true)}
    />
  );
}
