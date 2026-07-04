import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LogOut, User, Moon, Sun, Lock, Eye, Bell, Shield, ChevronRight, RefreshCw, Bookmark,
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import api from '@/lib/api';
import { getApiError } from '@/lib/errors';

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [profileVisibility, setProfileVisibility] = useState(user?.privacy?.profileVisibility || 'public');
  const [storyVisibility, setStoryVisibility] = useState(
    (user?.privacy as { storyVisibility?: string })?.storyVisibility || 'friends'
  );
  const [onlineStatus, setOnlineStatus] = useState(user?.privacy?.onlineStatus || 'everyone');
  const [notifications, setNotifications] = useState(
    user?.notificationSettings || { likes: true, comments: true, follows: true, messages: true }
  );

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    try {
      await api.put('/api/users/me', {
        theme,
        privacy: { profileVisibility, storyVisibility, onlineStatus },
        notificationSettings: notifications,
      });
      await refreshUser();
      setMessage('Settings saved successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(getApiError(err, 'Failed to save'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSwitchAccount = () => {
    handleLogout();
  };

  if (!user) return null;

  return (
    <AppShell>
      <div className="space-y-5 pb-8">
        <h1 className="text-2xl font-bold">Settings</h1>

        {message && (
          <div className={`p-3 rounded-xl text-sm ${message.includes('success') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            {message}
          </div>
        )}

        {/* Account */}
        <section className="glass-card space-y-1 !p-0 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Account</p>
          </div>
          <Link to="/profile/edit" className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 active:bg-gray-100 transition-colors">
            <Avatar src={user.avatar} alt={user.username} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{user.username}</p>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>
          <SettingRow icon={User} label="Edit account" onClick={() => navigate('/profile/edit')} />
          <SettingLinkRow icon={Bookmark} label="Saved" to="/saved" description="Posts and videos you saved" />
          <SettingRow icon={RefreshCw} label="Switch account" onClick={handleSwitchAccount} />
        </section>

        {/* Appearance */}
        <section className="glass-card space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Appearance</p>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                theme === 'light' ? 'bg-primary bg-gradient-primary text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              <Sun className="w-4 h-4" /> Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                theme === 'dark' ? 'bg-primary bg-gradient-primary text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              <Moon className="w-4 h-4" /> Dark
            </button>
          </div>
        </section>

        {/* Privacy */}
        <section className="glass-card space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1"><Shield className="w-3 h-3" /> Privacy</p>
          <SelectRow
            icon={Lock}
            label="Profile visibility"
            value={profileVisibility}
            options={[
              { value: 'public', label: 'Public' },
              { value: 'friends', label: 'Friends only' },
              { value: 'private', label: 'Private' },
            ]}
            onChange={setProfileVisibility}
          />
          <SelectRow
            icon={Eye}
            label="Story visibility"
            value={storyVisibility}
            options={[
              { value: 'public', label: 'Public' },
              { value: 'friends', label: 'Friends only' },
              { value: 'private', label: 'Private' },
            ]}
            onChange={setStoryVisibility}
          />
          <SelectRow
            icon={Eye}
            label="Online status"
            value={onlineStatus}
            options={[
              { value: 'everyone', label: 'Everyone' },
              { value: 'friends', label: 'Friends' },
              { value: 'nobody', label: 'Nobody' },
            ]}
            onChange={setOnlineStatus}
          />
        </section>

        {/* Notifications */}
        <section className="glass-card space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1"><Bell className="w-3 h-3" /> Notifications</p>
          {(['likes', 'comments', 'follows', 'messages'] as const).map((key) => (
            <label key={key} className="flex items-center justify-between py-1 cursor-pointer active:opacity-70">
              <span className="text-sm capitalize">{key}</span>
              <input
                type="checkbox"
                checked={notifications[key]}
                onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                className="w-5 h-5 rounded accent-primary"
              />
            </label>
          ))}
        </section>

        <Button onClick={handleSave} loading={loading} className="w-full">Save Changes</Button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-red-200 dark:border-red-900 text-red-600 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-[0.98] transition-all"
        >
          <LogOut className="w-5 h-5" /> Log out
        </button>
      </div>
    </AppShell>
  );
}

function SettingRow({ icon: Icon, label, onClick }: { icon: typeof User; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 active:bg-gray-100 transition-colors text-left">
      <Icon className="w-5 h-5 text-gray-500" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </button>
  );
}

function SettingLinkRow({
  icon: Icon,
  label,
  to,
  description,
}: {
  icon: typeof User;
  label: string;
  to: string;
  description?: string;
}) {
  return (
    <Link to={to} className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 active:bg-gray-100 transition-colors text-left">
      <Icon className="w-5 h-5 text-gray-500" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </Link>
  );
}

function SelectRow({
  icon: Icon, label, value, options, onChange,
}: {
  icon: typeof Lock;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm">
        <Icon className="w-4 h-4 text-gray-500" />
        <span>{label}</span>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
