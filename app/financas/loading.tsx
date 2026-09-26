import { HeaderSkeleton, RowsSkeleton, Skeleton } from "@/components/skeletons";
import { Card } from "@/components/ui/primitives";

export default function Loading() {
  return (
    <div className="flex flex-col gap-5">
      <HeaderSkeleton action={false} />
      <Card className="flex gap-3">
        <Skeleton className="h-24 flex-1" />
        <Skeleton className="hidden h-24 flex-1 sm:block" />
        <Skeleton className="hidden h-24 flex-1 md:block" />
      </Card>
      <Card>
        <Skeleton className="h-48 w-full" />
      </Card>
      <RowsSkeleton count={4} />
    </div>
  );
}
