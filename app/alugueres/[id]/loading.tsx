import { Card, Skeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-5 w-40" />
      <div className="rounded-[2rem] bg-ink-900/10 p-6 md:p-8">
        <Skeleton className="h-4 w-32 !bg-white/40" />
        <Skeleton className="mt-2 h-9 w-1/2 !bg-white/40" />
        <Skeleton className="mt-2 h-4 w-3/4 !bg-white/30" />
        <div className="mt-5 grid grid-cols-3 gap-3">
          <Skeleton className="h-16 !bg-white/30" />
          <Skeleton className="h-16 !bg-white/30" />
          <Skeleton className="h-16 !bg-white/30" />
        </div>
      </div>
      <Card>
        <Skeleton className="mb-2 h-6 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-2/3" />
      </Card>
    </div>
  );
}
