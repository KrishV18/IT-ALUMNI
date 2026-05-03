export default function SkeletonProfile() {
  return (
    <div className="min-h-screen pb-20" style={{ background: "var(--color-background)" }}>
      <div className="max-w-4xl mx-auto px-6 pt-10">

        {/* Back button */}
        <div className="w-40 h-9 shimmer rounded-sm mb-8" />

        {/* Header card — yearbook frame skeleton */}
        <div
          className="overflow-hidden mb-8"
          style={{
            background: "var(--color-card)",
            border: "1px solid rgba(60,50,30,0.10)",
            borderRadius: "6px",
            boxShadow: "0 8px 24px rgba(60,50,30,0.08)",
          }}
        >
          {/* Banner area */}
          <div className="h-24 shimmer rounded-none" style={{ borderRadius: 0 }} />

          <div className="px-8 pb-8">
            <div className="w-28 h-28 rounded-sm shimmer -mt-14 mb-5 border-4" style={{
              borderColor: "var(--color-card)",
              animationDelay: "0.1s",
            }} />

            <div className="flex flex-col md:flex-row justify-between md:items-start gap-6 mb-8">
              <div className="space-y-3">
                <div className="h-9 shimmer rounded-sm w-56" style={{ animationDelay: "0.15s" }} />
                <div className="flex gap-2">
                  <div className="h-5 w-16 shimmer rounded-sm" style={{ animationDelay: "0.2s" }} />
                  <div className="h-5 w-24 shimmer rounded-sm" style={{ animationDelay: "0.25s" }} />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-9 w-28 shimmer rounded-sm" style={{ animationDelay: "0.2s" }} />
                <div className="h-9 w-24 shimmer rounded-sm" style={{ animationDelay: "0.3s" }} />
              </div>
            </div>

            <div
              className="perf-divider mb-8"
              style={{ opacity: 0.5 }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex gap-4 p-4 rounded-sm"
                  style={{ background: "rgba(60,50,30,0.025)" }}
                >
                  <div className="w-10 h-10 rounded-sm shimmer shrink-0" style={{ animationDelay: `${i * 0.1}s` }} />
                  <div className="space-y-2 flex-1">
                    <div className="h-2.5 w-14 shimmer rounded-sm" style={{ animationDelay: `${0.1 + i * 0.1}s` }} />
                    <div className="h-4 w-36 shimmer rounded-sm" style={{ animationDelay: `${0.2 + i * 0.1}s` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="h-6 w-20 shimmer rounded-sm" style={{ animationDelay: "0.4s" }} />
              <div className="h-6 w-28 shimmer rounded-sm" style={{ animationDelay: "0.5s" }} />
              <div className="h-6 w-16 shimmer rounded-sm" style={{ animationDelay: "0.6s" }} />
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-sm p-4 flex flex-col items-center"
              style={{
                background: "var(--color-card)",
                border: "1px solid rgba(60,50,30,0.08)",
              }}
            >
              <div className="w-8 h-8 rounded-sm shimmer mb-3" style={{ animationDelay: `${i * 0.1}s` }} />
              <div className="w-10 h-7 shimmer rounded-sm mb-2" style={{ animationDelay: `${0.1 + i * 0.1}s` }} />
              <div className="w-16 h-2.5 shimmer rounded-sm" style={{ animationDelay: `${0.2 + i * 0.1}s` }} />
            </div>
          ))}
        </div>

        {/* Section card */}
        <div
          className="rounded-sm p-8 mb-8"
          style={{
            background: "var(--color-card)",
            border: "1px solid rgba(60,50,30,0.08)",
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-sm shimmer" />
            <div className="h-6 w-52 shimmer rounded-sm" style={{ animationDelay: "0.15s" }} />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="p-6 rounded-sm"
                style={{
                  background: "rgba(60,50,30,0.025)",
                  border: "1px solid rgba(60,50,30,0.06)",
                }}
              >
                <div className="h-5 w-1/3 shimmer rounded-sm mb-3" style={{ animationDelay: `${i * 0.15}s` }} />
                <div className="h-3.5 w-1/4 shimmer rounded-sm mb-5" style={{ animationDelay: `${0.1 + i * 0.15}s` }} />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-3 shimmer rounded-sm" style={{ animationDelay: `${0.2 + i * 0.15}s` }} />
                  <div className="h-3 shimmer rounded-sm w-3/4" style={{ animationDelay: `${0.3 + i * 0.15}s` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
