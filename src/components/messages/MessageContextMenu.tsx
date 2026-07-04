import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Trash2, Share2, Circle, Flag, Pencil } from 'lucide-react';
import api from '@/lib/api';
import ReportFlow from '@/components/shared/ReportFlow';
import type { ReportReasonId } from '@/lib/reportReasons';
import type { ChatMessageData } from '@/components/messages/ChatMessageBubble';

export interface MessageMenuAnchor {
  top: number;
  left: number;
  right: number;
  bottom: number;
  isMine: boolean;
}

interface MessageContextMenuProps {
  message: ChatMessageData | null;
  anchor: MessageMenuAnchor | null;
  onClose: () => void;
  onDelete: (message: ChatMessageData) => void;
  onEdit: (message: ChatMessageData) => void;
  onShare: (message: ChatMessageData) => void;
  onStory: (message: ChatMessageData) => void;
  onReported?: (message: ChatMessageData) => void;
}

function canEditMessage(message: ChatMessageData) {
  if (!message.isMine) return false;
  const text = message.content.trim();
  if (!text) return false;
  const isBoilerplateShare = /^Sent you a (reel|clip|post|story|video|photo)$/i.test(text);
  return !(message.sharedPost && isBoilerplateShare);
}

export default function MessageContextMenu({
  message,
  anchor,
  onClose,
  onDelete,
  onEdit,
  onShare,
  onStory,
  onReported,
}: MessageContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const open = !!message && !!anchor;
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMessage, setReportMessage] = useState<ChatMessageData | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useLayoutEffect(() => {
    if (!open || !anchor || !menuRef.current) return;
    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const pad = 8;
    let top = anchor.bottom + 6;
    let left = anchor.isMine ? anchor.right - rect.width : anchor.left;

    if (top + rect.height > window.innerHeight - pad) {
      top = anchor.top - rect.height - 6;
    }
    if (left < pad) left = pad;
    if (left + rect.width > window.innerWidth - pad) {
      left = window.innerWidth - rect.width - pad;
    }
    if (top < pad) top = pad;

    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;
  }, [open, anchor, message]);

  const startReport = (msg: ChatMessageData) => {
    setReportMessage(msg);
    onClose();
    setReportOpen(true);
  };

  const submitReport = async (reason: ReportReasonId, description: string) => {
    if (!reportMessage) return;
    await api.post(`/api/messages/${reportMessage.id}/report`, { reason, description });
    onReported?.(reportMessage);
  };

  return (
    <>
      <AnimatePresence>
        {open && message && anchor && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-[110]"
              onClick={onClose}
              aria-label="Close menu"
            />
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              className="fixed z-[111] min-w-[160px] py-1 rounded-xl bg-white dark:bg-surface-card-dark shadow-xl border border-gray-200/70 dark:border-gray-700/70"
              style={{ top: anchor.bottom + 6, left: anchor.isMine ? anchor.right - 160 : anchor.left }}
            >
              {message.isMine && (
                <>
                  <MenuItem
                    icon={Trash2}
                    label="Delete"
                    danger
                    onClick={() => {
                      onDelete(message);
                      onClose();
                    }}
                  />
                  {canEditMessage(message) && (
                    <MenuItem
                      icon={Pencil}
                      label="Edit"
                      onClick={() => {
                        onEdit(message);
                        onClose();
                      }}
                    />
                  )}
                </>
              )}
              <MenuItem
                icon={Share2}
                label="Share"
                onClick={() => {
                  onShare(message);
                  onClose();
                }}
              />
              <MenuItem
                icon={Circle}
                label="Story"
                onClick={() => {
                  onStory(message);
                  onClose();
                }}
              />
              {!message.isMine && (
                <MenuItem
                  icon={Trash2}
                  label="Delete"
                  danger
                  onClick={() => {
                    onDelete(message);
                    onClose();
                  }}
                />
              )}
              <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
              <MenuItem
                icon={Flag}
                label="Report"
                danger
                onClick={() => startReport(message)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ReportFlow
        open={reportOpen}
        title="Report message"
        onClose={() => {
          setReportOpen(false);
          setReportMessage(null);
        }}
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
}: {
  icon: typeof Trash2;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 ${
        danger ? 'text-red-500' : 'text-gray-800 dark:text-gray-100'
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </button>
  );
}
