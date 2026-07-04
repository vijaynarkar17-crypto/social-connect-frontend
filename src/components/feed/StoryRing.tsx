import { useState, useEffect, useCallback, useMemo } from 'react';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import { Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import StoryViewer from '@/components/feed/StoryViewer';

interface StoryGroup {
  author: { username: string; avatar?: string; isVerified?: boolean };
  items: { id: string; media: string[]; storyEffect?: string }[];
}

export default function StoryRing({
  onOpenCamera,
  storyRefreshKey = 0,
}: {
  onOpenCamera: () => void;
  storyRefreshKey?: number;
}) {
  const { user } = useAuth();
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerGroups, setViewerGroups] = useState<StoryGroup[]>([]);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);

  const loadStories = useCallback(() => {
    api.get('/api/posts/stories').then(({ data }) => setGroups(data.stories || [])).catch(() => {});
  }, []);

  useEffect(() => {
    loadStories();
  }, [loadStories, storyRefreshKey]);

  const myStory = useMemo(
    () => groups.find((g) => g.author?.username === user?.username),
    [groups, user?.username]
  );

  const otherGroups = useMemo(
    () => groups.filter((g) => g.author?.username !== user?.username),
    [groups, user?.username]
  );

  const hasMyStory = Boolean(myStory?.items?.length);

  const handleYourStoryClick = () => {
    if (!hasMyStory || !myStory) return;
    setViewerGroups([myStory]);
    setActiveGroupIndex(0);
    setViewerOpen(true);
  };

  const handleAddStoryClick = () => {
    onOpenCamera();
  };

  const handleOtherStoryClick = (index: number) => {
    setViewerGroups(otherGroups);
    setActiveGroupIndex(index);
    setViewerOpen(true);
  };

  return (
    <>
      <Card className="overflow-hidden !p-4">
        <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
          {hasMyStory ? (
            <button
              type="button"
              onClick={handleYourStoryClick}
              className="flex flex-col items-center gap-1 flex-shrink-0 active:scale-95 transition-transform"
            >
              <div className="p-0.5 rounded-full bg-gradient-accent">
                <div className="p-0.5 bg-white dark:bg-surface-card-dark rounded-full">
                  <Avatar src={user?.avatar} alt={user?.username || 'You'} size="lg" />
                </div>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 max-w-[72px] truncate text-center">
                Your Story
              </span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleAddStoryClick}
            className="flex flex-col items-center gap-1 flex-shrink-0 active:scale-95 transition-transform"
          >
            <div className="p-0.5 rounded-full bg-gradient-accent">
              <div className="p-0.5 bg-white dark:bg-surface-card-dark rounded-full relative">
                {hasMyStory ? (
                  <div className="w-14 h-14 rounded-full border-2 border-dashed border-primary/50 flex items-center justify-center bg-primary/5">
                    <Plus className="w-6 h-6 text-primary" />
                  </div>
                ) : (
                  <>
                    <Avatar src={user?.avatar} alt={user?.username || 'You'} size="lg" />
                    <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-primary border-2 border-white flex items-center justify-center">
                      <Plus className="w-3 h-3 text-white" />
                    </div>
                  </>
                )}
              </div>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 max-w-[72px] truncate text-center">
              Add Story
            </span>
          </button>

          {otherGroups.map((g, index) => (
            <button
              type="button"
              key={g.author.username}
              onClick={() => handleOtherStoryClick(index)}
              className="flex flex-col items-center gap-1 flex-shrink-0 active:scale-95 transition-transform"
            >
              <div className="p-0.5 rounded-full bg-gradient-accent">
                <div className="p-0.5 bg-white dark:bg-surface-card-dark rounded-full">
                  <Avatar src={g.author.avatar} alt={g.author.username} size="lg" />
                </div>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 max-w-[64px] truncate username">
                {g.author.username}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Tap Add Story or swipe right from the left edge for camera
        </p>
      </Card>

      <StoryViewer
        open={viewerOpen}
        groups={viewerGroups}
        initialGroupIndex={activeGroupIndex}
        onClose={() => setViewerOpen(false)}
      />
    </>
  );
}
