import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/primitives";

export { Card };

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-xl bg-ink-900/8", className)} />;
}

export function HeaderSkeleton({ action = true }: { action?: boolean }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <Skeleton className="h-9 w-48 md:h-10 md:w-64" />
        <Skeleton className="mt-2 h-4 w-36" />
      </div>
      {action && <Skeleton className="h-10 w-36" />}
    </div>
  );
}

export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <Skeleton className="size-10 !rounded-2xl" />
          <Skeleton className="mt-3 h-7 w-20" />
          <Skeleton className="mt-2 h-4 w-24" />
        </Card>
      ))}
    </div>
  );
}

export function RowsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <Card>
      <Skeleton className="mb-3 h-6 w-44" />
      <div className="flex flex-col">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-3.5 border-b border-ink-900/8 py-3 last:border-0">
            <Skeleton className="h-[52px] w-12 shrink-0 !rounded-2xl" />
            <div className="flex-1">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mt-1.5 h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-20 !rounded-full" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function GridCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="flex items-center gap-3.5">
          <Skeleton className="size-12 shrink-0 !rounded-2xl" />
          <div className="flex-1">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="mt-1.5 h-3 w-3/4" />
          </div>
          <Skeleton className="h-6 w-20" />
        </Card>
      ))}
    </div>
  );
}

