import { Card, HeaderSkeleton, Skeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-5 w-40" />
      <Card className="flex items-center gap-4">
        <Skeleton className="size-16 shrink-0 !rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="mt-2 h-4 w-1/3" />
        </div>
        <Skeleton className="h-10 w-32" />
      </Card>
      <HeaderSkeleton action={false} />
    </div>
  );
}
