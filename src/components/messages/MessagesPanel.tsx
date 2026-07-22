import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle, PenSquare, Search, Send } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import ChatBox from '@/components/ui/ChatBox';
import Button from '@/components/ui/Button';
import ChatMessageBubble, { type ChatMessageData } from '@/components/messages/ChatMessageBubble';
import NewChatSheet, { type ChatContact } from '@/components/messages/NewChatSheet';
import MessageContextMenu, { type MessageMenuAnchor } from '@/components/messages/MessageContextMenu';
import MessageShareSheet from '@/components/messages/MessageShareSheet';
import api from '@/lib/api';
import { ConversationListSkeleton, ChatThreadSkeleton } from '@/components/ui/Skeleton';
import { formatInboxPreview } from '@/lib/messageContent';
import { postMessageAsStory } from '@/lib/messageActions';
import { useSwipeRightAction, useSwipeLeftAction } from '@/hooks/useEdgeSwipe';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

interface Partner {
  id: string;
  username: string;
  avatar?: string;
  isVerified?: boolean;
}

interface Conversation {
  partner: Partner;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    isMine: boolean;
    read: boolean;
    sharedPost?: { type: string; content?: string };
  };
  unreadCount: number;
}

interface ChatAccess {
  canChat: boolean;
  needsRequest: boolean;
  requestStatus: string;
  isPublic: boolean;
  pendingOutgoing?: boolean;
}

interface MessagesPanelProps {
  active: boolean;
  onBack: () => void;
  onSwipeToClips?: () => void;
  initialPartner?: Partner | null;
}

const THREAD_PAGE_SIZE = 20;

export default function MessagesPanel({
  active,
  onBack,
  onSwipeToClips,
  initialPartner,
}: MessagesPanelProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Partner | null>(initialPartner || null);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [chatAccess, setChatAccess] = useState<ChatAccess | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [sendError, setSendError] = useState('');
  const [incomingRequests, setIncomingRequests] = useState<
    { id: string; sender: Partner; createdAt: string }[]
  >([]);
  const [menuMessage, setMenuMessage] = useState<ChatMessageData | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<MessageMenuAnchor | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<ChatMessageData | null>(null);
  const [actionFeedback, setActionFeedback] = useState('');
  const threadEndRef = useRef<HTMLDivElement>(null);
  const threadScrollRef = useRef<HTMLDivElement>(null);
  const loadingOlderRef = useRef(false);

  const swipeBack = useSwipeRightAction(onBack, active && !selected);
  const swipeToClips = useSwipeLeftAction(
    () => onSwipeToClips?.(),
    active && !selected && !!onSwipeToClips
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    swipeBack.onTouchStart(e);
    swipeToClips.onTouchStart(e);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    swipeBack.onTouchMove(e);
    swipeToClips.onTouchMove(e);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    swipeBack.onTouchEnd(e);
    swipeToClips.onTouchEnd(e);
  };

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: convo }, { data: requests }] = await Promise.all([
        api.get('/api/messages/conversations'),
        api.get('/api/messages/chat-requests'),
      ]);
      setConversations(convo.conversations || []);
      setIncomingRequests(requests.requests || []);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadThread = useCallback(async (partnerId: string) => {
    setThreadLoading(true);
    setSendError('');
    setHasMoreOlder(false);
    setMessages([]);
    try {
      const [{ data: thread }, { data: access }] = await Promise.all([
        api.get(`/api/messages/with/${partnerId}`, { params: { limit: THREAD_PAGE_SIZE } }),
        api.get(`/api/messages/can-chat/${partnerId}`),
      ]);
      setMessages(thread.messages || []);
      setHasMoreOlder(Boolean(thread.hasMore));
      setChatAccess(access);
      requestAnimationFrame(() => {
        threadEndRef.current?.scrollIntoView({ behavior: 'auto' });
      });
    } catch {
      setMessages([]);
      setChatAccess(null);
      setHasMoreOlder(false);
    } finally {
      setThreadLoading(false);
    }
  }, []);

  const loadOlderMessages = useCallback(async () => {
    if (!selected || !hasMoreOlder || loadingOlderRef.current || threadLoading || messages.length === 0) {
      return;
    }

    const scrollEl = threadScrollRef.current;
    const prevHeight = scrollEl?.scrollHeight ?? 0;
    const prevTop = scrollEl?.scrollTop ?? 0;

    loadingOlderRef.current = true;
    setLoadingOlder(true);
    try {
      const { data } = await api.get(`/api/messages/with/${selected.id}`, {
        params: { limit: THREAD_PAGE_SIZE, before: messages[0].id },
      });
      const older: ChatMessageData[] = data.messages || [];
      if (older.length === 0) {
        setHasMoreOlder(false);
        return;
      }
      setMessages((prev) => [...older, ...prev]);
      setHasMoreOlder(Boolean(data.hasMore));
      requestAnimationFrame(() => {
        if (scrollEl) {
          scrollEl.scrollTop = scrollEl.scrollHeight - prevHeight + prevTop;
        }
      });
    } catch {
      // keep current messages
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }, [selected, hasMoreOlder, threadLoading, messages]);

  useEffect(() => {
    if (active) loadConversations();
  }, [active, loadConversations]);

  useEffect(() => {
    if (initialPartner) setSelected(initialPartner);
  }, [initialPartner]);

  useEffect(() => {
    if (selected) loadThread(selected.id);
    else {
      setMessages([]);
      setChatAccess(null);
      setHasMoreOlder(false);
    }
  }, [selected, loadThread]);

  const handleThreadScroll = () => {
    const el = threadScrollRef.current;
    if (!el || loadingOlderRef.current || !hasMoreOlder) return;
    if (el.scrollTop < 72) loadOlderMessages();
  };

  const handleSend = async () => {
    if (!selected || !draft.trim() || sending) return;
    setSending(true);
    setSendError('');
    try {
      const { data } = await api.post('/api/messages', {
        recipientId: selected.id,
        content: draft.trim(),
      });
      setMessages((prev) => [...prev, data.message]);
      setDraft('');
      setChatAccess((prev) => (prev ? { ...prev, canChat: true } : prev));
      loadConversations();
      requestAnimationFrame(() => {
        threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { code?: string; error?: string } } })?.response?.data;
      if (code?.code === 'CHAT_REQUEST_REQUIRED') {
        setSendError('This is a private account. Send a chat request first.');
      } else if (code?.code === 'CHAT_REQUEST_PENDING') {
        setSendError('Waiting for them to accept your chat request.');
      } else {
        setSendError(code?.error || 'Could not send message');
      }
    } finally {
      setSending(false);
    }
  };

  const handleRequestChat = async () => {
    if (!selected || requesting) return;
    setRequesting(true);
    setSendError('');
    try {
      await api.post('/api/messages/chat-request', { recipientId: selected.id });
      setChatAccess((prev) =>
        prev ? { ...prev, needsRequest: false, pendingOutgoing: true, requestStatus: 'pending' } : prev
      );
    } finally {
      setRequesting(false);
    }
  };

  const handleAcceptRequest = async (requestId: string, sender: Partner) => {
    await api.post(`/api/messages/chat-request/${requestId}/accept`);
    setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
    setSelected(sender);
    loadConversations();
  };

  const handleRejectRequest = async (requestId: string) => {
    await api.post(`/api/messages/chat-request/${requestId}/reject`);
    setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const startChat = (user: Partner | ChatContact) => {
    setSelected(user);
    setMessages([]);
    setHasMoreOlder(false);
  };

  const showFeedback = (text: string) => {
    setActionFeedback(text);
    window.setTimeout(() => setActionFeedback(''), 2500);
  };

  const handleDeleteMessage = async (msg: ChatMessageData) => {
    try {
      await api.delete(`/api/messages/${msg.id}`);
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
      loadConversations();
      showFeedback('Message deleted');
    } catch {
      showFeedback('Could not delete message');
    }
  };

  const handleShareMessage = (msg: ChatMessageData) => {
    setShareMessage(msg);
  };

  const handleStoryMessage = async (msg: ChatMessageData) => {
    try {
      await postMessageAsStory(msg);
      showFeedback('Added to your story');
    } catch {
      showFeedback('Could not post story');
    }
  };

  const handleReportMessage = (_msg: ChatMessageData) => {
    showFeedback('Report submitted');
  };

  const openMessageMenu = (msg: ChatMessageData, anchor: MessageMenuAnchor) => {
    setMenuMessage(msg);
    setMenuAnchor(anchor);
  };

  const closeMessageMenu = () => {
    setMenuMessage(null);
    setMenuAnchor(null);
  };

  const handleEditMessage = (msg: ChatMessageData) => {
    setEditingMessageId(msg.id);
    setDraft(msg.content);
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !draft.trim() || sending) return;
    setSending(true);
    setSendError('');
    try {
      const { data } = await api.put(`/api/messages/${editingMessageId}`, {
        content: draft.trim(),
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === editingMessageId ? { ...m, content: data.message.content } : m))
      );
      setEditingMessageId(null);
      setDraft('');
      showFeedback('Message updated');
    } catch {
      setSendError('Could not edit message');
    } finally {
      setSending(false);
    }
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setDraft('');
  };

  const canType = chatAccess?.canChat ?? false;
  const showRequestBtn = chatAccess?.needsRequest && !chatAccess?.pendingOutgoing;

  return (
    <div
      className="h-full flex-1 min-h-0 flex flex-col overflow-hidden bg-white dark:bg-surface-dark"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {!selected ? (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="shrink-0 border-b border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-surface-dark z-10">
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                type="button"
                onClick={onBack}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="font-semibold text-lg flex-1 truncate">Messages</h2>
              <button
                type="button"
                onClick={() => setNewChatOpen(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-primary hover:bg-primary/10"
                aria-label="New message"
              >
                <PenSquare className="w-5 h-5" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setNewChatOpen(true)}
              className="mx-4 mb-3 flex items-center gap-2 w-[calc(100%-2rem)] px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800/80 text-left text-sm text-gray-500 hover:bg-gray-200/80 dark:hover:bg-gray-800 transition-colors"
            >
              <Search className="w-4 h-4 shrink-0" />
              Search following &amp; followers...
            </button>
          </div>

          {incomingRequests.length > 0 && (
            <div className="shrink-0 px-4 py-2 space-y-2 border-b border-gray-100 dark:border-gray-800">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Chat requests</p>
              {incomingRequests.map((req) => (
                <div key={req.id} className="flex items-center gap-3 p-2 rounded-xl bg-primary/5">
                  <Avatar src={req.sender.avatar} alt={req.sender.username} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{req.sender.username}</p>
                    <p className="text-[11px] text-gray-500">Wants to chat with you</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button size="sm" variant="secondary" onClick={() => handleRejectRequest(req.id)}>
                      Decline
                    </Button>
                    <Button size="sm" onClick={() => handleAcceptRequest(req.id, req.sender)}>
                      Accept
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain">
            {loading ? (
              <ConversationListSkeleton />
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
                <p className="font-medium">No conversations yet</p>
                <p className="text-sm text-gray-500 mt-1 mb-4">
                  Tap the pen icon to search following &amp; followers and start a chat.
                </p>
                <Button size="sm" onClick={() => setNewChatOpen(true)}>
                  <PenSquare className="w-4 h-4" /> Find someone
                </Button>
              </div>
            ) : (
              <ul>
                {conversations.map(({ partner, lastMessage, unreadCount }) => (
                  <li key={partner.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(partner)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-left"
                    >
                      <Avatar src={partner.avatar} alt={partner.username} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`font-medium truncate ${unreadCount ? 'text-primary' : ''}`}>
                            {partner.username}
                          </span>
                          <span className="text-[11px] text-gray-400 shrink-0">
                            {timeAgo(lastMessage.createdAt)}
                          </span>
                        </div>
                        <p className={`text-sm truncate ${unreadCount ? 'font-semibold' : 'text-gray-500'}`}>
                          {lastMessage.isMine ? 'You: ' : ''}
                          {formatInboxPreview(lastMessage.content, lastMessage.sharedPost)}
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-black border border-black/30 text-[10px] font-bold flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="sticky top-0 z-20 shrink-0 border-b border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-surface-dark">
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0"
                aria-label="Back to inbox"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Link
                to={`/profile/${selected.username}`}
                className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-90 transition-opacity"
              >
                <Avatar src={selected.avatar} alt={selected.username} size="sm" />
                <div className="min-w-0">
                  <p className="font-semibold text-base truncate">
                    {selected.username}
                    {selected.isVerified && <span className="ml-1 text-accent text-xs">✓</span>}
                  </p>
                  <p className="text-[11px] text-gray-500">Tap to view profile</p>
                </div>
              </Link>
            </div>
          </div>

          <div
            ref={threadScrollRef}
            onScroll={handleThreadScroll}
            className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-4 py-3 space-y-3"
          >
            {loadingOlder && (
              <div className="flex justify-center py-1">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {threadLoading ? (
              <ChatThreadSkeleton />
            ) : messages.length === 0 ? (
              <div className="text-center py-10 px-4">
                {chatAccess?.isPublic ? (
                  <p className="text-sm text-gray-500">Public account — say hi!</p>
                ) : showRequestBtn ? (
                  <p className="text-sm text-gray-500">Private account — request to chat first</p>
                ) : chatAccess?.pendingOutgoing ? (
                  <p className="text-sm text-amber-600">Chat request sent — waiting for approval</p>
                ) : (
                  <p className="text-sm text-gray-500">Start your conversation</p>
                )}
              </div>
            ) : (
              messages.map((msg) => (
                <ChatMessageBubble
                  key={msg.id}
                  message={msg}
                  onOpenMenu={openMessageMenu}
                />
              ))
            )}
            <div ref={threadEndRef} />
          </div>

          <div className="shrink-0 border-t border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-surface-dark p-3">
            {actionFeedback && (
              <p className="text-xs text-center text-primary font-medium mb-2 px-1">{actionFeedback}</p>
            )}
            {sendError && (
              <p className="text-xs text-red-500 mb-2 px-1">{sendError}</p>
            )}
            {showRequestBtn ? (
              <Button className="w-full" onClick={handleRequestChat} loading={requesting}>
                Request to chat
              </Button>
            ) : chatAccess?.pendingOutgoing && !canType ? (
              <p className="text-center text-sm text-amber-600 py-2">Request pending — you can message once they accept</p>
            ) : (
              <div className="flex gap-2 items-end">
                {editingMessageId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="text-xs text-gray-500 px-2 py-2 shrink-0"
                  >
                    Cancel
                  </button>
                )}
                <ChatBox
                  value={draft}
                  onChange={setDraft}
                  placeholder={
                    editingMessageId
                      ? 'Edit message…'
                      : `Message @${selected.username}…`
                  }
                  className="flex-1"
                  multiline
                  rows={2}
                  disabled={!canType && messages.length === 0 && !editingMessageId}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (editingMessageId) handleSaveEdit();
                      else handleSend();
                    }
                    if (e.key === 'Escape' && editingMessageId) {
                      e.preventDefault();
                      cancelEdit();
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={editingMessageId ? handleSaveEdit : handleSend}
                  loading={sending}
                  disabled={!draft.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <NewChatSheet open={newChatOpen} onClose={() => setNewChatOpen(false)} onSelect={startChat} />

      <MessageContextMenu
        message={menuMessage}
        anchor={menuAnchor}
        onClose={closeMessageMenu}
        onDelete={handleDeleteMessage}
        onEdit={handleEditMessage}
        onShare={handleShareMessage}
        onStory={handleStoryMessage}
        onReported={handleReportMessage}
      />

      <MessageShareSheet message={shareMessage} onClose={() => setShareMessage(null)} />
    </div>
  );
}
