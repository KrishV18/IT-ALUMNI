import Link from "next/link";

export default function ProfileNotFound() {
  return (
    <div style={{
      background: "var(--bg-primary)",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
    }}>
      <div style={{ textAlign: "center", maxWidth: 440 }}>
        {/* Animated icon */}
        <div style={{
          width: 100,
          height: 100,
          borderRadius: 24,
          background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(244,63,94,0.15))",
          border: "1px solid rgba(244,63,94,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "2.8rem",
          margin: "0 auto 28px",
        }}>
          🔍
        </div>

        <h1 style={{
          fontSize: "1.8rem",
          fontWeight: 800,
          marginBottom: 12,
          letterSpacing: "-0.02em",
          color: "var(--text-primary)",
        }}>
          Student Not Found
        </h1>

        <p style={{
          fontSize: "0.95rem",
          color: "var(--text-secondary)",
          lineHeight: 1.7,
          marginBottom: 32,
        }}>
          We couldn&apos;t find a student with this ID. They may have been removed from the Google Sheet, or the link may be incorrect.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
          <Link href="/directory" className="btn-primary" style={{ padding: "12px 24px" }}>
            Browse Directory
          </Link>
          <Link href="/" className="btn-secondary" style={{ padding: "11px 20px" }}>
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
