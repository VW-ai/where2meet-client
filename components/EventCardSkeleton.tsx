export default function EventCardSkeleton() {
  return (
    <div className="border border-gray-300 bg-white p-6 animate-pulse">
      {/* Title skeleton */}
      <div className="flex items-start justify-between mb-2">
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="h-5 bg-gray-200 rounded w-16"></div>
      </div>

      {/* Location skeleton */}
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>

      {/* Progress and avatars skeleton */}
      <div className="flex items-center gap-4 mb-3">
        <div className="h-8 bg-gray-200 rounded w-24"></div>
        <div className="flex -space-x-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-8 h-8 rounded-full bg-gray-200"></div>
          ))}
        </div>
      </div>

      {/* Details skeleton */}
      <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>

      {/* Buttons skeleton */}
      <div className="flex gap-3">
        <div className="h-10 bg-gray-200 rounded flex-1"></div>
        <div className="h-10 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
  );
}
