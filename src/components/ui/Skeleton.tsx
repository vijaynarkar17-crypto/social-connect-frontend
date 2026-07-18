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

export function ConversationListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="w-11 h-11 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between gap-2">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-2.5 w-8" />
            </div>
            <Skeleton className="h-3 w-full max-w-[220px]" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ChatThreadSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-4 px-1">
      {Array.from({ length: rows }).map((_, i) => {
        const mine = i % 3 === 2;
        return (
          <div key={i} className={clsx('flex', mine ? 'justify-end' : 'justify-start')}>
            <Skeleton
              className={clsx(
                'h-10 rounded-2xl',
                mine ? 'w-[58%] rounded-br-md' : 'w-[52%] rounded-bl-md'
              )}
            />
          </div>
        );
      })}
    </div>
  );
}

export function NotificationListSkeleton({ rows = 7 }: { rows?: number }) {
  return (
    <div className="glass-card divide-y divide-gray-100 dark:divide-gray-800 !p-0 overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-4">
          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-2 pt-0.5">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfilePageSkeleton() {
  return (
    <div className="space-y-4 -mx-4 md:mx-0 animate-pulse">
      <Skeleton className="h-40 md:h-48 rounded-b-2xl" />
      <div className="px-4 -mt-14 relative">
        <div className="flex items-end gap-4">
          <Skeleton className="w-24 h-24 rounded-full border-4 border-white dark:border-surface-dark shrink-0" />
          <div className="flex-1 grid grid-cols-3 gap-1 rounded-2xl bg-gray-50/90 dark:bg-gray-800/60 p-1">
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-9 flex-1 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>
      <div className="flex border-b border-gray-200 dark:border-gray-800 px-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 flex-1 mx-1 rounded-none" />
        ))}
      </div>
      <div className="px-4 space-y-4 pb-4">
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    </div>
  );
}

export function AppLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark flex flex-col">
      <div className="shrink-0 border-b border-gray-200/80 dark:border-gray-800/80 px-4 py-3 flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <div className="flex gap-2">
          <Skeleton className="w-9 h-9 rounded-full" />
          <Skeleton className="w-9 h-9 rounded-full" />
        </div>
      </div>
      <div className="flex-1 max-w-2xl w-full mx-auto p-4 space-y-4">
        <PostCardSkeleton />
        <PostCardSkeleton />
        <div className="glass-card p-4 space-y-3">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
      <div className="shrink-0 border-t border-gray-200/80 dark:border-gray-800/80 px-6 py-3 flex justify-around">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="w-8 h-8 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
