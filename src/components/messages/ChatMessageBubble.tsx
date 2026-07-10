import { useRef } from 'react';
import { renderMessageContent, SharedPostCard, type SharedPostPreview } from '@/lib/messageContent';

export interface ChatMessageData {
  id: string;
  content: string;
  createdAt: string;
  isMine: boolean;
  sharedPost?: SharedPostPreview;
}

export interface MessageMenuAnchor {
  top: number;
  left: number;
  right: number;
  bottom: number;
  isMine: boolean;
}

const LONG_PRESS_MS = 500;

export default function ChatMessageBubble({
  message,
  onOpenMenu,
}: {
  message: ChatMessageData;
  onOpenMenu?: (message: ChatMessageData, anchor: MessageMenuAnchor) => void;
}) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const { isMine, content, sharedPost } = message;
  const timerRef = useRef<number | undefined>(undefined);
  const movedRef = useRef(false);

  const isBoilerplateShare = /^Sent you a (reel|clip|post|story|video|photo)$/i.test(content.trim());
  const hasText = content.trim().length > 0 && !(sharedPost && isBoilerplateShare);

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  };

  const openMenu = () => {
    const el = bubbleRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    onOpenMenu?.(message, {
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
      isMine,
    });
  };

  const startLongPress = () => {
    movedRef.current = false;
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      if (!movedRef.current) openMenu();
    }, LONG_PRESS_MS);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    openMenu();
  };

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        ref={bubbleRef}
        className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm space-y-2 select-none touch-manipulation ${
          isMine
            ? 'bg-primary text-white rounded-br-md'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
        }`}
        onTouchStart={startLongPress}
        onTouchMove={() => {
          movedRef.current = true;
          clearTimer();
        }}
        onTouchEnd={clearTimer}
        onTouchCancel={clearTimer}
        onContextMenu={handleContextMenu}
      >
        {sharedPost && <SharedPostCard post={sharedPost} invert={isMine} />}
        {hasText && (
          <p className="whitespace-pre-wrap break-words leading-relaxed">
            {renderMessageContent(content, { invertMention: isMine })}
          </p>
        )}
      </div>
    </div>
  );
}
