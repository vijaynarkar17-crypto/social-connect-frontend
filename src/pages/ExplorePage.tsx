import { Link } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import Button from '@/components/ui/Button';

export default function ExplorePage() {
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto text-center py-20">
        <h1 className="text-2xl font-bold mb-2">Explore</h1>
        <p className="text-gray-500 mb-6">Discover trending content, reels, and people — coming in Phase 2.</p>
        <Link to="/home"><Button variant="secondary">Back to Feed</Button></Link>
      </div>
    </AppShell>
  );
}
