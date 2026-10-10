import { Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="불러오는 중">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-4 w-64" />
      <div className="grid gap-4 pt-4 sm:grid-cols-2">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}
