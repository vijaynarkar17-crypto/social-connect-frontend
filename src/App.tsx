import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ProtectedRoute, GuestRoute } from '@/components/ProtectedRoute';
import LoadingScreen from '@/components/ui/LoadingScreen';
import LandingPage from '@/pages/LandingPage';

const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const OtpPage = lazy(() => import('@/pages/OtpPage'));
const MainHubPage = lazy(() => import('@/pages/MainHubPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const EditProfilePage = lazy(() => import('@/pages/EditProfilePage'));
const FollowersPage = lazy(() => import('@/pages/FollowersPage'));
const FollowingPage = lazy(() => import('@/pages/FollowingPage'));
const SavedPage = lazy(() => import('@/pages/SavedPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const FollowRequestPage = lazy(() => import('@/pages/FollowRequestPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingScreen />}>
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
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
