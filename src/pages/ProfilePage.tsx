import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Settings, UserPlus, MessageCircle, Grid3X3, Clapperboard, AtSign } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import ProfileOptionsMenu from '@/components/profile/ProfileOptionsMenu';
import PostCard, { type Post } from '@/components/feed/PostCard';
import ClipCard, { type Clip } from '@/components/clips/ClipCard';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatCount } from '@/lib/postUtils';

interface ChatAccess {
  canChat: boolean;
  needsRequest: boolean;
  requestStatus: string;
  isPublic: boolean;
  pendingOutgoing?: boolean;
}

interface Profile {
  id: string;
  username: string;
  avatar?: string;
  cover?: string;
  bio?: string;
  isVerified?: boolean;
  profileVisibility?: string;
  stats: { posts: number; followers: number; following: number };
  isFollowing?: boolean;
  followRequestPending?: boolean;
  isOwnProfile?: boolean;
  chatAccess?: ChatAccess | null;
}

type ProfileTab = 'posts' | 'clips' | 'tags';

const TABS: { id: ProfileTab; label: string; icon: typeof Grid3X3 }[] = [
  { id: 'posts', label: 'Posts', icon: Grid3X3 },
  { id: 'clips', label: 'Clips', icon: Clapperboard },
  { id: 'tags', label: 'Tags', icon: AtSign },
];

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [taggedPosts, setTaggedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [messageLoading, setMessageLoading] = useState(false);

  const resolvedUsername = username || currentUser?.username;

  const load = useCallback(async () => {
    if (!resolvedUsername) return;
    setLoading(true);
    try {
      const [profileRes, postsRes, clipsRes, taggedRes] = await Promise.all([
        api.get(`/api/users/${resolvedUsername}`),
        api.get(`/api/users/${resolvedUsername}/posts`),
        api.get(`/api/users/${resolvedUsername}/clips`),
        api.get(`/api/users/${resolvedUsername}/tagged`),
      ]);
      setProfile(profileRes.data.user);
      setPosts(postsRes.data.posts);
      setClips(clipsRes.data.clips || []);
      setTaggedPosts(taggedRes.data.posts || []);
    } finally {
      setLoading(false);
    }
  }, [resolvedUsername]);

  useEffect(() => { load(); }, [load]);

  const handleFollow = async () => {
    if (!profile) return;
    if (profile.isFollowing || profile.followRequestPending) {
      await api.delete(`/api/users/follow/${profile.id}`);
    } else {
      await api.post(`/api/users/follow/${profile.id}`);
    }
    load();
  };

  const handleMessage = () => {
    if (!profile) return;
    navigate(`/messages?userId=${profile.id}&username=${encodeURIComponent(profile.username)}`);
  };

  const handleRequestChat = async () => {
    if (!profile) return;
    setMessageLoading(true);
    try {
      await api.post('/api/messages/chat-request', { recipientId: profile.id });
      load();
    } finally {
      setMessageLoading(false);
    }
  };

  const chat = profile?.chatAccess;
  const showRequestBtn = chat?.needsRequest && !chat?.pendingOutgoing;
  const showPending = chat?.pendingOutgoing || chat?.requestStatus === 'pending';
  const canMessage = chat?.canChat || chat?.isPublic;

  if (!resolvedUsername) {
    return <AppShell><div className="text-center py-20 text-gray-500">Please log in</div></AppShell>;
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (!profile) {
    return <AppShell><div className="text-center py-20 text-gray-500">User not found</div></AppShell>;
  }

  return (
    <AppShell>
      <div className="space-y-4 -mx-4 md:mx-0">
        {/* Cover */}
        <div className="relative h-40 md:h-48 bg-gradient-accent rounded-b-2xl overflow-hidden">
          {profile.cover && <img src={profile.cover} alt="" className="w-full h-full object-cover" />}
          {profile.isOwnProfile ? (
            <Link
              to="/settings"
              className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white active:scale-90 transition-transform"
            >
              <Settings className="w-5 h-5" />
            </Link>
          ) : currentUser ? (
            <div className="absolute top-3 right-3">
              <ProfileOptionsMenu userId={profile.id} username={profile.username} />
            </div>
          ) : null}
        </div>

        {/* Profile header */}
        <div className="px-4 -mt-14 relative">
          <div className="flex items-end gap-4">
            <Avatar
              src={profile.avatar}
              alt={profile.username}
              size="xl"
              className="border-4 border-white dark:border-surface-dark shadow-lg shrink-0"
            />
            <div className="flex-1 min-w-0 grid grid-cols-3 gap-1 rounded-2xl bg-gray-50/90 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 p-1">
              <StatBtn label="Posts" count={profile.stats.posts} onClick={() => setActiveTab('posts')} />
              <StatBtn label="Followers" count={profile.stats.followers} onClick={() => navigate(`/followers/${profile.username}`)} />
              <StatBtn label="Following" count={profile.stats.following} onClick={() => navigate(`/following/${profile.username}`)} />
            </div>
          </div>

          <div className="mt-4">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-1.5">
              {profile.username}
              {profile.isVerified && <span className="text-accent text-sm">✓</span>}
            </h1>
            {profile.bio ? (
              <p className="text-gray-600 dark:text-gray-400 mt-1.5 text-sm leading-relaxed whitespace-pre-line">{profile.bio}</p>
            ) : (
              <p className="text-gray-400 mt-1.5 text-sm italic">No bio yet</p>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            {profile.isOwnProfile ? (
              <>
                <Link to="/profile/edit" className="flex-1">
                  <Button variant="secondary" className="w-full" size="sm">Edit Profile</Button>
                </Link>
                <Link to="/settings">
                  <Button variant="secondary" size="sm"><Settings className="w-4 h-4" /></Button>
                </Link>
              </>
            ) : (
              <>
                <Button size="sm" className="flex-1" onClick={handleFollow}>
                  {profile.isFollowing
                    ? 'Following'
                    : profile.followRequestPending
                      ? 'Requested'
                      : <><UserPlus className="w-4 h-4" /> Follow</>}
                </Button>
                {showRequestBtn ? (
                  <Button size="sm" variant="secondary" onClick={handleRequestChat} loading={messageLoading}>
                    Request chat
                  </Button>
                ) : showPending && !canMessage ? (
                  <Button size="sm" variant="secondary" disabled>
                    Pending
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={handleMessage}>
                    <MessageCircle className="w-4 h-4" /> Message
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 px-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="px-4 space-y-4 pb-4">
          {activeTab === 'posts' && (
            posts.length === 0 ? (
              <EmptyState title="No posts yet" subtitle="Share your first post from the home feed" />
            ) : (
              posts.map((p) => <PostCard key={p.id} post={p} />)
            )
          )}

          {activeTab === 'clips' && (
            clips.length === 0 ? (
              <EmptyState
                title="No clips yet"
                subtitle={profile.isOwnProfile ? 'Upload a short video from the Clips tab' : 'No clips shared yet'}
                action={profile.isOwnProfile ? { label: 'Create a clip →', to: '/clips' } : { label: 'Explore Clips →', to: '/clips' }}
              />
            ) : (
              clips.map((clip) => <ClipCard key={clip.id} clip={clip} />)
            )
          )}

          {activeTab === 'tags' && (
            taggedPosts.length === 0 ? (
              <EmptyState
                title="No tags yet"
                subtitle="Posts where others mention you with @username will appear here"
              />
            ) : (
              taggedPosts.map((p) => <PostCard key={p.id} post={p} />)
            )
          )}
        </div>
      </div>
    </AppShell>
  );
}

function StatBtn({ label, count, onClick }: { label: string; count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center py-2.5 px-1 rounded-xl hover:bg-white/80 dark:hover:bg-gray-700/50 active:scale-[0.98] transition-all"
    >
      <span className="text-xl font-bold tabular-nums tracking-tight leading-none text-gray-900 dark:text-white">
        {formatCount(count)}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 mt-1.5">
        {label}
      </span>
    </button>
  );
}

function EmptyState({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: { label: string; to: string };
}) {
  return (
    <div className="text-center py-14 px-4">
      <p className="font-semibold text-base text-gray-700 dark:text-gray-300">{title}</p>
      <p className="text-sm text-gray-500 mt-1.5 max-w-xs mx-auto leading-relaxed">{subtitle}</p>
      {action && (
        <Link to={action.to} className="text-primary text-sm font-medium mt-3 inline-block hover:underline">
          {action.label}
        </Link>
      )}
    </div>
  );
}
