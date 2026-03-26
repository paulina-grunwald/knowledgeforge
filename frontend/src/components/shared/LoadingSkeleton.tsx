/**
 * Reusable loading skeleton component for different content types.
 * Provides consistent placeholder animations while data loads.
 */

interface LoadingSkeletonProps {
  type?: "card" | "text" | "list" | "table";
  count?: number;
  className?: string;
}

export function LoadingSkeleton({
  type = "card",
  count = 1,
  className = "",
}: LoadingSkeletonProps) {
  if (type === "text") {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-gray-200 rounded animate-pulse"
            style={{
              width: i === count - 1 ? "80%" : "100%",
            }}
          />
        ))}
      </div>
    );
  }

  if (type === "list") {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="p-4 bg-gray-100 rounded-lg animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "table") {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex gap-4 p-4 bg-gray-100 rounded-lg">
          <div className="h-4 bg-gray-200 rounded flex-1" />
          <div className="h-4 bg-gray-200 rounded flex-1" />
          <div className="h-4 bg-gray-200 rounded flex-1" />
        </div>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="h-4 bg-gray-200 rounded flex-1" />
            <div className="h-4 bg-gray-200 rounded flex-1" />
            <div className="h-4 bg-gray-200 rounded flex-1" />
          </div>
        ))}
      </div>
    );
  }

  // Default: card type
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-2/3 mb-3" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}
