import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import Avatar from '@/components/ui/Avatar';
import api from '@/lib/api';

export default function FollowingPage() {
  const { username } = useParams<{ username: string }>();
  const [users, setUsers] = useState<{ username: string; avatar?: string; bio?: string }[]>([]);

  useEffect(() => {
    if (username) api.get(`/api/users/${username}/following`).then(({ data }) => setUsers(data.users));
  }, [username]);

  return (
    <AppShell>
      <div className="max-w-lg mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Following</h1>
        <div className="glass-card divide-y divide-gray-100 dark:divide-gray-800 !p-0">
          {users.map((u) => (
            <Link key={u.username} to={`/profile/${u.username}`} className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <Avatar src={u.avatar} alt={u.username} />
              <div><p className="font-medium">{u.username}</p>{u.bio && <p className="text-sm text-gray-500 truncate">{u.bio}</p>}</div>
            </Link>
          ))}
          {users.length === 0 && <p className="p-8 text-center text-gray-500">Not following anyone yet</p>}
        </div>
      </div>
    </AppShell>
  );
}
