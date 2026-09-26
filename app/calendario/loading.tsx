import { Card, HeaderSkeleton, Skeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-5">
      <HeaderSkeleton action={false} />
      <Card>
        <Skeleton className="h-96 w-full" />
      </Card>
    </div>
  );
}
