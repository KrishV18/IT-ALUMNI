export default function SkeletonCard() {
  return (
    <div
      className="rounded-md overflow-hidden"
      style={{
        border: "2px solid rgba(232,168,48,0.35)",
        boxShadow: "0 4px 12px rgba(45,96,96,0.06)",
      }}
    >
      {/* Teal header strip skeleton */}
      <div
        className="px-4 py-4 flex items-center gap-3"
        style={{ background: "rgba(45,96,96,0.12)", height: "76px" }}
      >
        <div
          className="shrink-0 rounded-full shimmer"
          style={{ width: 44, height: 44 }}
        />
        <div className="flex-1 space-y-2">
          <div className="h-4 shimmer w-3/4 rounded-sm" style={{ animationDelay: "0.1s" }} />
          <div className="h-3 shimmer w-2/5 rounded-sm" style={{ animationDelay: "0.2s" }} />
        </div>
      </div>

      {/* Cream body skeleton */}
      <div className="px-4 pb-4 pt-3" style={{ background: "#faf8f3" }}>
        <div className="h-3 shimmer w-1/2 mb-3 rounded-sm" style={{ animationDelay: "0.15s" }} />
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="h-6 shimmer w-14 rounded-sm" style={{ animationDelay: "0.25s" }} />
          <div className="h-6 shimmer w-18 rounded-sm" style={{ animationDelay: "0.35s" }} />
          <div className="h-6 shimmer w-12 rounded-sm" style={{ animationDelay: "0.45s" }} />
        </div>
        <div className="perf-divider mb-3" />
        <div className="flex gap-2">
          <div className="h-8 shimmer w-22 rounded" style={{ animationDelay: "0.3s" }} />
          <div className="h-8 shimmer w-18 rounded" style={{ animationDelay: "0.4s" }} />
        </div>
      </div>
    </div>
  );
}
