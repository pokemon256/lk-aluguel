import { GridCardsSkeleton, HeaderSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-5">
      <HeaderSkeleton />
      <GridCardsSkeleton count={6} />
    </div>
  );
}
