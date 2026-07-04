import { Link } from 'react-router-dom';
import { Clapperboard, ImageIcon, Film } from 'lucide-react';

const GIF_URL_RE = /(https?:\/\/(?:media\.giphy\.com|media\.tenor\.com|i\.giphy\.com)[^\s]+)/i;

export function isGifUrl(url: string): boolean {
  return GIF_URL_RE.test(url) || /\.gif(\?|$)/i.test(url);
}

export function isGifOnlyMessage(content: string): boolean {
  const trimmed = content.trim();
  return /^https?:\/\/\S+$/i.test(trimmed) && isGifUrl(trimmed);
}

const TOKEN_RE = /(https?:\/\/[^\s]+|@[a-zA-Z0-9_]+|#[a-zA-Z0-9_]+)/g;

export function renderMessageContent(content: string, options?: { invertMention?: boolean }) {
  if (!content) return null;

  const mentionClass = options?.invertMention
    ? 'font-semibold underline underline-offset-2'
    : 'text-primary font-medium hover:underline';

  const parts = content.split(TOKEN_RE);

  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      const username = part.slice(1);
      return (
        <Link key={i} to={`/profile/${username}`} className={mentionClass}>
          {part}
        </Link>
      );
    }
    if (part.startsWith('#')) {
      const tag = part.slice(1);
      return (
        <Link
          key={i}
          to={`/search?q=${encodeURIComponent(tag)}`}
          className={mentionClass}
        >
          {part}
        </Link>
      );
    }
    if (/^https?:\/\//i.test(part) && isGifUrl(part)) {
      return (
        <img
          key={i}
          src={part}
          alt="GIF"
          className="max-w-[220px] max-h-[180px] rounded-xl my-1 block object-cover"
          loading="lazy"
        />
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export interface SharedPostPreview {
  id: string;
  type: string;
  content: string;
  media: string[];
  author?: { username: string; avatar?: string };
}

export function sharedPostLabel(type: string): string {
  if (type === 'clip') return 'Shared a reel';
  if (type === 'story') return 'Shared a story';
  if (type === 'video') return 'Shared a video';
  if (type === 'image') return 'Shared a photo';
  return 'Shared a post';
}

export function SharedPostCard({
  post,
  compact,
  invert,
}: {
  post: SharedPostPreview;
  compact?: boolean;
  invert?: boolean;
}) {
  const label = sharedPostLabel(post.type);
  const href = post.type === 'clip' ? '/clips' : '/home';
  const isVideo = post.type === 'clip' || post.type === 'video';
  const media = post.media?.[0];

  return (
    <Link
      to={href}
      className={`block rounded-xl overflow-hidden border ${
        invert ? 'border-white/25 bg-white/10' : 'border-gray-200 dark:border-gray-700 bg-black/5 dark:bg-black/20'
      } ${compact ? 'max-w-[200px]' : 'w-full'}`}
    >
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide ${
          invert ? 'text-white/90' : 'text-primary'
        }`}
      >
        {post.type === 'clip' ? (
          <Clapperboard className="w-3.5 h-3.5" />
        ) : isVideo ? (
          <Film className="w-3.5 h-3.5" />
        ) : (
          <ImageIcon className="w-3.5 h-3.5" />
        )}
        {label}
        {post.author && (
          <span className={`font-normal normal-case ${invert ? 'text-white/70' : 'text-gray-500'}`}>
            · @{post.author.username}
          </span>
        )}
      </div>
      {media && (
        <div className="relative aspect-[4/5] max-h-40 bg-black">
          {isVideo ? (
            <video src={media} className="w-full h-full object-cover" muted playsInline />
          ) : (
            <img src={media} alt="" className="w-full h-full object-cover" loading="lazy" />
          )}
        </div>
      )}
      {post.content && (
        <p className={`text-xs px-2.5 py-2 line-clamp-2 ${invert ? 'text-white/80' : 'text-gray-600 dark:text-gray-300'}`}>
          {post.content}
        </p>
      )}
    </Link>
  );
}

export function formatInboxPreview(
  content: string,
  sharedPost?: { type: string } | null
): string {
  if (sharedPost) return sharedPostLabel(sharedPost.type);
  if (isGifOnlyMessage(content)) return 'GIF';
  const trimmed = content.trim();
  if (trimmed.length > 60) return `${trimmed.slice(0, 60)}…`;
  return trimmed;
}
