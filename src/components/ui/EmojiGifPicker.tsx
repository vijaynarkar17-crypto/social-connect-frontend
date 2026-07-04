import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { EMOJI_CATEGORIES } from '@/lib/emojis';
import api from '@/lib/api';

interface GifItem {
  id: string;
  url: string;
  title: string;
}

interface EmojiGifPickerProps {
  open: boolean;
  initialTab?: 'emoji' | 'gif';
  onClose: () => void;
  onEmoji: (emoji: string) => void;
  onGif: (url: string) => void;
}

export default function EmojiGifPicker({ open, initialTab = 'emoji', onClose, onEmoji, onGif }: EmojiGifPickerProps) {
  const [tab, setTab] = useState<'emoji' | 'gif'>(initialTab);
  const [category, setCategory] = useState('smileys');
  const [gifQuery, setGifQuery] = useState('');
  const [gifs, setGifs] = useState<GifItem[]>([]);
  const [loadingGifs, setLoadingGifs] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || tab !== 'gif') return;
    setLoadingGifs(true);
    const t = setTimeout(() => {
      const endpoint = gifQuery.trim()
        ? `/api/gifs/search?q=${encodeURIComponent(gifQuery.trim())}`
        : '/api/gifs/trending';
      api.get(endpoint)
        .then(({ data }) => setGifs(data.gifs || []))
        .catch(() => setGifs([]))
        .finally(() => setLoadingGifs(false));
    }, gifQuery ? 300 : 0);
    return () => clearTimeout(t);
  }, [open, tab, gifQuery]);

  if (!open) return null;

  const activeCategory = EMOJI_CATEGORIES.find((c) => c.id === category) || EMOJI_CATEGORIES[0];

  return (
    <div
      ref={panelRef}
      className="absolute bottom-full left-0 mb-2 z-50 w-[min(100vw-2rem,320px)] glass-card !p-0 shadow-elevated overflow-hidden"
    >
      <div className="flex border-b border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={() => setTab('emoji')}
          className={`flex-1 py-2.5 text-sm font-medium ${tab === 'emoji' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
        >
          Emoji
        </button>
        <button
          type="button"
          onClick={() => setTab('gif')}
          className={`flex-1 py-2.5 text-sm font-medium ${tab === 'gif' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
        >
          GIF
        </button>
        <button type="button" onClick={onClose} className="px-3 text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      {tab === 'emoji' ? (
        <>
          <div className="flex gap-1 p-2 border-b border-gray-100 dark:border-gray-800 overflow-x-auto scrollbar-hide">
            {EMOJI_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`flex-shrink-0 w-9 h-9 rounded-lg text-lg flex items-center justify-center ${
                  category === c.id ? 'bg-primary/10' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-0.5 p-2 max-h-52 overflow-y-auto">
            {activeCategory.emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => { onEmoji(emoji); onClose(); }}
                className="w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-xl flex items-center justify-center active:scale-90 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="p-2 border-b border-gray-100 dark:border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={gifQuery}
                onChange={(e) => setGifQuery(e.target.value)}
                placeholder="Search GIFs..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 p-2 max-h-52 overflow-y-auto">
            {loadingGifs ? (
              <div className="col-span-2 flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : gifs.length === 0 ? (
              <p className="col-span-2 text-center text-sm text-gray-500 py-8">No GIFs found</p>
            ) : (
              gifs.map((gif) => (
                <button
                  key={gif.id}
                  type="button"
                  onClick={() => { onGif(gif.url); onClose(); }}
                  className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 hover:ring-2 hover:ring-primary active:scale-95 transition-all"
                  title={gif.title}
                >
                  <img src={gif.url} alt={gif.title} className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
