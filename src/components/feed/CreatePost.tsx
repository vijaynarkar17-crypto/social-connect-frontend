import { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Video, Circle, Send } from 'lucide-react';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import ChatBox from '@/components/ui/ChatBox';
import { useAuth } from '@/context/AuthContext';
import api, { resolveAssetUrl } from '@/lib/api';

interface MentionUser {
  id: string;
  username: string;
  avatar?: string;
}

export default function CreatePost({
  onCreated,
  expandTrigger = 0,
}: {
  onCreated?: () => void;
  expandTrigger?: number;
}) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [postType, setPostType] = useState<'text' | 'image' | 'video' | 'story'>('text');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const composeRef = useRef<HTMLDivElement>(null);

  const showActions = expanded || !!content.trim() || !!mediaUrl;

  useEffect(() => {
    if (!expandTrigger) return;
    setExpanded(true);
    window.setTimeout(() => textareaRef.current?.focus(), 100);
  }, [expandTrigger]);

  useEffect(() => {
    if (!mentionQuery || mentionQuery.length < 1) {
      setMentionUsers([]);
      return;
    }
    const t = setTimeout(() => {
      api.get('/api/users/mentions/search', { params: { q: mentionQuery } })
        .then(({ data }) => setMentionUsers(data.users || []))
        .catch(() => setMentionUsers([]));
    }, 200);
    return () => clearTimeout(t);
  }, [mentionQuery]);

  const handleContentChange = (value: string) => {
    setContent(value);
    const cursor = textareaRef.current?.selectionStart ?? value.length;
    const before = value.slice(0, cursor);
    const match = before.match(/@([a-zA-Z0-9_]*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  };

  const insertMention = (username: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const cursor = ta.selectionStart;
    const before = content.slice(0, cursor);
    const after = content.slice(cursor);
    const replaced = before.replace(/@([a-zA-Z0-9_]*)$/, `@${username} `);
    setContent(replaced + after);
    setShowMentions(false);
    setMentionQuery('');
    ta.focus();
  };

  const handleFile = async (file: File, type: 'image' | 'video' | 'story') => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('folder', type === 'story' ? 'stories' : 'posts');
      const { data } = await api.post('/api/posts/upload', form);
      setMediaUrl(data.url);
      setPostType(type === 'story' ? 'story' : data.type === 'video' ? 'video' : 'image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !mediaUrl) return;
    setLoading(true);
    try {
      const type = mediaUrl ? postType : 'text';
      const isDailyVibe = type === 'text' && !mediaUrl;
      await api.post('/api/posts', {
        type,
        content: content.trim(),
        media: mediaUrl ? [mediaUrl] : [],
        ...(isDailyVibe ? { dailyVibe: true } : {}),
      });
      setContent('');
      setMediaUrl(null);
      setPostType('text');
      setExpanded(false);
      onCreated?.();
    } finally {
      setLoading(false);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (!composeRef.current?.contains(document.activeElement)) {
        if (!content.trim() && !mediaUrl) setExpanded(false);
      }
    }, 150);
  };

  if (!user) return null;

  return (
    <Card id="daily-vibe-compose">
      <div className="flex gap-3">
        <Avatar src={user.avatar} alt={user.username} />
        <div
          ref={composeRef}
          className="flex-1 relative cursor-text"
          onClick={() => {
            setExpanded(true);
            textareaRef.current?.focus();
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">Daily Vibe</p>
          <ChatBox
            innerRef={textareaRef}
            value={content}
            onChange={handleContentChange}
            onFocus={() => setExpanded(true)}
            onBlur={handleBlur}
            placeholder="Share your vibe... text-only, auto-deletes in 24h ✨"
            multiline
            rows={showActions ? 2 : 1}
            variant="plain"
            showPicker={showActions}
          />
          {showMentions && mentionUsers.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-20 glass-card !p-1 max-h-48 overflow-y-auto shadow-elevated">
              {mentionUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => insertMention(u.username)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-left"
                >
                  <Avatar src={u.avatar} alt={u.username} size="sm" />
                  <span className="text-sm font-medium">@{u.username}</span>
                </button>
              ))}
            </div>
          )}
          {mediaUrl && (
            <div className="relative mt-2 rounded-xl overflow-hidden max-h-64">
              {postType === 'video' ? (
                <video src={resolveAssetUrl(mediaUrl)} controls className="w-full object-cover max-h-64" />
              ) : (
                <img src={resolveAssetUrl(mediaUrl)} alt="Preview" className="w-full object-cover" loading="lazy" />
              )}
              {content.match(/@[a-zA-Z0-9_]+/g) && (
                <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                  {[...new Set(content.match(/@[a-zA-Z0-9_]+/g))].map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full bg-black/60 text-white text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => { setMediaUrl(null); setPostType('text'); }}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 text-xs"
              >
                ×
              </button>
            </div>
          )}
          {showActions && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 transition-opacity duration-200">
            <div className="flex gap-1">
              <button
                type="button"
                title="Permanent post — stays on your profile"
                onClick={() => { fileRef.current!.accept = 'image/*'; fileRef.current?.click(); }}
                disabled={uploading}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 active:scale-95 transition-transform"
              >
                <ImageIcon className="w-4 h-4" /> Photo
              </button>
              <button
                type="button"
                title="Permanent post — stays on your profile"
                onClick={() => {
                  const v = document.createElement('input');
                  v.type = 'file';
                  v.accept = 'video/*';
                  v.onchange = (e) => {
                    const f = (e.target as HTMLInputElement).files?.[0];
                    if (f) handleFile(f, 'video');
                  };
                  v.click();
                }}
                disabled={uploading}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 active:scale-95 transition-transform"
              >
                <Video className="w-4 h-4" /> Video
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = document.createElement('input');
                  s.type = 'file';
                  s.accept = 'image/*';
                  s.onchange = (e) => {
                    const f = (e.target as HTMLInputElement).files?.[0];
                    if (f) handleFile(f, 'story');
                  };
                  s.click();
                }}
                disabled={uploading}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 active:scale-95 transition-transform"
              >
                <Circle className="w-4 h-4" /> Story
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file, 'image');
                }}
              />
            </div>
            <Button size="sm" onClick={handleSubmit} loading={loading || uploading} disabled={!content.trim() && !mediaUrl}>
              <Send className="w-4 h-4" /> Post
            </Button>
          </div>
          )}
        </div>
      </div>
    </Card>
  );
}
