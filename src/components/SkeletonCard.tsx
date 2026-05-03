export default function SkeletonCard() {
  return (
    <div
      className="p-6"
      style={{
        background: "var(--color-card)",
        border: "1px solid rgba(60,50,30,0.10)",
        borderRadius: "6px",
        boxShadow: "0 4px 6px -1px rgba(60,50,30,0.06), 0 2px 4px -1px rgba(60,50,30,0.03)",
      }}
    >
      <div className="flex gap-4 mb-4">
        <div className="w-14 h-14 rounded-sm shrink-0 shimmer" style={{ animationDelay: "0s" }} />
        <div className="flex-1 space-y-2.5 pt-1">
          <div className="h-4 shimmer w-3/4 rounded-sm" style={{ animationDelay: "0.1s" }} />
          <div className="h-3 shimmer w-2/5 rounded-sm" style={{ animationDelay: "0.2s" }} />
        </div>
      </div>
      <div className="h-3 shimmer w-1/2 mb-5 rounded-sm" style={{ animationDelay: "0.15s" }} />
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="h-6 shimmer w-16 rounded-sm" style={{ animationDelay: "0.25s" }} />
        <div className="h-6 shimmer w-20 rounded-sm" style={{ animationDelay: "0.35s" }} />
        <div className="h-6 shimmer w-14 rounded-sm" style={{ animationDelay: "0.45s" }} />
      </div>
      <div className="perf-divider mb-4" />
      <div className="flex gap-2">
        <div className="h-8 shimmer w-24 rounded-sm" style={{ animationDelay: "0.3s" }} />
        <div className="h-8 shimmer w-20 rounded-sm" style={{ animationDelay: "0.4s" }} />
      </div>
    </div>
  );
}
