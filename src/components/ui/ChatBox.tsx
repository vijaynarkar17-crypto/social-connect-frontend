import { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Smile, ImageIcon } from 'lucide-react';
import EmojiGifPicker from '@/components/ui/EmojiGifPicker';

export interface ChatBoxHandle {
  focus: () => void;
  insertText: (text: string) => void;
}

interface ChatBoxProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  variant?: 'plain' | 'field';
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  showPicker?: boolean;
  innerRef?: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>;
}

const ChatBox = forwardRef<ChatBoxHandle, ChatBoxProps>(function ChatBox(
  {
    value,
    onChange,
    onKeyDown,
    onFocus,
    onBlur,
    placeholder = 'Type a message...',
    multiline = false,
    rows = 2,
    variant = 'field',
    className = '',
    inputClassName = '',
    disabled = false,
    showPicker = true,
    innerRef,
  },
  ref
) {
  const localRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const inputRef = innerRef || localRef;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState<'emoji' | 'gif'>('emoji');

  const insertText = (text: string) => {
    const el = inputRef.current;
    if (!el) {
      onChange(value + text);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const spacer = value.length > 0 && start > 0 && value[start - 1] !== ' ' ? ' ' : '';
    const insert = spacer + text;
    const newValue = value.slice(0, start) + insert + value.slice(end);
    onChange(newValue);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + insert.length;
      el.setSelectionRange(pos, pos);
    });
  };

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    insertText,
  }));

  const baseInputClass =
    variant === 'plain'
      ? 'w-full resize-none bg-transparent border-0 focus:outline-none placeholder-gray-400'
      : 'w-full input-field py-2 text-sm';

  const sharedProps = {
    value,
    disabled,
    placeholder,
    onKeyDown,
    onFocus,
    onBlur,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    className: `${baseInputClass} ${inputClassName}`,
  };

  return (
    <div className={`relative ${className}`}>
      {multiline ? (
        <textarea ref={inputRef as React.RefObject<HTMLTextAreaElement>} rows={rows} {...sharedProps} />
      ) : (
        <input ref={inputRef as React.RefObject<HTMLInputElement>} type="text" {...sharedProps} />
      )}

      {showPicker && (
        <>
          <div className={`flex gap-1 mt-1.5 ${variant === 'plain' ? '' : 'px-0.5'}`}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => { setPickerTab('emoji'); setPickerOpen(true); }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 active:scale-95 transition-transform disabled:opacity-50"
              title="Emoji"
            >
              <Smile className="w-4 h-4" /> Emoji
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => { setPickerTab('gif'); setPickerOpen(true); }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 active:scale-95 transition-transform disabled:opacity-50"
              title="GIF"
            >
              <ImageIcon className="w-4 h-4" /> GIF
            </button>
          </div>

          <EmojiGifPicker
            open={pickerOpen}
            initialTab={pickerTab}
            onClose={() => setPickerOpen(false)}
            onEmoji={(emoji) => insertText(emoji)}
            onGif={(url) => insertText(url)}
          />
        </>
      )}
    </div>
  );
});

export default ChatBox;
