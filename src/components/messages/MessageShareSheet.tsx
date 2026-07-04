import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Search, Send, X } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import api from '@/lib/api';
import type { ChatMessageData } from '@/components/messages/ChatMessageBubble';

interface ShareUser {
  id: string;
  username: string;
  avatar?: string;
  isVerified?: boolean;
}

interface MessageShareSheetProps {
  message: ChatMessageData | null;
  onClose: () => void;
}

export default function MessageShareSheet({ message, onClose }: MessageShareSheetProps) {
  const open = !!message;
  const [users, setUsers] = useState<ShareUser[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const loadUsers = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const params = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
      const [contactsRes, chatRes] = await Promise.all([
        api.get(`/api/users/me/share-contacts${params}`),
        api.get(`/api/messages/contacts${params}`).catch(() => ({ data: { users: [] } })),
      ]);
      const seen = new Set<string>();
      const merged: ShareUser[] = [];
      for (const u of [...(contactsRes.data.users || []), ...(chatRes.data.users || [])]) {
        if (seen.has(u.id)) continue;
        seen.add(u.id);
        merged.push(u);
      }
      setUsers(merged);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setSentIds(new Set());
    loadUsers('');
  }, [open, loadUsers]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => loadUsers(query), query ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [open, query, loadUsers]);

  const handleSend = async (user: ShareUser) => {
    if (!message || sendingId || sentIds.has(user.id)) return;
    setSendingId(user.id);
    try {
      await api.post('/api/messages', {
        recipientId: user.id,
        content: message.content.trim() || undefined,
        sharedPostId: message.sharedPost?.id,
      });
      setSentIds((prev) => new Set([...prev, user.id]));
    } finally {
      setSendingId(null);
    }
  };

  const preview = message?.content.trim().slice(0, 80) || (message?.sharedPost ? 'Shared post' : 'Message');

  return (
    <AnimatePresence>
      {open && message && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-label="Close share"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-[121] max-h-[75vh] rounded-t-3xl bg-white dark:bg-surface-card-dark shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-bold">Forward message</h2>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-[260px]">{preview}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search users..."
                  className="w-full py-2.5 pl-10 pr-4 rounded-xl bg-gray-100 dark:bg-gray-800 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-6 scrollbar-hide">
              {loading && users.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-8">Loading users...</p>
              ) : users.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-8">No users found</p>
              ) : (
                <div className="space-y-1">
                  {users.map((user) => {
                    const sent = sentIds.has(user.id);
                    const sending = sendingId === user.id;
                    return (
                      <div key={user.id} className="group w-full flex items-center gap-3 p-3 rounded-2xl">
                        <Avatar src={user.avatar} alt={user.username} />
                        <div className="flex-1 text-left min-w-0">
                          <p className="username text-sm font-medium truncate">{user.username}</p>
                          <p className="text-xs text-gray-500">{sent ? 'Sent' : sending ? 'Sending...' : 'Tap send'}</p>
                        </div>
                        <button
                          type="button"
                          disabled={sending || sent}
                          onClick={() => handleSend(user)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95 disabled:opacity-80 ${
                            sent ? 'bg-green-500 text-white' : 'bg-primary bg-gradient-primary text-white'
                          }`}
                        >
                          {sent ? <Check className="w-5 h-5" /> : <Send className="w-4 h-4" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
