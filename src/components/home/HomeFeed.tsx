import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, Plus } from 'lucide-react';
import StoryRing from '@/components/feed/StoryRing';
import StoryCamera, { type CameraPurpose } from '@/components/feed/StoryCamera';
import CreatePost from '@/components/feed/CreatePost';
import CreatePlusMenu from '@/components/home/CreatePlusMenu';
import PostCard, { type Post } from '@/components/feed/PostCard';
import { PostCardSkeleton } from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import ChatBox from '@/components/ui/ChatBox';
import { useAuth } from '@/context/AuthContext';
import { useSwipeRevealCamera } from '@/hooks/useSwipeRevealCamera';
import { useSwipeLeftAction } from '@/hooks/useEdgeSwipe';
import api from '@/lib/api';
import { isPostExpired } from '@/lib/ephemeralPost';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { appendFeed, setFeed, upsertFeedPost } from '@/store/contentSlice';
import { selectFeed } from '@/store/selectors';

interface HomeFeedProps {
  cameraEnabled?: boolean;
  onSwipeToMessages?: () => void;
}

export default function HomeFeed({ cameraEnabled = true, onSwipeToMessages }: HomeFeedProps) {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const posts = useAppSelector(selectFeed);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightPostId = searchParams.get('post');
  const photoFileRef = useRef<HTMLInputElement>(null);
  const clipFileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraPurpose, setCameraPurpose] = useState<CameraPurpose>('story');
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [expandCreateTrigger, setExpandCreateTrigger] = useState(0);
  const [clipUpload, setClipUpload] = useState<{ url: string; file: File } | null>(null);
  const [clipCaption, setClipCaption] = useState('');
  const [clipUploading, setClipUploading] = useState(false);
  const [swipeHint, setSwipeHint] = useState(false);
  const [storyRefreshKey, setStoryRefreshKey] = useState(0);
  const cursorRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const swipe = useSwipeRevealCamera({
    onOpen: () => openCamera('story'),
    onClose: () => setCameraOpen(false),
    enabled: cameraEnabled && !cameraOpen && !createMenuOpen,
  });

  const toMessages = useSwipeLeftAction(() => onSwipeToMessages?.(), cameraEnabled && !cameraOpen && !!onSwipeToMessages);

  const handleTouchStart = (e: React.TouchEvent) => {
    swipe.onTouchStart(e);
    toMessages.onTouchStart(e);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    swipe.onTouchMove(e);
    toMessages.onTouchMove(e);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    swipe.onTouchEnd(e);
    toMessages.onTouchEnd(e);
  };

  const openCamera = (purpose: CameraPurpose = 'story') => {
    setCameraPurpose(purpose);
    setCameraOpen(true);
    swipe.snapOpen();
  };

  const closeCamera = () => {
    setCameraOpen(false);
    swipe.reset();
  };

  const handleRefreshFeed = () => {
    loadPosts(true);
    setStoryRefreshKey((k) => k + 1);
  };

  const uploadPhotoFile = async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    form.append('folder', 'posts');
    const { data: upload } = await api.post('/api/posts/upload', form);
    await api.post('/api/posts', {
      type: file.type.startsWith('video/') ? 'video' : 'image',
      content: '',
      media: [upload.url],
    });
    handleRefreshFeed();
  };

  const handleClipUpload = async () => {
    if (!clipUpload) return;
    setClipUploading(true);
    try {
      const form = new FormData();
      form.append('file', clipUpload.file);
      form.append('folder', 'clips');
      const { data: upload } = await api.post('/api/posts/upload', form);
      await api.post('/api/posts', {
        type: 'clip',
        content: clipCaption.trim(),
        media: [upload.url],
      });
      setClipUpload(null);
      setClipCaption('');
      handleRefreshFeed();
    } finally {
      setClipUploading(false);
    }
  };

  const slideX = cameraOpen ? '100%' : `${swipe.progress * 100}%`;

  const loadPosts = async (reset: boolean) => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/posts/feed', {
        params: { limit: 10, cursor: reset ? undefined : cursorRef.current },
      });
      if (reset) dispatch(setFeed(data.posts));
      else dispatch(appendFeed(data.posts));
      cursorRef.current = data.nextCursor;
      setHasMore(data.hasMore);
    } finally {
      setLoading(false);
    }
  };

  const scrollToPost = useCallback((postId: string) => {
    window.setTimeout(() => {
      const root = scrollRef.current;
      const el = document.getElementById(`post-${postId}`);
      if (!el || !root) return;
      const rootRect = root.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const top = root.scrollTop + (elRect.top - rootRect.top) - rootRect.height / 2 + elRect.height / 2;
      root.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      el.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'dark:ring-offset-surface-dark');
      window.setTimeout(() => {
        el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'dark:ring-offset-surface-dark');
      }, 2500);
    }, 150);
  }, []);

  useEffect(() => {
    if (!highlightPostId || loading) return;

    if (posts.some((p) => p.id === highlightPostId)) {
      scrollToPost(highlightPostId);
      return;
    }

    api
      .get(`/api/posts/${highlightPostId}`)
      .then(({ data }) => {
        const post = data.post as Post;
        if (post.type === 'clip') {
          navigate('/clips');
          return;
        }
        dispatch(upsertFeedPost(post));
        scrollToPost(highlightPostId);
      })
      .catch(() => {});
  }, [highlightPostId, loading, posts, scrollToPost, navigate, dispatch]);

  useEffect(() => {
    cursorRef.current = null;
    loadPosts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const isStaleVibe = (p: Post) => {
      if (p.type === 'image' || p.type === 'video' || p.type === 'clip') return false;
      if (p.dailyVibe && isPostExpired(p.expiresAt)) return true;
      // Text Daily Vibes older than 24h (legacy posts without expiresAt)
      if ((p.type === 'text' || p.dailyVibe) && p.createdAt) {
        const age = Date.now() - new Date(p.createdAt).getTime();
        if (age > 24 * 60 * 60 * 1000) return true;
      }
      return false;
    };
    const tick = () => {
      const next = posts.filter((p) => !isStaleVibe(p));
      if (next.length !== posts.length) {
        dispatch(setFeed(next));
        loadPosts(true);
      }
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
    // loadPosts intentionally remains outside dependencies to avoid resetting
    // the cleanup timer whenever pagination state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, dispatch]);

  useEffect(() => {
    const t = setTimeout(() => setSwipeHint(true), 2000);
    const hide = setTimeout(() => setSwipeHint(false), 6000);
    return () => {
      clearTimeout(t);
      clearTimeout(hide);
    };
  }, []);

  const { ref } = useInView({
    onChange: (inView) => {
      if (inView && hasMore && !loading) loadPosts(false);
    },
  });

  return (
    <div className="relative h-full min-h-0 flex flex-col overflow-hidden">
      <input
        ref={photoFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadPhotoFile(file).catch(() => {});
          e.target.value = '';
        }}
      />
      <input
        ref={clipFileRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setClipUpload({ url: URL.createObjectURL(file), file });
          }
          e.target.value = '';
        }}
      />

      <CreatePlusMenu
        open={createMenuOpen}
        onClose={() => setCreateMenuOpen(false)}
        onStory={() => openCamera('story')}
        onPhotoCamera={() => openCamera('photo')}
        onClipCamera={() => openCamera('clip')}
        onUploadPhoto={() => photoFileRef.current?.click()}
        onUploadClip={() => clipFileRef.current?.click()}
        onDailyVibe={() => {
          scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
          window.setTimeout(() => {
            document.getElementById('daily-vibe-compose')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 200);
          setExpandCreateTrigger((n) => n + 1);
        }}
      />

      {user && cameraEnabled && !cameraOpen && (
        <button
          type="button"
          onClick={() => setCreateMenuOpen(true)}
          className="fixed right-4 bottom-24 z-40 w-14 h-14 rounded-full bg-primary bg-gradient-primary text-black border-2 border-black shadow-btn-yellow flex items-center justify-center hover:shadow-[1px_1px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
          aria-label="Create post, photo, clip or story"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      {clipUpload && (
        <div className="fixed inset-0 z-[95] bg-black/70 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-4 space-y-3">
            <p className="font-semibold text-sm">New clip</p>
            <video src={clipUpload.url} controls className="w-full max-h-64 rounded-xl bg-black object-cover" />
            <ChatBox value={clipCaption} onChange={setClipCaption} placeholder="Add a caption..." multiline rows={2} />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  URL.revokeObjectURL(clipUpload.url);
                  setClipUpload(null);
                  setClipCaption('');
                }}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleClipUpload} loading={clipUploading}>
                Post Clip
              </Button>
            </div>
          </div>
        </div>
      )}

      <StoryCamera
        open={cameraOpen}
        purpose={cameraPurpose}
        onPurposeChange={setCameraPurpose}
        onClose={closeCamera}
        onPosted={() => {
          handleRefreshFeed();
          closeCamera();
          if (cameraPurpose === 'clip') navigate('/clips');
        }}
      />

      <motion.div
        className="relative z-10 flex-1 min-h-0 flex flex-col min-w-0"
        style={{
          boxShadow: swipe.progress > 0 || cameraOpen ? '-8px 0 32px rgba(0,0,0,0.25)' : undefined,
        }}
        animate={{ x: slideX }}
        transition={
          swipe.dragging
            ? { type: 'tween', duration: 0 }
            : { type: 'spring', damping: 32, stiffness: 320 }
        }
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={swipe.onMouseDown}
      >
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain bg-gray-50 dark:bg-surface-dark touch-pan-y scrollbar-hide"
        >
          <div className="sticky top-0 z-20 bg-gray-50/95 dark:bg-surface-dark/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 px-4 md:px-0 pt-1 pb-2">
            <div className="max-w-2xl mx-auto">
              <StoryRing onOpenCamera={() => openCamera('story')} storyRefreshKey={storyRefreshKey} />
            </div>
          </div>

          <div className="max-w-2xl mx-auto space-y-4 relative px-4 md:px-0 pb-28 pt-3">
          {swipeHint && !cameraOpen && (
            <div className="fixed left-3 top-1/2 -translate-y-1/2 z-40 flex items-center gap-1 text-primary animate-pulse pointer-events-none">
              <ChevronRight className="w-5 h-5" />
              <span className="text-xs font-medium">Camera</span>
            </div>
          )}

          {!cameraOpen && (
            <div
              className="fixed left-0 top-0 bottom-0 w-3 z-30 bg-gradient-to-r from-primary/20 to-transparent pointer-events-none"
              aria-hidden
            />
          )}

          <CreatePost onCreated={() => loadPosts(true)} expandTrigger={expandCreateTrigger} />

          {loading && posts.length === 0 ? (
            <>
              <PostCardSkeleton />
              <PostCardSkeleton />
            </>
          ) : posts.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <p className="text-lg font-medium">No posts yet</p>
              <p className="text-sm text-gray-500 mt-1">Be the first to share something!</p>
            </div>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}

          {hasMore && (
            <div ref={ref} className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
