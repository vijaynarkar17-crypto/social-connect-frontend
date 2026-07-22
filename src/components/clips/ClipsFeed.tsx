import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import ChatBox from '@/components/ui/ChatBox';
import ClipCard, { type Clip } from '@/components/clips/ClipCard';
import { useAuth } from '@/context/AuthContext';
import { useSwipeRightAction } from '@/hooks/useEdgeSwipe';
import api from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { removeClip, setClips } from '@/store/contentSlice';
import { selectClips } from '@/store/selectors';

interface ClipsFeedProps {
  active?: boolean;
  onSwipeToMessages?: () => void;
}

export default function ClipsFeed({ active = true, onSwipeToMessages }: ClipsFeedProps) {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const clips = useAppSelector(selectClips);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(0);
  const scrollLockRef = useRef(false);
  const wheelAccumRef = useRef(0);
  const wheelTimerRef = useRef<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideHeight, setSlideHeight] = useState(0);

  activeIndexRef.current = activeIndex;

  const swipeBack = useSwipeRightAction(
    () => onSwipeToMessages?.(),
    active && !!onSwipeToMessages,
    true
  );

  const loadClips = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setLoading(true);
      try {
        const { data } = await api.get('/api/posts/clips', { params: { limit: 30 } });
        const fromApi: Clip[] = (data.clips || []).filter((c: Clip) => c.media?.[0]);
        dispatch(setClips(fromApi));
        if (isRefresh) setActiveIndex(0);
      } catch {
        dispatch(setClips([]));
      } finally {
        setLoading(false);
      }
    },
    [dispatch]
  );

  useEffect(() => {
    if (active) loadClips();
  }, [active, loadClips]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const measure = () => setSlideHeight(root.clientHeight);
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(root);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [loading, clips.length]);

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      const root = scrollRef.current;
      if (!root || clips.length === 0 || scrollLockRef.current) return;

      const target = Math.max(0, Math.min(index, clips.length - 1));
      const item = root.querySelector(`[data-clip-item][data-index="${target}"]`) as HTMLElement | null;
      if (!item) return;

      scrollLockRef.current = true;
      setActiveIndex(target);
      item.scrollIntoView({ behavior, block: 'start' });
      window.setTimeout(() => {
        scrollLockRef.current = false;
      }, behavior === 'smooth' ? 450 : 80);
    },
    [clips.length]
  );

  useEffect(() => {
    const root = scrollRef.current;
    if (!root || clips.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
            const idx = Number(entry.target.getAttribute('data-index'));
            if (!Number.isNaN(idx)) setActiveIndex(idx);
          }
        }
      },
      { root, threshold: [0.55, 0.75] }
    );

    root.querySelectorAll('[data-clip-item]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [clips, slideHeight]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !active || clips.length === 0) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      wheelAccumRef.current += e.deltaY;

      if (wheelTimerRef.current) window.clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = window.setTimeout(() => {
        const accum = wheelAccumRef.current;
        wheelAccumRef.current = 0;
        if (scrollLockRef.current || Math.abs(accum) < 30) return;

        const idx = activeIndexRef.current;
        if (accum > 0) scrollToIndex(idx + 1);
        else if (idx > 0) scrollToIndex(idx - 1);
      }, 90);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      if (wheelTimerRef.current) window.clearTimeout(wheelTimerRef.current);
    };
  }, [active, clips.length, scrollToIndex]);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('video/')) {
      setError('Please select a video file');
      return;
    }
    setError('');
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowUpload(true);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', selectedFile);
      form.append('folder', 'clips');
      const { data: upload } = await api.post('/api/posts/upload', form);
      await api.post('/api/posts', {
        type: 'clip',
        content: caption.trim(),
        media: [upload.url],
      });
      setCaption('');
      setSelectedFile(null);
      setPreviewUrl(null);
      setShowUpload(false);
      await loadClips();
    } catch {
      setError('Failed to upload clip. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setShowUpload(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setCaption('');
    setError('');
  };

  return (
    <div className="h-full w-full min-h-0 flex justify-center bg-black">
      <div className="relative h-full w-full max-w-[430px] min-h-0 flex flex-col bg-black border-x border-yellow-500/20">
        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
            e.target.value = '';
          }}
        />

        {user && !loading && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute right-3 top-3 z-40 w-10 h-10 rounded-2xl bg-primary text-black border-2 border-black shadow-[3px_3px_0_0_#000] flex items-center justify-center active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
            aria-label="Upload clip"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        )}

        {showUpload && previewUrl && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-md p-4 space-y-3">
              <p className="font-semibold text-sm">New clip</p>
              <video src={previewUrl} controls className="w-full max-h-64 rounded-xl bg-black object-cover" />
              <ChatBox value={caption} onChange={setCaption} placeholder="Add a caption..." multiline rows={2} />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={resetUpload}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleUpload} loading={uploading}>
                  Post Clip
                </Button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex-1 min-h-0 w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide overscroll-y-contain touch-pan-y"
            onTouchStart={swipeBack.onTouchStart}
            onTouchMove={swipeBack.onTouchMove}
            onTouchEnd={swipeBack.onTouchEnd}
          >
            {clips.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center px-8 text-center text-white">
                <p className="text-lg font-semibold">No clips yet</p>
                <p className="mt-1 text-sm text-white/60">
                  Upload a video with the + button to share the first clip.
                </p>
              </div>
            )}

            {clips.map((clip, index) => (
              <div
                key={clip.id}
                data-clip-item
                data-index={index}
                className="w-full snap-start snap-always shrink-0 relative"
                style={{ height: slideHeight > 0 ? slideHeight : '100%' }}
              >
                <ClipCard
                  clip={clip}
                  onUpdate={() => loadClips(true)}
                  onDeleted={() => {
                    const next = clips.filter((c) => c.id !== clip.id);
                    dispatch(removeClip(clip.id));
                    const newIndex = Math.min(activeIndexRef.current, Math.max(0, next.length - 1));
                    if (next.length > 0 && newIndex !== activeIndexRef.current) {
                      window.setTimeout(() => scrollToIndex(newIndex, 'auto'), 0);
                    }
                  }}
                  onUnavailable={() => {
                    const next = clips.filter((c) => c.id !== clip.id);
                    dispatch(removeClip(clip.id));
                    const newIndex = Math.min(activeIndexRef.current, Math.max(0, next.length - 1));
                    if (next.length > 0 && newIndex !== activeIndexRef.current) {
                      window.setTimeout(() => scrollToIndex(newIndex, 'auto'), 0);
                    }
                  }}
                  fullscreen
                  isActive={activeIndex === index}
                  demo={false}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
