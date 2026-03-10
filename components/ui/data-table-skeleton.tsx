import { Skeleton } from "@/components/ui/skeleton";

interface DataTableSkeletonProps {
  columns?: number;
  rows?: number;
}

export function DataTableSkeleton({ columns = 5, rows = 8 }: DataTableSkeletonProps) {
  return (
    <div className="rounded-md border">
      <div className="border-b px-4 py-3">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-24" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 border-b px-4 py-3 last:border-0">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-4 w-24" />
          ))}
        </div>
      ))}
    </div>
  );
}
