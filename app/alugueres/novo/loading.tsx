import { Card, HeaderSkeleton, Skeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-5">
      <HeaderSkeleton />
      <div className="flex items-center gap-2">
        <Skeleton className="h-7 w-7 !rounded-full" />
        <Skeleton className="h-7 flex-1" />
        <Skeleton className="h-7 w-7 !rounded-full" />
      </div>
      <Card>
        <Skeleton className="h-40 w-full" />
      </Card>
      <Card>
        <Skeleton className="h-32 w-full" />
      </Card>
    </div>
  );
}
