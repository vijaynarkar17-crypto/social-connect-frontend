import clsx from 'clsx';

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('shimmer rounded-xl', className)} />;
}

export function PostCardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex gap-3"><Skeleton className="w-10 h-10 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-28" /><Skeleton className="h-2 w-16" /></div></div>
      <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" />
    </div>
  );
}
