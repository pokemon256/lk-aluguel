import { Card, Skeleton, StatGridSkeleton, RowsSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-[2rem] bg-ink-950 p-6 md:p-8">
        <Skeleton className="h-4 w-32 !bg-white/15" />
        <Skeleton className="mt-2 h-9 w-3/4 !bg-white/15" />
        <Skeleton className="mt-2 h-4 w-1/2 !bg-white/10" />
      </div>
      <StatGridSkeleton />
      <RowsSkeleton />
      <Card>
        <Skeleton className="h-40 w-full" />
      </Card>
    </div>
  );
}
