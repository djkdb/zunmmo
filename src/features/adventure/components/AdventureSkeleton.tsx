/** Same silhouette as the adventure screen (UI_GUIDE §8): stepped pulse, never a shimmer. */
export function AdventureSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <span className="pixel-skeleton size-24 shrink-0 lg:size-32" />
        <div className="flex flex-1 flex-col gap-2">
          <span className="pixel-skeleton h-5 w-24" />
          <span className="pixel-skeleton h-4 w-32" />
          <span className="pixel-skeleton h-7 w-20" />
          <span className="pixel-skeleton h-3 w-full" />
        </div>
      </div>
      <span className="pixel-skeleton h-36 w-full" />
      <span className="pixel-skeleton h-24 w-full" />
    </div>
  );
}
