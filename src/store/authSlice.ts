import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  cover?: string;
  bio?: string;
  links?: string[];
  theme?: 'light' | 'dark';
  isVerified?: boolean;
  privacy?: { profileVisibility: string; onlineStatus: string; storyVisibility?: string };
  notificationSettings?: { likes: boolean; comments: boolean; follows: boolean; messages: boolean };
}

interface AuthState {
  user: User | null;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
    },
    setAuthLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    clearAuth(state) {
      state.user = null;
      state.loading = false;
    },
  },
});

export const { setUser, setAuthLoading, clearAuth } = authSlice.actions;
export default authSlice.reducer;
