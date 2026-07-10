import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Music2, Play, Pause, Bookmark, X } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import ChatBox from '@/components/ui/ChatBox';
import ShareSheet from '@/components/ui/ShareSheet';
import api, { resolveAssetUrl } from '@/lib/api';
import { formatCount } from '@/lib/postUtils';
import { renderMessageContent } from '@/lib/messageContent';

export interface Clip {
  id: string;
  content: string;
  media: string[];
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked: boolean;
  createdAt: string;
  author: { username: string; avatar?: string; isVerified?: boolean };
}

export default function ClipCard({
  clip,
  onUpdate,
  defaultSaved = false,
  onSaveChange,
  fullscreen = false,
  isActive = false,
  demo = false,
}: {
  clip: Clip;
  onUpdate?: () => void;
  defaultSaved?: boolean;
  onSaveChange?: (saved: boolean) => void;
  fullscreen?: boolean;
  isActive?: boolean;
  demo?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [liked, setLiked] = useState(clip.isLiked);
  const [likeCount, setLikeCount] = useState(clip.likeCount);
  const [commentCount, setCommentCount] = useState(clip.commentCount);
  const [shareCount, setShareCount] = useState(clip.shareCount);
  const [showComments, setShowComments] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [comments, setComments] = useState<{ id: string; content: string; author: { username: string; avatar?: string } }[]>([]);
  const [commentText, setCommentText] = useState('');
  const [saved, setSaved] = useState(defaultSaved);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !clip.media[0]) return;
    if (fullscreen && isActive) {
      video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else if (fullscreen && !isActive) {
      video.pause();
      video.currentTime = 0;
      setPlaying(false);
    }
  }, [fullscreen, isActive, clip.media]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => (next ? c + 1 : c - 1));
    if (demo) return;
    try {
      const { data } = await api.post(`/api/posts/${clip.id}/like`);
      setLikeCount(data.likeCount);
      setLiked(data.isLiked);
    } catch {
      setLiked(liked);
      setLikeCount(clip.likeCount);
    }
  };

  const loadComments = async () => {
    if (demo) {
      setComments([]);
      return;
    }
    const { data } = await api.get(`/api/posts/${clip.id}/comments`);
    setComments(data.comments);
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    if (demo) {
      setCommentText('');
      setCommentCount((c) => c + 1);
      return;
    }
    await api.post(`/api/posts/${clip.id}/comment`, { content: commentText });
    setCommentText('');
    setCommentCount((c) => c + 1);
    await loadComments();
    onUpdate?.();
  };

  const handleSave = async () => {
    const next = !saved;
    setSaved(next);
    if (demo) {
      onSaveChange?.(next);
      return;
    }
    try {
      const { data } = await api.post(`/api/posts/${clip.id}/save`);
      setSaved(data.saved);
      onSaveChange?.(data.saved);
    } catch {
      setSaved(saved);
    }
  };

  const videoBlock = (
    <div
      className={
        fullscreen
          ? 'relative w-full h-full bg-black flex items-center justify-center'
          : 'relative aspect-[9/14] max-h-[480px] bg-black flex items-center justify-center'
      }
    >
      {clip.media[0] ? (
        <video
          ref={videoRef}
          src={resolveAssetUrl(clip.media[0])}
          loop
          playsInline
          muted={false}
          className="w-full h-full object-cover"
          onClick={togglePlay}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/30 via-accent/20 to-pink-500/30" />
      )}

      {!playing && clip.media[0] && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20"
        >
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border border-white/30">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        </button>
      )}

      {playing && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute top-3 left-3 w-9 h-9 rounded-full bg-black/40 flex items-center justify-center text-white"
        >
          <Pause className="w-4 h-4" />
        </button>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4 pr-20 bg-gradient-to-t from-black/80 to-transparent text-white pointer-events-none">
        <div className="flex items-center gap-2 mb-2 pointer-events-auto">
          <Link to={`/profile/${clip.author.username}`}>
            <Avatar src={clip.author.avatar} alt={clip.author.username} size="sm" />
          </Link>
          <Link to={`/profile/${clip.author.username}`} className="username font-semibold text-sm hover:underline">
            {clip.author.username}
            {clip.author.isVerified && <span className="ml-1 text-accent text-xs">✓</span>}
          </Link>
        </div>
        {clip.content && <p className="text-sm line-clamp-3">{clip.content}</p>}
        <div className="flex items-center gap-1 mt-1 text-xs text-white/70">
          <Music2 className="w-3 h-3" /> Original audio
        </div>
      </div>

      <div
        className={`absolute right-3 z-20 flex flex-col-reverse items-center gap-3 ${
          fullscreen ? 'bottom-8' : 'bottom-6'
        }`}
      >
        <ActionBtn icon={Bookmark} onClick={handleSave} active={saved} filled={saved} />
        <ActionBtn icon={Share2} count={shareCount} onClick={() => (demo ? setShareCount((c) => c + 1) : setShareOpen(true))} />
        <ActionBtn
          icon={MessageCircle}
          count={commentCount}
          onClick={() => {
            setShowComments(!showComments);
            if (!showComments) loadComments();
          }}
        />
        <ActionBtn icon={Heart} count={likeCount} active={liked} onClick={handleLike} filled={liked} />
      </div>
    </div>
  );

  const commentsPanel = showComments && (
  fullscreen ? (
    <div className="absolute inset-x-0 bottom-0 z-20 max-h-[50%] bg-white dark:bg-surface-card-dark rounded-t-2xl flex flex-col shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <p className="font-semibold text-sm">Comments</p>
        <button type="button" onClick={() => setShowComments(false)} className="p-1">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-2">
            <Avatar src={c.author.avatar} alt={c.author.username} size="sm" />
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2 flex-1">
              <p className="text-xs font-semibold username">{c.author.username}</p>
              <p className="text-sm">{renderMessageContent(c.content)}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-gray-100 dark:border-gray-800 flex gap-2 items-end">
        <ChatBox
          className="flex-1"
          value={commentText}
          onChange={setCommentText}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleComment()}
          placeholder="Add a comment..."
        />
        <button onClick={handleComment} className="px-4 py-2 rounded-xl bg-primary bg-gradient-primary text-white text-sm shrink-0 mb-7">
          Post
        </button>
      </div>
    </div>
  ) : (
    <div className="p-4 space-y-3 border-t border-gray-100 dark:border-gray-800">
      {comments.map((c) => (
        <div key={c.id} className="flex gap-2">
          <Avatar src={c.author.avatar} alt={c.author.username} size="sm" />
          <div className="bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2 flex-1">
            <p className="text-xs font-semibold">{c.author.username}</p>
            <p className="text-sm">{renderMessageContent(c.content)}</p>
          </div>
        </div>
      ))}
      <div className="flex gap-2 items-end">
        <ChatBox
          className="flex-1"
          value={commentText}
          onChange={setCommentText}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleComment()}
          placeholder="Add a comment..."
        />
        <button onClick={handleComment} className="px-4 py-2 rounded-xl bg-primary bg-gradient-primary text-white text-sm shrink-0 mb-7">
          Post
        </button>
      </div>
    </div>
  )
  );

  if (fullscreen) {
    return (
      <div className="relative w-full h-full bg-black">
        {videoBlock}
        {commentsPanel}
        {!demo && (
        <ShareSheet
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          postId={clip.id}
          postPreview={clip.content || `Clip by ${clip.author.username}`}
          onShared={setShareCount}
        />
        )}
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden !p-0">
      {videoBlock}
      {commentsPanel}
      {!demo && (
      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        postId={clip.id}
        postPreview={clip.content || `Clip by ${clip.author.username}`}
        onShared={setShareCount}
      />
      )}
    </div>
  );
}

function ActionBtn({
  icon: Icon,
  count,
  onClick,
  active,
  filled,
}: {
  icon: typeof Heart;
  count?: number;
  onClick?: () => void;
  active?: boolean;
  filled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-11 flex-col items-center gap-0.5 text-white active:scale-90 transition-transform ${active ? 'text-pink-400' : ''}`}
    >
      <div className="w-11 h-11 shrink-0 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
        <Icon className={`w-5 h-5 ${filled ? 'fill-current' : ''}`} />
      </div>
      {count !== undefined ? (
        <span className="text-xs font-medium leading-none min-h-[14px]">{formatCount(count)}</span>
      ) : (
        <span className="min-h-[14px]" aria-hidden />
      )}
    </button>
  );
}
