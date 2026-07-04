import Logo from './Logo';

export default function LoadingScreen({ message }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Logo size="lg" className="mb-8" />
      <div className="w-8 h-8 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
      {message && <p className="text-sm text-gray-500 mt-4">{message}</p>}
    </div>
  );
}
