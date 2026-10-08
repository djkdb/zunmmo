export function QuestListSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-5">
      {[0, 1, 2].map((i) => (
        <span key={i} className="pixel-skeleton h-24 w-full" />
      ))}
    </div>
  );
}
