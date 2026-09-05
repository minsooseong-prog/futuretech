import { Skeleton, SkeletonMemberGrid } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div>
      <Skeleton className="mb-6 h-8 w-32" />
      <Skeleton className="mb-3 h-5 w-20" />
      <SkeletonMemberGrid count={6} />
    </div>
  );
}
