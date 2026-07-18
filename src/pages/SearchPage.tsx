import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, TrendingUp, Hash, UserPlus, Clock, X } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import api from '@/lib/api';

const HISTORY_KEY = 'search:history';
const HISTORY_MAX = 8;

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

interface SearchUser {
  id: string;
  username: string;
  avatar?: string;
  bio?: string;
  isVerified?: boolean;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [posts, setPosts] = useState<{ id: string; content: string; author: { username: string } }[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [suggested, setSuggested] = useState<SearchUser[]>([]);
  const [trendingTags, setTrendingTags] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [history, setHistory] = useState<string[]>(() => loadHistory());

  const rememberQuery = useCallback((raw: string) => {
    const term = raw.trim();
    if (term.length < 2) return;
    setHistory((prev) => {
      const next = [term, ...prev.filter((h) => h.toLowerCase() !== term.toLowerCase())].slice(
        0,
        HISTORY_MAX
      );
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        // ignore storage failures
      }
      return next;
    });
  }, []);

  const removeHistory = useCallback((term: string) => {
    setHistory((prev) => {
      const next = prev.filter((h) => h !== term);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    api
      .get('/api/search/recommendations', { signal: controller.signal })
      .then(({ data }) => {
        setSuggested(data.suggestedUsers || []);
        setTrendingTags(data.trendingTags || []);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setUsers([]);
      setPosts([]);
      setTags([]);
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get('/api/search', {
          params: { q: query },
          signal: controller.signal,
        });
        setUsers(data.users || []);
        setPosts(data.posts || []);
        setTags(data.hashtags || []);
        if ((data.users?.length || 0) + (data.posts?.length || 0) > 0) {
          rememberQuery(query);
        }
      } catch {
        // Cancelled or failed requests leave prior results in place.
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 300);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query, rememberQuery]);

  const handleFollow = async (userId: string) => {
    await api.post(`/api/users/follow/${userId}`);
    setSuggested((prev) => prev.filter((u) => u.id !== userId));
  };

  return (
    <AppShell>
      <div className="space-y-5">
        <h1 className="text-2xl font-bold">Search</h1>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people, posts, hashtags..."
            className="input-field pl-12 py-3.5 text-base"
            autoFocus
          />
        </div>

        {searching && <p className="text-sm text-gray-500 text-center">Searching...</p>}

        {query.length >= 2 ? (
          <div className="space-y-4">
            {users.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-1"><UserPlus className="w-4 h-4" /> People</h2>
                <div className="glass-card divide-y divide-gray-100 dark:divide-gray-800 !p-0">
                  {users.map((u) => (
                    <Link key={u.id} to={`/profile/${u.username}`} className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 active:bg-gray-100 transition-colors">
                      <Avatar src={u.avatar} alt={u.username} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{u.username}{u.isVerified && ' ✓'}</p>
                        {u.bio && <p className="text-sm text-gray-500 truncate">{u.bio}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            {posts.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 mb-2">Posts</h2>
                <div className="space-y-2">
                  {posts.map((p) => (
                    <div key={p.id} className="glass-card p-4">
                      <p className="text-xs text-primary font-medium mb-1">@{p.author?.username}</p>
                      <p className="text-sm line-clamp-2">{p.content}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {tags.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-1"><Hash className="w-4 h-4" /> Hashtags</h2>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button key={tag} onClick={() => setQuery(tag.replace('#', ''))} className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium active:scale-95 transition-transform">
                      {tag}
                    </button>
                  ))}
                </div>
              </section>
            )}
            {users.length === 0 && posts.length === 0 && !searching && (
              <p className="text-center text-gray-500 py-8">No results for &quot;{query}&quot;</p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {history.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-500 flex items-center gap-1">
                    <Clock className="w-4 h-4" /> Recent
                  </h2>
                  <button
                    onClick={clearHistory}
                    className="text-xs text-gray-400 hover:text-primary font-medium"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {history.map((term) => (
                    <span
                      key={term}
                      className="group flex items-center gap-1.5 pl-3 pr-2 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-medium"
                    >
                      <button
                        onClick={() => setQuery(term)}
                        className="active:scale-95 transition-transform"
                      >
                        {term}
                      </button>
                      <button
                        onClick={() => removeHistory(term)}
                        aria-label={`Remove ${term} from history`}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-1"><TrendingUp className="w-4 h-4" /> Trending</h2>
              <div className="flex flex-wrap gap-2">
                {trendingTags.map((tag) => (
                  <button key={tag} onClick={() => setQuery(tag.replace('#', ''))} className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium active:scale-95 transition-transform">
                    {tag}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-gray-500 mb-3">Recommended for you</h2>
              <div className="glass-card divide-y divide-gray-100 dark:divide-gray-800 !p-0">
                {suggested.length === 0 ? (
                  <p className="p-6 text-center text-gray-500 text-sm">No suggestions yet</p>
                ) : (
                  suggested.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 p-4">
                      <Link to={`/profile/${u.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar src={u.avatar} alt={u.username} />
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{u.username}</p>
                          {u.bio && <p className="text-sm text-gray-500 truncate">{u.bio}</p>}
                        </div>
                      </Link>
                      <Button size="sm" onClick={() => handleFollow(u.id)}>Follow</Button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}
