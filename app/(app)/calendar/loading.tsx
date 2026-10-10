import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div>
      <Skeleton className="mb-6 h-8 w-28" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Skeleton className="h-[520px] w-full rounded-2xl" />
        <div className="space-y-5">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
