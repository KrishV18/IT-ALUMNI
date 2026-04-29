export default function SkeletonCard() {
  return (
    <div className="bg-card/30 border border-white/5 rounded-2xl p-6">
      <div className="flex gap-4 mb-4">
        <div className="w-14 h-14 rounded-xl shrink-0 shimmer" />
        <div className="flex-1 space-y-2.5 pt-1">
          <div className="h-4 shimmer w-3/4" style={{ animationDelay: "0.1s" }} />
          <div className="h-3 shimmer w-2/5 rounded-md" style={{ animationDelay: "0.2s" }} />
        </div>
      </div>
      <div className="h-3 shimmer w-1/2 mb-5 rounded-md" style={{ animationDelay: "0.15s" }} />
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="h-6 shimmer w-16 rounded-lg" style={{ animationDelay: "0.25s" }} />
        <div className="h-6 shimmer w-20 rounded-lg" style={{ animationDelay: "0.35s" }} />
        <div className="h-6 shimmer w-14 rounded-lg" style={{ animationDelay: "0.45s" }} />
      </div>
      <div className="h-px bg-white/5 w-full mb-4" />
      <div className="flex gap-2">
        <div className="h-8 shimmer w-24 rounded-lg" style={{ animationDelay: "0.3s" }} />
        <div className="h-8 shimmer w-20 rounded-lg" style={{ animationDelay: "0.4s" }} />
      </div>
    </div>
  );
}
