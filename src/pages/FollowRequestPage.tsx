import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { ArrowLeft, UserPlus, Users } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import api from '@/lib/api';

interface NotificationState {
  id: string;
  type: 'FOLLOW' | 'FOLLOW_REQUEST';
  message: string;
  followRequestPending?: boolean;
  actor?: { id: string; username: string; avatar?: string; isVerified?: boolean };
}

interface ProfilePreview {
  username: string;
  avatar?: string;
  bio?: string;
  isVerified?: boolean;
  isFollowing?: boolean;
  stats?: { followers: number; following: number; posts: number };
}

export default function FollowRequestPage() {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const username = searchParams.get('username') || '';
  const notificationId = searchParams.get('notificationId') || '';
  const mode = searchParams.get('type') === 'follow' ? 'follow' : 'request';
  const notification = (location.state as { notification?: NotificationState } | null)?.notification;

  const [profile, setProfile] = useState<ProfilePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<'accept' | 'back' | 'follow' | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }
    api
      .get(`/api/users/${username}`)
      .then(({ data }) => {
        setProfile({
          username: data.user.username,
          avatar: data.user.avatar,
          bio: data.user.bio,
          isVerified: data.user.isVerified,
          isFollowing: data.user.isFollowing,
          stats: data.user.stats,
        });
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [username]);

  const markRead = async () => {
    if (!notificationId) return;
    try {
      await api.post(`/api/notifications/${notificationId}/read`);
    } catch {
      // ignore
    }
  };

  const goToProfile = async () => {
    await markRead();
    if (username) navigate(`/profile/${username}`);
    else navigate('/notifications');
  };

  const acceptRequest = async (followBack: boolean) => {
    if (!userId) return;
    setActionLoading(followBack ? 'back' : 'accept');
    try {
      const endpoint = followBack
        ? `/api/users/follow-requests/${userId}/follow-back`
        : `/api/users/follow-requests/${userId}/accept`;
      await api.post(endpoint);
      await markRead();
      setDone(true);
      setTimeout(() => navigate(username ? `/profile/${username}` : '/notifications'), 1200);
    } finally {
      setActionLoading(null);
    }
  };

  const followBack = async () => {
    if (!userId) return;
    setActionLoading('follow');
    try {
      await api.post(`/api/users/follow/${userId}`);
      await markRead();
      setDone(true);
      setProfile((p) => (p ? { ...p, isFollowing: true } : p));
      setTimeout(() => navigate(username ? `/profile/${username}` : '/notifications'), 1200);
    } finally {
      setActionLoading(null);
    }
  };

  const isRequest = mode === 'request' || notification?.type === 'FOLLOW_REQUEST';
  const title = isRequest ? 'Follow request' : 'New follower';
  const subtitle = isRequest
    ? `${username || 'This user'} wants to follow you`
    : `${username || 'This user'} started following you`;

  return (
    <AppShell>
      <div className="max-w-md mx-auto space-y-4">
        <button
          type="button"
          onClick={() => navigate('/notifications')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to notifications
        </button>

        <div className="glass-card p-6 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            {isRequest ? (
              <UserPlus className="w-7 h-7 text-primary" />
            ) : (
              <Users className="w-7 h-7 text-primary" />
            )}
          </div>

          <div>
            <h1 className="text-xl font-bold">{title}</h1>
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : profile ? (
            <>
              <Link to={`/profile/${profile.username}`} className="inline-block">
                <Avatar src={profile.avatar} alt={profile.username} size="xl" className="mx-auto border-4 border-white dark:border-surface-card-dark shadow-lg" />
              </Link>
              <div>
                <p className="font-semibold text-lg">{profile.username}</p>
                {profile.bio && <p className="text-sm text-gray-500 mt-1">{profile.bio}</p>}
                {profile.stats && (
                  <p className="text-xs text-gray-400 mt-2">
                    {profile.stats.posts} posts · {profile.stats.followers} followers
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">Could not load profile</p>
          )}

          {done ? (
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Done! Redirecting…</p>
          ) : isRequest ? (
            <div className="space-y-3 pt-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose how you want to respond:
              </p>
              <Button
                className="w-full"
                onClick={() => acceptRequest(false)}
                loading={actionLoading === 'accept'}
                disabled={!!actionLoading}
              >
                Accept
              </Button>
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => acceptRequest(true)}
                loading={actionLoading === 'back'}
                disabled={!!actionLoading}
              >
                Accept &amp; follow back
              </Button>
              <Button className="w-full" variant="ghost" onClick={goToProfile} disabled={!!actionLoading}>
                View profile
              </Button>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Would you like to follow them back?
              </p>
              {!profile?.isFollowing ? (
                <Button
                  className="w-full"
                  onClick={followBack}
                  loading={actionLoading === 'follow'}
                  disabled={!!actionLoading}
                >
                  Follow back
                </Button>
              ) : (
                <p className="text-sm text-gray-500">You already follow {profile?.username}</p>
              )}
              <Button className="w-full" variant="secondary" onClick={goToProfile} disabled={!!actionLoading}>
                View profile
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
