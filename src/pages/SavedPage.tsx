import { useEffect, useState, useMemo } from 'react';
import { Bookmark, Grid3X3, Video } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import PostCard, { Post } from '@/components/feed/PostCard';
import ClipCard, { Clip } from '@/components/clips/ClipCard';
import api from '@/lib/api';

type SavedTab = 'all' | 'posts' | 'videos';

function isVideoItem(item: Post) {
  return item.type === 'video' || item.type === 'clip';
}

export default function SavedPage() {
  const [items, setItems] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SavedTab>('all');

  const load = () => {
    setLoading(true);
    api.get('/api/users/me/saved')
      .then(({ data }) => setItems(data.posts || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (activeTab === 'posts') return items.filter((p) => !isVideoItem(p));
    if (activeTab === 'videos') return items.filter((p) => isVideoItem(p));
    return items;
  }, [items, activeTab]);

  const postCount = items.filter((p) => !isVideoItem(p)).length;
  const videoCount = items.filter((p) => isVideoItem(p)).length;

  const handleSaveChange = (id: string, saved: boolean) => {
    if (!saved) setItems((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-4 pb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-primary" />
            Saved
          </h1>
          <p className="text-sm text-gray-500 mt-1">Posts and videos you bookmarked</p>
        </div>

        <div className="flex gap-1 p-1 bg-gray-100/80 dark:bg-gray-800 rounded-2xl">
          {([
            { id: 'all' as const, label: 'All', count: items.length },
            { id: 'posts' as const, label: 'Posts', count: postCount, icon: Grid3X3 },
            { id: 'videos' as const, label: 'Videos', count: videoCount, icon: Video },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-surface-card-dark text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
              <span className="text-xs opacity-70">({tab.count})</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Bookmark className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="font-medium text-lg">Nothing saved yet</p>
            <p className="text-sm text-gray-500 mt-1">
              {activeTab === 'videos'
                ? 'Tap the bookmark icon on videos and clips to save them here'
                : activeTab === 'posts'
                  ? 'Tap the bookmark icon on posts to save them here'
                  : 'Tap the bookmark icon on any post or video to save it here'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((item) =>
              item.type === 'clip' ? (
                <ClipCard
                  key={item.id}
                  clip={item as Clip}
                  defaultSaved
                  onSaveChange={(saved) => handleSaveChange(item.id, saved)}
                />
              ) : (
                <PostCard
                  key={item.id}
                  post={item}
                  defaultSaved
                  onSaveChange={(saved) => handleSaveChange(item.id, saved)}
                />
              )
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
