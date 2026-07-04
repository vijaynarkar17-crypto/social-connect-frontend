import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  MoreHorizontal,
  Trash2,
  Pencil,
  Send,
  Link2,
  Flag,
  Eye,
  EyeOff,
  Music,
  AtSign,
  X,
  Check,
} from 'lucide-react';
import api from '@/lib/api';
import ShareSheet from '@/components/ui/ShareSheet';
import ReportFlow from '@/components/shared/ReportFlow';
import type { ReportReasonId } from '@/lib/reportReasons';
import { useAuth } from '@/context/AuthContext';

interface PostMenuProps {
  postId: string;
  authorUsername: string;
  content: string;
  visibility?: string;
  onDeleted?: () => void;
  onEdited?: (content: string) => void;
  onVisibilityChanged?: (v: string) => void;
}

export default function PostMenu({
  postId,
  authorUsername,
  content,
  visibility = 'public',
  onDeleted,
  onEdited,
  onVisibilityChanged,
}: PostMenuProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(content);
  const [saving, setSaving] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isOwner = user?.username === authorUsername;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirmDelete(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await api.delete(`/api/posts/${postId}`);
      onDeleted?.();
    } catch {
      // failed
    } finally {
      setDeleting(false);
      setOpen(false);
      setConfirmDelete(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setEditText(content);
    setOpen(false);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      await api.put(`/api/posts/${postId}`, { content: editText.trim() });
      onEdited?.(editText.trim());
      setEditing(false);
    } catch {
      // failed
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/home?post=${postId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback
    }
    setOpen(false);
  };

  const submitReport = async (reason: ReportReasonId, description: string) => {
    await api.post(`/api/posts/${postId}/report`, { reason, description });
  };

  const toggleVisibility = async () => {
    const next = visibility === 'public' ? 'private' : 'public';
    try {
      await api.put(`/api/posts/${postId}`, { visibility: next });
      onVisibilityChanged?.(next);
    } catch {
      // failed
    }
    setOpen(false);
  };

  const insertMention = () => {
    setEditing(true);
    setEditText(content + ' @');
    setOpen(false);
  };

  const insertMusic = () => {
    setEditing(true);
    setEditText(content + ' 🎵 ');
    setOpen(false);
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => {
            setOpen(!open);
            setConfirmDelete(false);
          }}
          className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg active:scale-90 transition-transform"
          aria-label="Post options"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-1 w-52 z-50 py-1.5 rounded-xl bg-white dark:bg-surface-card-dark shadow-xl border border-gray-200/60 dark:border-gray-700/60"
            >
              {isOwner && (
                <>
                  <MenuItem
                    icon={Pencil}
                    label="Edit post"
                    onClick={handleEdit}
                  />
                  <MenuItem
                    icon={AtSign}
                    label="Add mention / tag"
                    onClick={insertMention}
                  />
                  <MenuItem
                    icon={Music}
                    label="Add music"
                    onClick={insertMusic}
                  />
                  <MenuItem
                    icon={visibility === 'public' ? EyeOff : Eye}
                    label={visibility === 'public' ? 'Make private' : 'Make public'}
                    onClick={toggleVisibility}
                  />
                </>
              )}

              <MenuItem
                icon={Send}
                label="Send to user"
                onClick={() => {
                  setOpen(false);
                  setShareOpen(true);
                }}
              />
              <MenuItem
                icon={Link2}
                label={copied ? 'Copied!' : 'Copy link'}
                onClick={handleCopyLink}
                highlight={copied}
              />

              <div className="my-1 border-t border-gray-100 dark:border-gray-800" />

              {isOwner && (
                <MenuItem
                  icon={Trash2}
                  label={confirmDelete ? 'Tap again to confirm' : 'Delete post'}
                  onClick={handleDelete}
                  danger
                  loading={deleting}
                />
              )}
              {!isOwner && (
                <MenuItem
                  icon={Flag}
                  label="Report"
                  onClick={() => {
                    setOpen(false);
                    setReportOpen(true);
                  }}
                  danger
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        postId={postId}
      />

      <ReportFlow
        open={reportOpen}
        title="Report post"
        onClose={() => setReportOpen(false)}
        onSubmit={submitReport}
      />

      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.92 }}
              className="w-full max-w-md bg-white dark:bg-surface-card-dark rounded-2xl shadow-2xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Edit post</h3>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Use <span className="font-medium text-primary">@username</span> to mention, <span className="font-medium text-primary">#tag</span> to add hashtags
              </p>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={4}
                className="w-full input-field text-sm resize-none"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={saving || editText.trim() === content.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary bg-gradient-primary text-white disabled:opacity-50 active:scale-95 transition-transform flex items-center justify-center gap-1.5"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Save
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
  highlight,
  loading,
  disabled,
}: {
  icon: typeof Trash2;
  label: string;
  onClick: () => void;
  danger?: boolean;
  highlight?: boolean;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
        danger
          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
          : highlight
            ? 'text-emerald-600'
            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/60'
      }`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
      ) : (
        <Icon className="w-4 h-4" />
      )}
      {label}
    </button>
  );
}
