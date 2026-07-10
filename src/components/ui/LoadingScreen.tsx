import { AppLoadingSkeleton } from './Skeleton';

export default function LoadingScreen({ message }: { message?: string }) {
  return (
    <div className="min-h-screen relative">
      <AppLoadingSkeleton />
      {message && (
        <p className="absolute bottom-8 left-0 right-0 text-center text-sm text-gray-500">{message}</p>
      )}
    </div>
  );
}
