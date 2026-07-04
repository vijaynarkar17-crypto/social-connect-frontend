import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, MessageCircle, Clapperboard, Search, Bell, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

const bottomNav = [
  { href: '/home', icon: Home, label: 'Home' },
  { href: '/messages', icon: MessageCircle, label: 'Chat', messageBadge: true },
  { href: '/clips', icon: Clapperboard, label: 'Clips' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/notifications', icon: Bell, label: 'Alerts', badge: true },
  { href: '/profile', icon: User, label: 'Profile', isProfile: true },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const isClips = pathname === '/clips';
  const isHub =
    pathname === '/home' || pathname === '/messages' || pathname === '/clips' || pathname === '/';

  useEffect(() => {
    api.get('/api/notifications')
      .then(({ data }) => setUnreadCount(data.unreadCount || 0))
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
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
  }, [pathname]);

  const profileHref = user ? `/profile/${user.username}` : '/profile';

  const mainClass = isClips
    ? 'h-[calc(100dvh-4rem)] max-w-none p-0 overflow-hidden flex flex-col min-h-0 bg-black'
    : isHub
      ? 'h-[calc(100dvh-4rem)] max-w-lg mx-auto md:max-w-2xl w-full p-0 overflow-hidden flex flex-col min-h-0'
      : 'max-w-lg mx-auto px-4 py-4 md:max-w-2xl md:py-6';

  return (
    <div
      className={
        isHub || isClips ? 'h-[100dvh] overflow-hidden' : 'min-h-screen pb-20 md:pb-0'
      }
    >
      <main className={mainClass}>{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-gray-200/60 dark:border-gray-800/60 safe-area-pb">
        <div className="max-w-lg mx-auto flex items-center justify-between h-16 px-1">
          {bottomNav.map(({ href, icon: Icon, label, badge, messageBadge, isProfile }) => {
            const link = isProfile ? profileHref : href;
            const active = isProfile
              ? pathname.startsWith('/profile')
              : pathname === href || (href === '/home' && pathname === '/');
            const count = messageBadge ? unreadMessages : badge ? unreadCount : 0;
            return (
              <Link key={href} to={link} className="flex-1 flex justify-center min-w-0">
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  className={`relative flex flex-col items-center gap-0.5 py-1 px-1 rounded-xl transition-colors ${
                    active ? 'text-primary' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <div className={`relative ${active ? 'scale-110' : ''} transition-transform`}>
                    <Icon className={`w-5 h-5 md:w-6 md:h-6 ${active ? 'stroke-[2.5]' : ''}`} />
                    {count > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                        {count > 9 ? '9+' : count}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[9px] md:text-[10px] font-medium truncate max-w-full ${active ? 'text-primary' : ''}`}
                  >
                    {label}
                  </span>
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary"
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
