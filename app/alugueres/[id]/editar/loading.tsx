import { HeaderSkeleton, Skeleton } from "@/components/skeletons";
import { Card } from "@/components/ui/primitives";

export default function Loading() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-5 w-40" />
      <HeaderSkeleton />
      <Card>
        <Skeleton className="h-40 w-full" />
      </Card>
      <Card>
        <Skeleton className="h-32 w-full" />
      </Card>
    </div>
  );
}
