import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import HomeFeed from '@/components/home/HomeFeed';
import MessagesPanel from '@/components/messages/MessagesPanel';
import ClipsFeed from '@/components/clips/ClipsFeed';

type HubPanel = 'home' | 'messages' | 'clips';

function panelFromPath(pathname: string): HubPanel {
  if (pathname === '/messages') return 'messages';
  if (pathname === '/clips') return 'clips';
  return 'home';
}

const PANEL_INDEX: Record<HubPanel, number> = { home: 0, messages: 1, clips: 2 };

export default function MainHubPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const panel = useMemo(() => panelFromPath(location.pathname), [location.pathname]);
  const panelIndex = PANEL_INDEX[panel];

  // Only mount a panel once it has been visited. Avoids loading MessagesPanel +
  // ClipsFeed (and their data) on the initial /home render.
  const [mounted, setMounted] = useState<Record<HubPanel, boolean>>(() => ({
    home: panel === 'home',
    messages: panel === 'messages',
    clips: panel === 'clips',
  }));

  useEffect(() => {
    setMounted((prev) => (prev[panel] ? prev : { ...prev, [panel]: true }));
  }, [panel]);

  const chatUserId = searchParams.get('userId');
  const chatUsername = searchParams.get('username');
  const [initialPartner, setInitialPartner] = useState<{
    id: string;
    username: string;
    avatar?: string;
  } | null>(null);

  useEffect(() => {
    if (chatUserId && chatUsername && panel === 'messages') {
      setInitialPartner({ id: chatUserId, username: chatUsername });
    } else if (!chatUserId) {
      setInitialPartner(null);
    }
  }, [chatUserId, chatUsername, panel]);

  const goTo = (next: HubPanel) => {
    const path = next === 'home' ? '/home' : `/${next}`;
    if (next !== 'messages') {
      setSearchParams({}, { replace: true });
      setInitialPartner(null);
    }
    navigate(path, { replace: true });
  };

  useEffect(() => {
    if (!['/home', '/messages', '/clips'].includes(location.pathname)) {
      navigate('/home', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <AppShell>
      <div
        className={`h-full min-h-0 flex flex-col overflow-hidden relative ${
          panel === 'clips' ? '' : ''
        }`}
      >
        <motion.div
          className="flex w-[300%] h-full min-h-0"
          animate={{ x: `-${panelIndex * (100 / 3)}%` }}
          transition={{ type: 'spring', damping: 32, stiffness: 320 }}
        >
          <div className="w-1/3 shrink-0 h-full min-h-0 overflow-hidden flex flex-col">
            {mounted.home && (
              <HomeFeed
                cameraEnabled={panel === 'home'}
                onSwipeToMessages={() => goTo('messages')}
              />
            )}
          </div>
          <div className="w-1/3 shrink-0 h-full min-h-0 overflow-hidden flex flex-col">
            {mounted.messages && (
              <MessagesPanel
                active={panel === 'messages'}
                onBack={() => goTo('home')}
                onSwipeToClips={() => goTo('clips')}
                initialPartner={initialPartner}
              />
            )}
          </div>
          <div className="w-1/3 shrink-0 h-full min-h-0 flex flex-col">
            {mounted.clips && (
              <ClipsFeed
                active={panel === 'clips'}
                onSwipeToMessages={() => goTo('messages')}
              />
            )}
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
