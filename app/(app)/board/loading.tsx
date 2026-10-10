import { Skeleton, SkeletonRows } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div>
      <Skeleton className="mb-6 h-8 w-32" />
      <Skeleton className="mb-4 h-8 w-full max-w-md rounded-full" />
      <SkeletonRows rows={8} />
    </div>
  );
}
