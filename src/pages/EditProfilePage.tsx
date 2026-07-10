import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import ChatBox from '@/components/ui/ChatBox';
import { useAuth } from '@/context/AuthContext';
import api, { uploadFile, resolveAssetUrl } from '@/lib/api';

export default function EditProfilePage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [cover, setCover] = useState(user?.cover || '');
  const [loading, setLoading] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/api/users/me', { bio, avatar, cover });
      await refreshUser();
      navigate(`/profile/${user?.username}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Edit Profile</h1>
        <div className="glass-card space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Profile Picture</label>
            <div className="flex items-center gap-4">
              <Avatar src={avatar} alt={user?.username || ''} size="lg" />
              <Button size="sm" variant="secondary" onClick={() => avatarRef.current?.click()}>Change</Button>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setAvatar(await uploadFile(f, 'avatars')); }} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Cover Image</label>
            {cover && (
              <div className="mb-3 h-32 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                  src={resolveAssetUrl(cover)}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}
            <Button size="sm" variant="secondary" onClick={() => coverRef.current?.click()}>Change Cover</Button>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              If your photo disappeared after deploy, upload it again — files are now saved permanently.
            </p>
            <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setCover(await uploadFile(f, 'covers')); }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <ChatBox
              value={bio}
              onChange={setBio}
              placeholder="Tell us about yourself..."
              multiline
              rows={3}
            />
          </div>
          <Button onClick={handleSave} loading={loading} className="w-full">Save Changes</Button>
        </div>
      </div>
    </AppShell>
  );
}
