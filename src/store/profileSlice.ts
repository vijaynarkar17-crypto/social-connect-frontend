import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Post } from '@/components/feed/PostCard';
import type { Clip } from '@/components/clips/ClipCard';

export interface ChatAccess {
  canChat: boolean;
  needsRequest: boolean;
  requestStatus: string;
  isPublic: boolean;
  pendingOutgoing?: boolean;
}

export interface ProfileUser {
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

export interface CachedProfile {
  user: ProfileUser;
  posts: Post[];
  clips: Clip[];
  taggedPosts: Post[];
  fetchedAt: number;
}

interface ProfileState {
  byUsername: Record<string, CachedProfile>;
  refreshing: Record<string, boolean>;
}

const initialState: ProfileState = {
  byUsername: {},
  refreshing: {},
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setCachedProfile(
      state,
      action: PayloadAction<{
        username: string;
        user: ProfileUser;
        posts: Post[];
        clips: Clip[];
        taggedPosts: Post[];
      }>
    ) {
      const key = action.payload.username.toLowerCase();
      state.byUsername[key] = {
        user: action.payload.user,
        posts: action.payload.posts,
        clips: action.payload.clips,
        taggedPosts: action.payload.taggedPosts,
        fetchedAt: Date.now(),
      };
      state.refreshing[key] = false;
    },
    setProfileRefreshing(state, action: PayloadAction<{ username: string; refreshing: boolean }>) {
      const key = action.payload.username.toLowerCase();
      state.refreshing[key] = action.payload.refreshing;
    },
    removeProfileClip(state, action: PayloadAction<{ username: string; clipId: string }>) {
      const key = action.payload.username.toLowerCase();
      const cached = state.byUsername[key];
      if (!cached) return;
      cached.clips = cached.clips.filter((clip) => clip.id !== action.payload.clipId);
      cached.user.stats.posts = Math.max(0, cached.user.stats.posts - 1);
    },
    clearProfiles(state) {
      state.byUsername = {};
      state.refreshing = {};
    },
  },
});

export const { setCachedProfile, setProfileRefreshing, removeProfileClip, clearProfiles } =
  profileSlice.actions;
export default profileSlice.reducer;
