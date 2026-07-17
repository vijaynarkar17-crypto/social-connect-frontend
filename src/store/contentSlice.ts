import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Post } from '@/components/feed/PostCard';
import type { Clip } from '@/components/clips/ClipCard';

interface ContentState {
  feed: Post[];
  clips: Clip[];
}

const initialState: ContentState = {
  feed: [],
  clips: [],
};

const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {
    setFeed(state, action: PayloadAction<Post[]>) {
      state.feed = action.payload;
    },
    appendFeed(state, action: PayloadAction<Post[]>) {
      const existing = new Set(state.feed.map((post) => post.id));
      state.feed.push(...action.payload.filter((post) => !existing.has(post.id)));
    },
    upsertFeedPost(state, action: PayloadAction<Post>) {
      state.feed = [
        action.payload,
        ...state.feed.filter((post) => post.id !== action.payload.id),
      ];
    },
    removeFeedPost(state, action: PayloadAction<string>) {
      state.feed = state.feed.filter((post) => post.id !== action.payload);
    },
    setClips(state, action: PayloadAction<Clip[]>) {
      state.clips = action.payload;
    },
    removeClip(state, action: PayloadAction<string>) {
      state.clips = state.clips.filter((clip) => clip.id !== action.payload);
    },
    clearContent(state) {
      state.feed = [];
      state.clips = [];
    },
  },
});

export const {
  setFeed,
  appendFeed,
  upsertFeedPost,
  removeFeedPost,
  setClips,
  removeClip,
  clearContent,
} = contentSlice.actions;
export default contentSlice.reducer;
