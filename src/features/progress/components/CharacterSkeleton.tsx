/** Character sheet silhouette while progress loads (UI_GUIDE §8). */
export function CharacterSkeleton() {
  return (
    <div
      aria-hidden
      className="flex flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12"
    >
      <div className="flex flex-col gap-8">
        <span className="pixel-skeleton h-80 w-full" />
        <span className="pixel-skeleton h-40 w-full" />
      </div>
      <div className="flex flex-col gap-8">
        <span className="pixel-skeleton h-32 w-full" />
        <span className="pixel-skeleton h-64 w-full" />
      </div>
    </div>
  );
}
