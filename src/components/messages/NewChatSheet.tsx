import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, Lock, MessageCircle } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import api from '@/lib/api';

export interface ChatContact {
  id: string;
  username: string;
  avatar?: string;
  isVerified?: boolean;
  isPrivate?: boolean;
}

interface NewChatSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (user: ChatContact) => void;
}

export default function NewChatSheet({ open, onClose, onSelect }: NewChatSheetProps) {
  const [tab, setTab] = useState<'following' | 'followers'>('following');
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<ChatContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [accessMap, setAccessMap] = useState<
    Record<string, { canChat: boolean; needsRequest: boolean; pendingOutgoing: boolean }>
  >({});

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tab });
      if (query.trim()) params.set('q', query.trim());
      const { data } = await api.get(`/api/messages/search?${params}`);
      const list: ChatContact[] = data.users || [];
      setUsers(list);

      const accessEntries = await Promise.all(
        list.map(async (u) => {
          try {
            const { data: access } = await api.get(`/api/messages/can-chat/${u.id}`);
            return [u.id, access] as const;
          } catch {
            return [u.id, { canChat: false, needsRequest: true, pendingOutgoing: false }] as const;
          }
        })
      );
      setAccessMap(Object.fromEntries(accessEntries));
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [tab, query]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setTab('following');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(loadUsers, query ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [open, loadUsers, query, tab]);

  const handleRequest = async (user: ChatContact) => {
    setRequestingId(user.id);
    try {
      await api.post('/api/messages/chat-request', { recipientId: user.id });
      setAccessMap((prev) => ({
        ...prev,
        [user.id]: { canChat: false, needsRequest: false, pendingOutgoing: true },
      }));
    } finally {
      setRequestingId(null);
    }
  };

  const pickUser = (user: ChatContact) => {
    onSelect(user);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-label="Close"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-[121] max-h-[85vh] rounded-t-3xl bg-white dark:bg-surface-card-dark shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h3 className="font-semibold text-lg">Find someone</h3>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search following or followers..."
                  className="w-full input-field pl-10 py-2.5 text-sm"
                />
              </div>
            </div>

            <div className="flex px-4 gap-1 pb-3">
              {(['following', 'followers'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    tab === t
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-6">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : users.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-10 px-4">
                  No {tab} found{query ? ` for "${query}"` : ''}.
                </p>
              ) : (
                <ul className="space-y-0.5">
                  {users.map((user) => {
                    const access = accessMap[user.id];
                    const canChat = access?.canChat;
                    const pending = access?.pendingOutgoing;
                    const needsRequest = access?.needsRequest && user.isPrivate;

                    return (
                      <li key={user.id}>
                        <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <Avatar src={user.avatar} alt={user.username} size="md" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate flex items-center gap-1">
                              {user.username}
                              {user.isPrivate && <Lock className="w-3 h-3 text-gray-400" />}
                            </p>
                            <p className="text-[11px] text-gray-500">
                              {canChat
                                ? 'Tap to message'
                                : pending
                                  ? 'Request pending'
                                  : user.isPrivate
                                    ? 'Private — request to chat'
                                    : 'Public account'}
                            </p>
                          </div>
                          {canChat ? (
                            <button
                              type="button"
                              onClick={() => pickUser(user)}
                              className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center active:scale-95"
                              aria-label={`Message ${user.username}`}
                            >
                              <MessageCircle className="w-5 h-5" />
                            </button>
                          ) : needsRequest && !pending ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              loading={requestingId === user.id}
                              onClick={() => handleRequest(user)}
                              className="text-xs px-2.5"
                            >
                              Request
                            </Button>
                          ) : pending ? (
                            <span className="text-[10px] font-semibold text-amber-600 px-2">Pending</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => pickUser(user)}
                              className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center"
                            >
                              <MessageCircle className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
