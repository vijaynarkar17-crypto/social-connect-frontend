import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ProtectedRoute, GuestRoute } from '@/components/ProtectedRoute';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import OtpPage from '@/pages/OtpPage';
import MainHubPage from '@/pages/MainHubPage';
import ProfilePage from '@/pages/ProfilePage';
import EditProfilePage from '@/pages/EditProfilePage';
import FollowersPage from '@/pages/FollowersPage';
import FollowingPage from '@/pages/FollowingPage';
import SavedPage from '@/pages/SavedPage';
import SettingsPage from '@/pages/SettingsPage';
import SearchPage from '@/pages/SearchPage';
import NotificationsPage from '@/pages/NotificationsPage';
import FollowRequestPage from '@/pages/FollowRequestPage';
import NotFoundPage from '@/pages/NotFoundPage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/otp" element={<OtpPage />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/home" element={<MainHubPage />} />
              <Route path="/messages" element={<MainHubPage />} />
              <Route path="/clips" element={<MainHubPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/profile/edit" element={<EditProfilePage />} />
              <Route path="/profile/:username" element={<ProfilePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/followers/:username" element={<FollowersPage />} />
              <Route path="/following/:username" element={<FollowingPage />} />
              <Route path="/saved" element={<SavedPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/notifications/follow/:userId" element={<FollowRequestPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
