import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, MessageCircle, UserPlus, Mail, AtSign, Tag, Users, Eye, Share2, Bell,
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { formatDistanceToNow } from '@/lib/utils';
import { NotificationListSkeleton } from '@/components/ui/Skeleton';

type NotificationType = 'LIKE' | 'COMMENT' | 'FOLLOW' | 'FOLLOW_REQUEST' | 'MESSAGE' | 'MENTION' | 'TAG' | 'MUTUAL' | 'STORY_VIEW' | 'SHARE';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
  targetId?: string;
  targetType?: 'post' | 'user' | 'story' | 'message';
  followRequestPending?: boolean;
  actor?: { id: string; username: string; avatar?: string; isVerified?: boolean };
}

const typeConfig: Record<NotificationType, { icon: typeof Heart; color: string; bg: string }> = {
  LIKE: { icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  COMMENT: { icon: MessageCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  FOLLOW: { icon: UserPlus, color: 'text-primary', bg: 'bg-primary/10' },
  FOLLOW_REQUEST: { icon: UserPlus, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  MESSAGE: { icon: Mail, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  MENTION: { icon: AtSign, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  TAG: { icon: Tag, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  MUTUAL: { icon: Users, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  STORY_VIEW: { icon: Eye, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  SHARE: { icon: Share2, color: 'text-teal-500', bg: 'bg-teal-500/10' },
};

function getFollowActionPath(n: Notification): string | null {
  if (!n.actor?.id) return null;
  const params = new URLSearchParams();
  if (n.actor.username) params.set('username', n.actor.username);
  params.set('notificationId', n.id);
  if (n.type === 'FOLLOW') params.set('type', 'follow');
  return `/notifications/follow/${n.actor.id}?${params.toString()}`;
}

function getNotificationPath(n: Notification): string | null {
  const { actor, type, targetId, targetType } = n;

  if (type === 'FOLLOW_REQUEST' && n.followRequestPending) {
    return getFollowActionPath(n);
  }

  if (type === 'FOLLOW' && actor?.id) {
    return getFollowActionPath(n);
  }

  if (type === 'MESSAGE') {
    if (actor?.id && actor.username) {
      return `/messages?userId=${actor.id}&username=${encodeURIComponent(actor.username)}`;
    }
    return null;
  }

  if (['SHARE', 'LIKE', 'COMMENT', 'TAG', 'MENTION'].includes(type) && targetId && targetType === 'post') {
    return `/home?post=${targetId}`;
  }

  if (actor?.username) {
    return `/profile/${actor.username}`;
  }

  return null;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/api/notifications')
      .then(({ data }) => setNotifications(data.notifications || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markAllRead = async () => {
    await api.post('/api/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = async (id: string) => {
    await api.post(`/api/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleClick = async (n: Notification) => {
    const path = getNotificationPath(n);
    if (!path) return;

    await markRead(n.id);

    if (path.startsWith('/notifications/follow/')) {
      navigate(path, { state: { notification: n } });
      return;
    }

    navigate(path);
  };

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unread > 0 && (
            <Button size="sm" variant="secondary" onClick={markAllRead}>Mark all read</Button>
          )}
        </div>

        {loading ? (
          <NotificationListSkeleton />
        ) : notifications.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium">No notifications yet</p>
            <p className="text-sm text-gray-500 mt-1">Likes, comments, follows and more will appear here</p>
          </div>
        ) : (
          <div className="glass-card divide-y divide-gray-100 dark:divide-gray-800 !p-0 overflow-hidden">
            {notifications.map((n) => {
              const cfg = typeConfig[n.type] || typeConfig.LIKE;
              const Icon = cfg.icon;
              const path = getNotificationPath(n);
              const isClickable = !!path;

              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-4 ${!n.read ? 'bg-primary/5' : ''} ${
                    isClickable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 active:bg-gray-100' : ''
                  }`}
                  onClick={isClickable ? () => handleClick(n) : undefined}
                  onKeyDown={isClickable ? (e) => e.key === 'Enter' && handleClick(n) : undefined}
                  role={isClickable ? 'button' : undefined}
                  tabIndex={isClickable ? 0 : undefined}
                >
                  <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className={`w-5 h-5 ${cfg.color}`} />
                  </div>

                  {n.actor && (
                    <Avatar src={n.actor.avatar} alt={n.actor.username} size="sm" className="flex-shrink-0 mt-0.5" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">
                      {n.actor && <span className="font-semibold">{n.actor.username} </span>}
                      {n.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{formatDistanceToNow(n.createdAt)}</p>
                    {(n.type === 'FOLLOW_REQUEST' && n.followRequestPending) || n.type === 'FOLLOW' ? (
                      <p className="text-xs text-primary mt-1">Tap to accept or follow back</p>
                    ) : null}
                  </div>

                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
