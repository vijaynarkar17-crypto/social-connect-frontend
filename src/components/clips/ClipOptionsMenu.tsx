import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MoreVertical, Trash2, Flag } from 'lucide-react';
import api from '@/lib/api';
import ReportFlow from '@/components/shared/ReportFlow';
import type { ReportReasonId } from '@/lib/reportReasons';
import { useAuth } from '@/context/AuthContext';

interface ClipOptionsMenuProps {
  postId: string;
  authorUsername: string;
  demo?: boolean;
  onDeleted?: () => void;
}

export default function ClipOptionsMenu({
  postId,
  authorUsername,
  demo = false,
  onDeleted,
}: ClipOptionsMenuProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
    if (demo) {
      setOpen(false);
      return;
    }
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

  const submitReport = async (reason: ReportReasonId, description: string) => {
    if (demo) return;
    await api.post(`/api/posts/${postId}/report`, { reason, description });
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
          className="flex w-11 flex-col items-center gap-0.5 text-white active:scale-90 transition-transform"
          aria-label="Clip options"
        >
          <div className="w-11 h-11 shrink-0 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
            <MoreVertical className="w-5 h-5" />
          </div>
          <span className="min-h-[14px]" aria-hidden />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 8 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 bottom-full mb-2 w-44 z-50 py-1 rounded-xl bg-gray-900/95 backdrop-blur-md shadow-xl border border-white/10"
            >
              {isOwner ? (
                <MenuItem
                  icon={Trash2}
                  label={confirmDelete ? 'Tap again to confirm' : 'Delete'}
                  onClick={handleDelete}
                  danger
                  loading={deleting}
                />
              ) : (
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

      <ReportFlow
        open={reportOpen}
        title="Report clip"
        onClose={() => setReportOpen(false)}
        onSubmit={submitReport}
      />
    </>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
  loading,
}: {
  icon: typeof Trash2;
  label: string;
  onClick: () => void;
  danger?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50 ${
        danger
          ? 'text-red-400 hover:bg-red-500/10'
          : 'text-white hover:bg-white/10'
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
