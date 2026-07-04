import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MoreHorizontal, Share2, Link2, Flag } from 'lucide-react';
import api from '@/lib/api';
import ReportFlow from '@/components/shared/ReportFlow';
import type { ReportReasonId } from '@/lib/reportReasons';

interface ProfileOptionsMenuProps {
  userId: string;
  username: string;
}

export default function ProfileOptionsMenu({ userId, username }: ProfileOptionsMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'menu' | 'share'>('menu');
  const [reportOpen, setReportOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUsers, setShareUsers] = useState<{ id: string; username: string; avatar?: string }[]>([]);
  const [shareLoading, setShareLoading] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const profileUrl = `${window.location.origin}/profile/${username}`;
  const shareText = `Check out @${username}'s profile on SocialConnect`;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setView('menu');
      setCopied(false);
      setSentIds(new Set());
    }
  }, [open]);

  useEffect(() => {
    if (view !== 'share' || !open) return;
    setShareLoading(true);
    api
      .get('/api/users/me/share-contacts')
      .then(({ data }) => setShareUsers(data.users || []))
      .catch(() => setShareUsers([]))
      .finally(() => setShareLoading(false));
  }, [view, open]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 800);
    } catch {
      setOpen(false);
    }
  };

  const submitReport = async (reason: ReportReasonId, description: string) => {
    await api.post(`/api/users/report/${userId}`, { reason, description });
  };

  const sendShare = async (recipientId: string) => {
    if (sentIds.has(recipientId)) return;
    try {
      await api.post('/api/messages', {
        recipientId,
        content: `${shareText}\n${profileUrl}`,
      });
      setSentIds((prev) => new Set([...prev, recipientId]));
    } catch {
      // ignore
    }
  };

  return (
    <div ref={ref} className="relative z-20">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white active:scale-90 transition-transform"
        aria-label="Profile options"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-white dark:bg-surface-card-dark shadow-xl border border-gray-200/70 dark:border-gray-700/70 py-1 overflow-hidden"
          >
            {view === 'menu' && (
              <>
                <MenuItem
                  icon={Share2}
                  label="Share profile"
                  onClick={() => setView('share')}
                />
                <MenuItem
                  icon={Link2}
                  label={copied ? 'Copied!' : 'Copy link'}
                  onClick={copyLink}
                  highlight={copied}
                />
                <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
                <MenuItem
                  icon={Flag}
                  label="Report"
                  danger
                  onClick={() => {
                    setOpen(false);
                    setReportOpen(true);
                  }}
                />
              </>
            )}

            {view === 'share' && (
              <div className="p-2 max-h-56 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => setView('menu')}
                  className="flex items-center gap-1.5 px-1 py-1 text-xs text-gray-500 mb-1"
                >
                  ← Back
                </button>
                <p className="px-1 pb-2 text-xs font-semibold">Send to</p>
                {shareLoading ? (
                  <p className="text-xs text-gray-500 px-1 py-2">Loading…</p>
                ) : shareUsers.length === 0 ? (
                  <p className="text-xs text-gray-500 px-1 py-2">Follow people to share</p>
                ) : (
                  shareUsers.slice(0, 12).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => sendShare(u.id)}
                      className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-left"
                    >
                      <span className="text-xs font-medium truncate">@{u.username}</span>
                      <span className="text-[10px] text-primary shrink-0 ml-2">
                        {sentIds.has(u.id) ? 'Sent ✓' : 'Send'}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ReportFlow
        open={reportOpen}
        title={`Report @${username}`}
        onClose={() => setReportOpen(false)}
        onSubmit={submitReport}
      />
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
  highlight,
}: {
  icon: typeof Share2;
  label: string;
  onClick: () => void;
  danger?: boolean;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
        danger ? 'text-red-500' : highlight ? 'text-green-600' : 'text-gray-800 dark:text-gray-100'
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </button>
  );
}
