import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Bookmark, Music2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import ChatBox from '@/components/ui/ChatBox';
import PostMenu from '@/components/feed/PostMenu';
import ShareSheet from '@/components/ui/ShareSheet';
import api, { resolveAssetUrl } from '@/lib/api';
import { formatDistanceToNow } from '@/lib/utils';
import { formatCount } from '@/lib/postUtils';
import { renderMessageContent } from '@/lib/messageContent';
import { expiresInLabel, isPostExpired } from '@/lib/ephemeralPost';

export interface TaggedUser {
  id: string;
  username: string;
  avatar?: string;
}

export interface Post {
  id: string;
  type: string;
  content: string;
  media: string[];
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked: boolean;
  createdAt: string;
  visibility?: string;
  expiresAt?: string;
  dailyVibe?: boolean;
  audio?: string;
  author: { username: string; avatar?: string; isVerified?: boolean };
  taggedUsers?: TaggedUser[];
}

export default function PostCard({
  post,
  defaultSaved = false,
  onSaveChange,
  onDeleted,
}: {
  post: Post;
  defaultSaved?: boolean;
  onSaveChange?: (saved: boolean) => void;
  onDeleted?: () => void;
}) {
  const [liked, setLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [shareCount, setShareCount] = useState(post.shareCount ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<{ id: string; content: string; author: { username: string; avatar?: string } }[]>([]);
  const [commentText, setCommentText] = useState('');
  const [saved, setSaved] = useState(defaultSaved);
  const [, setShared] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [postContent, setPostContent] = useState(post.content);
  const [visibility, setVisibility] = useState(post.visibility || 'public');
  const [deleted, setDeleted] = useState(false);
  const [expired, setExpired] = useState(() => post.dailyVibe && isPostExpired(post.expiresAt));
  const [mediaBroken, setMediaBroken] = useState(false);

  const mediaUrl = resolveAssetUrl(post.media?.[0]);
  const showMedia = Boolean(mediaUrl) && !mediaBroken;

  useEffect(() => {
    setMediaBroken(false);
  }, [mediaUrl]);

  useEffect(() => {
    if (!post.dailyVibe || !post.expiresAt) return;
    const check = () => {
      if (isPostExpired(post.expiresAt)) {
        setExpired(true);
        onDeleted?.();
      }
    };
    check();
    const id = window.setInterval(check, 30_000);
    return () => window.clearInterval(id);
  }, [post.dailyVibe, post.expiresAt, onDeleted]);

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => (next ? c + 1 : c - 1));
    try {
      const { data } = await api.post(`/api/posts/${post.id}/like`);
      setLikeCount(data.likeCount);
      setLiked(data.isLiked);
    } catch {
      setLiked(liked);
      setLikeCount(post.likeCount);
    }
  };

  const loadComments = async () => {
    const { data } = await api.get(`/api/posts/${post.id}/comments`);
    setComments(data.comments);
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    await api.post(`/api/posts/${post.id}/comment`, { content: commentText });
    setCommentText('');
    setCommentCount((c) => c + 1);
    await loadComments();
  };

  const handleShare = () => {
    setShareSheetOpen(true);
  };

  const handleSave = async () => {
    const next = !saved;
    setSaved(next);
    try {
      const { data } = await api.post(`/api/posts/${post.id}/save`);
      setSaved(data.saved);
      onSaveChange?.(data.saved);
    } catch {
      setSaved(saved);
    }
  };

  if (deleted || expired) return null;

  // Broken image/video posts (dead media) — don't show empty cards with stray lines
  const isMediaPost = post.type === 'image' || post.type === 'video';
  if (isMediaPost && !showMedia) return null;

  const tags = post.taggedUsers?.length
    ? post.taggedUsers
    : [...new Set((postContent.match(/@[a-zA-Z0-9_]+/g) || []))].map((t) => ({ username: t.slice(1) }));

  return (
    <Card id={`post-${post.id}`} className="scroll-mt-24 transition-shadow duration-500 overflow-hidden">
      <div className="flex items-start justify-between mb-3">
        <Link to={`/profile/${post.author.username}`} className="flex items-center gap-3">
          <Avatar src={post.author.avatar} alt={post.author.username} />
          <div>
            <p className="font-semibold text-sm hover:text-primary">
              {post.author.username}
              {post.author.isVerified && <span className="ml-1 text-accent text-xs">✓</span>}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">{formatDistanceToNow(post.createdAt)}</span>
              {post.dailyVibe && post.expiresAt && (
                <>
                  <span className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[9px] font-bold uppercase tracking-wide">
                    Daily Vibe
                  </span>
                  <span className="text-[10px] text-purple-400 font-medium">
                    {expiresInLabel(post.expiresAt)}
                  </span>
                </>
              )}
            </div>
          </div>
        </Link>
        <PostMenu
          postId={post.id}
          authorUsername={post.author.username}
          content={postContent}
          visibility={visibility}
          onDeleted={() => {
            setDeleted(true);
            onDeleted?.();
          }}
          onEdited={(newContent) => setPostContent(newContent)}
          onVisibilityChanged={(v) => setVisibility(v)}
        />
      </div>

      {postContent && (
        <p className="text-sm mb-3 whitespace-pre-wrap">{renderMessageContent(postContent)}</p>
      )}

      {post.dailyVibe && post.audio && (
        <div className="flex items-center gap-2 mb-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/40">
          <Music2 className="w-4 h-4 text-purple-500 shrink-0" />
          <audio src={resolveAssetUrl(post.audio)} controls className="flex-1 h-8" />
        </div>
      )}

      {showMedia && (
        <div className="relative rounded-xl overflow-hidden mb-3 bg-gray-100 dark:bg-gray-800">
          {post.type === 'video' ? (
            <video src={mediaUrl} controls className="w-full object-cover max-h-96 bg-black" />
          ) : (
            <img
              src={mediaUrl}
              alt=""
              className="w-full object-cover max-h-96 block"
              loading="lazy"
              onError={() => setMediaBroken(true)}
            />
          )}
          {tags.length > 0 && (
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5 max-w-[80%]">
              {tags.map((t) => (
                <Link
                  key={t.username}
                  to={`/profile/${t.username}`}
                  className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur text-white text-xs font-medium hover:bg-black/80 transition-colors"
                >
                  @{t.username}
                </Link>
              ))}
            </div>
          )}
          {visibility === 'private' && (
            <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-gray-900/70 text-white text-[10px] font-medium">
              Private
            </span>
          )}
          {post.type === 'story' && (
            <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-pink-500 text-white text-xs font-medium">
              Story
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-1 pt-2 border-t border-gray-100 dark:border-gray-800">
        <ActionBtn
          icon={Heart}
          label="Like"
          count={likeCount}
          active={liked}
          activeClass="text-pink-500"
          onClick={handleLike}
          filled={liked}
        />
        <ActionBtn
          icon={MessageCircle}
          label="Comment"
          count={commentCount}
          onClick={() => { setShowComments(!showComments); if (!showComments) loadComments(); }}
        />
        <ActionBtn
          icon={Share2}
          label="Share"
          count={shareCount}
          onClick={handleShare}
          active={shareSheetOpen}
          activeClass="text-primary"
        />
        <button onClick={handleSave} className={`ml-auto p-2 rounded-xl active:scale-90 transition-transform ${saved ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}>
          <Bookmark className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
        </button>
      </div>

      {showComments && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-3">
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
              placeholder="Write a comment..."
            />
            <button onClick={handleComment} className="px-4 py-2 rounded-xl bg-primary bg-gradient-primary text-white text-sm active:scale-95 transition-transform shrink-0 mb-7">
              Post
            </button>
          </div>
        </div>
      )}

      <ShareSheet
        open={shareSheetOpen}
        onClose={() => setShareSheetOpen(false)}
        postId={post.id}
        postPreview={postContent.slice(0, 100)}
        onShared={(count) => {
          setShareCount(count);
          setShared(true);
          setTimeout(() => setShared(false), 2000);
        }}
      />
    </Card>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  count,
  onClick,
  active,
  activeClass = 'text-primary',
  filled,
}: {
  icon: typeof Heart;
  label: string;
  count?: number;
  onClick?: () => void;
  active?: boolean;
  activeClass?: string;
  filled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-xs active:scale-95 transition-all ${
        active ? activeClass : 'text-gray-500 hover:text-primary'
      }`}
    >
      <Icon className={`w-5 h-5 ${filled ? 'fill-current' : ''}`} />
      <span className="font-medium">{formatCount(count ?? 0)}</span>
      <span className="text-[10px] opacity-70">{label}</span>
    </button>
  );
}
