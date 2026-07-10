import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import ChatBox from '@/components/ui/ChatBox';
import { useAuth } from '@/context/AuthContext';
import api, { uploadProfileImage, resolveAssetUrl } from '@/lib/api';

export default function EditProfilePage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [cover, setCover] = useState(user?.cover || '');
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadError, setUploadError] = useState('');
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

  const handleAvatarUpload = async (file: File) => {
    setUploadingAvatar(true);
    setUploadError('');
    try {
      const { url } = await uploadProfileImage(file, 'avatar');
      setAvatar(url);
      await refreshUser();
    } catch {
      setUploadError('Could not save profile photo. Try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true);
    setUploadError('');
    try {
      const { url } = await uploadProfileImage(file, 'cover');
      setCover(url);
      await refreshUser();
    } catch {
      setUploadError('Could not save cover photo. Try again.');
    } finally {
      setUploadingCover(false);
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
              <Button
                size="sm"
                variant="secondary"
                loading={uploadingAvatar}
                onClick={() => avatarRef.current?.click()}
              >
                {uploadingAvatar ? 'Saving…' : 'Change'}
              </Button>
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) await handleAvatarUpload(f);
                  e.target.value = '';
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Saved permanently in the database (survives redeploys).
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Cover Image</label>
            <div className="mb-3 h-32 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
              {cover && resolveAssetUrl(cover) ? (
                <img
                  src={resolveAssetUrl(cover)}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-accent flex items-center justify-center text-white/80 text-xs">
                  No cover yet — tap Change Cover
                </div>
              )}
            </div>
            <Button
              size="sm"
              variant="secondary"
              loading={uploadingCover}
              onClick={() => coverRef.current?.click()}
            >
              {uploadingCover ? 'Saving…' : 'Change Cover'}
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Saved permanently in the database (survives redeploys).
            </p>
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) await handleCoverUpload(f);
                e.target.value = '';
              }}
            />
          </div>
          {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
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
