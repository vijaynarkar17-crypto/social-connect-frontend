import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { House, MessagesSquare, Film, Compass, Zap, CircleUserRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { getSocket, joinUserRoom } from '@/lib/socket';

const bottomNav = [
  { href: '/home', icon: House, label: 'Pulse' },
  { href: '/messages', icon: MessagesSquare, label: 'Inbox', messageBadge: true },
  { href: '/clips', icon: Film, label: 'Reels' },
  { href: '/search', icon: Compass, label: 'Hunt' },
  { href: '/notifications', icon: Zap, label: 'Buzz', badge: true },
  { href: '/profile', icon: CircleUserRound, label: 'You', isProfile: true },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const isClips = pathname === '/clips';
  const isHub =
    pathname === '/home' || pathname === '/messages' || pathname === '/clips' || pathname === '/';

  const refreshNotifications = useCallback(() => {
    api
      .get('/api/notifications')
      .then(({ data }) => setUnreadCount(data.unreadCount || 0))
      .catch(() => {});
  }, []);

  const refreshMessages = useCallback(() => {
    api
      .get('/api/messages/conversations')
      .then(({ data }) => {
        const total = (data.conversations || []).reduce(
          (sum: number, c: { unreadCount: number }) => sum + (c.unreadCount || 0),
          0
        );
        setUnreadMessages(total);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshNotifications();
    refreshMessages();
  }, [refreshNotifications, refreshMessages]);

  useEffect(() => {
    if (!user?.id) return;
    const socket = getSocket();
    const onConnect = () => joinUserRoom(user.id);
    const onNotification = () => refreshNotifications();
    const onMessage = () => refreshMessages();

    if (socket.connected) joinUserRoom(user.id);
    socket.on('connect', onConnect);
    socket.on('notification', onNotification);
    socket.on('message', onMessage);

    return () => {
      socket.off('connect', onConnect);
      socket.off('notification', onNotification);
      socket.off('message', onMessage);
    };
  }, [user?.id, refreshNotifications, refreshMessages]);

  const profileHref = user ? `/profile/${user.username}` : '/profile';

  const mainClass = isClips
    ? 'h-[calc(100dvh-5.5rem)] max-w-none p-0 overflow-hidden flex flex-col min-h-0 bg-black'
    : isHub
      ? 'h-[calc(100dvh-5.5rem)] max-w-lg mx-auto md:max-w-2xl w-full p-0 overflow-hidden flex flex-col min-h-0'
      : 'max-w-lg mx-auto px-4 py-4 md:max-w-2xl md:py-6 pb-28';

  return (
    <div
      className={
        isHub || isClips ? 'h-[100dvh] overflow-hidden' : 'min-h-screen pb-28 md:pb-0'
      }
    >
      <main className={mainClass}>{children}</main>

      {/* Floating yellow/black command dock */}
      <nav className="fixed bottom-3 left-0 right-0 z-50 px-3 pointer-events-none safe-area-pb [&_a]:outline-none [&_a]:ring-0 [&_a]:[-webkit-tap-highlight-color:transparent]">
        <div className="pointer-events-auto mx-auto max-w-md">
          <div className="relative flex items-center justify-between gap-1 rounded-[1.75rem] bg-black border-2 border-primary px-2 py-2 shadow-[4px_4px_0_0_#FACC15]">
            {bottomNav.map(({ href, icon: Icon, label, badge, messageBadge, isProfile }) => {
              const link = isProfile ? profileHref : href;
              const active = isProfile
                ? pathname.startsWith('/profile')
                : pathname === href || (href === '/home' && pathname === '/');
              const count = messageBadge ? unreadMessages : badge ? unreadCount : 0;

              return (
                <Link
                  key={href}
                  to={link}
                  className="flex-1 min-w-0 outline-none focus:outline-none"
                  onClick={(e) => (e.currentTarget as HTMLElement).blur()}
                >
                  <motion.div
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.86, y: 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    className={`relative mx-auto flex h-11 w-11 flex-col items-center justify-center rounded-2xl outline-none ${
                      active
                        ? 'bg-primary text-black border border-black shadow-[2px_2px_0_0_#FACC15]'
                        : 'text-primary/70 hover:text-primary border border-transparent'
                    }`}
                  >
                    <div className="relative">
                      <Icon className={`h-5 w-5 ${active ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
                      {count > 0 && (
                        <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-black border border-black">
                          {count > 9 ? '9+' : count}
                        </span>
                      )}
                    </div>
                  </motion.div>
                  <span
                    className={`mt-0.5 block text-center text-[9px] font-bold uppercase tracking-wide ${
                      active ? 'text-primary opacity-100' : 'opacity-0 h-0 overflow-hidden'
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
