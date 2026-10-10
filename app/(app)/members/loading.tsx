import { Skeleton } from '@/components/ui/Skeleton';

export default function MembersLoading() {
  return (
    <div aria-busy="true" aria-label="멤버 목록 불러오는 중">
      <Skeleton className="mb-2 h-8 w-24" />
      <Skeleton className="mb-8 h-4 w-48" />
      {[0, 1].map((s) => (
        <div key={s} className="mb-10">
          <Skeleton className="mb-4 h-5 w-16" />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="card flex items-center gap-3 p-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
