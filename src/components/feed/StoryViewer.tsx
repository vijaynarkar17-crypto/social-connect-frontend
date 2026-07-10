import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import { resolveAssetUrl } from '@/lib/api';

interface StoryGroup {
  author: { username: string; avatar?: string; isVerified?: boolean };
  items: { id: string; media: string[]; storyEffect?: string }[];
}

interface StoryViewerProps {
  open: boolean;
  groups: StoryGroup[];
  initialGroupIndex?: number;
  onClose: () => void;
}

export default function StoryViewer({
  open,
  groups,
  initialGroupIndex = 0,
  onClose,
}: StoryViewerProps) {
  const { user } = useAuth();
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [itemIndex, setItemIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!open) return;
    setGroupIndex(Math.min(initialGroupIndex, Math.max(groups.length - 1, 0)));
    setItemIndex(0);
  }, [open, initialGroupIndex, groups.length]);

  const activeGroup = groups[groupIndex];
  const activeItem = activeGroup?.items[itemIndex];
  const mediaUrl = resolveAssetUrl(activeItem?.media?.[0]);
  const isOwnStory = activeGroup?.author?.username === user?.username;

  const isVideo = useMemo(() => {
    if (!mediaUrl) return false;
    return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(mediaUrl);
  }, [mediaUrl]);

  const goNext = useCallback(() => {
    if (!activeGroup) return;
    if (itemIndex < activeGroup.items.length - 1) {
      setItemIndex((v) => v + 1);
      return;
    }
    if (groupIndex < groups.length - 1) {
      setGroupIndex((v) => v + 1);
      setItemIndex(0);
      return;
    }
    onClose();
  }, [activeGroup, groupIndex, groups.length, itemIndex, onClose]);

  const goPrev = () => {
    if (!activeGroup) return;
    if (itemIndex > 0) {
      setItemIndex((v) => v - 1);
      return;
    }
    if (groupIndex > 0) {
      const prev = groupIndex - 1;
      setGroupIndex(prev);
      setItemIndex(Math.max((groups[prev]?.items.length || 1) - 1, 0));
    }
  };

  useEffect(() => {
    if (!open || !groups.length || paused) return;
    const timer = window.setTimeout(goNext, isVideo ? 7000 : 5000);
    return () => window.clearTimeout(timer);
  }, [open, groupIndex, itemIndex, isVideo, groups.length, paused, goNext]);

  if (!open || !activeGroup || !activeItem || !mediaUrl) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] bg-black"
      >
        <div className="absolute top-0 left-0 right-0 z-20 p-4">
          <div className="flex gap-1 mb-3">
            {activeGroup.items.map((item, idx) => (
              <div key={item.id} className="h-1 flex-1 rounded bg-white/25 overflow-hidden">
                <div className={`h-full ${idx <= itemIndex ? 'bg-white' : 'bg-transparent'}`} />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Avatar src={activeGroup.author.avatar} alt={activeGroup.author.username} size="sm" />
              <span className="username text-sm text-white">{activeGroup.author.username}</span>
              {isOwnStory && <span className="text-xs text-white/60">Your story</span>}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPaused((v) => !v)}
                className="w-10 h-10 rounded-full bg-black/40 text-white text-xs font-medium"
              >
                {paused ? '▶' : '❚❚'}
              </button>
              <button type="button" onClick={onClose} className="text-white/90">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          {isVideo ? (
            <video src={mediaUrl} autoPlay muted playsInline className="w-full h-full object-contain" />
          ) : (
            <img src={mediaUrl} alt="Story" className="w-full h-full object-contain" />
          )}
        </div>

        <button
          type="button"
          onClick={goPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={goNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white flex items-center justify-center"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
