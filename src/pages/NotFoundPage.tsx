import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <Logo size="lg" className="mb-8" />
      <h1 className="text-6xl font-bold gradient-text">404</h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mt-4">Page not found</p>
      <p className="text-gray-500 mt-2 mb-8">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/"><Button>Go Home</Button></Link>
    </div>
  );
}
