import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './store';

export const selectAuthUser = (state: RootState) => state.auth.user;
export const selectAuthLoading = (state: RootState) => state.auth.loading;

export const selectFeed = (state: RootState) => state.content.feed;
export const selectClips = (state: RootState) => state.content.clips;

export const selectFeedCount = createSelector(selectFeed, (feed) => feed.length);
export const selectClipsCount = createSelector(selectClips, (clips) => clips.length);

const selectProfileMap = (state: RootState) => state.profile.byUsername;
const selectRefreshingMap = (state: RootState) => state.profile.refreshing;

/**
 * Memoized profile selectors keyed by username. Using a factory keeps each
 * mounted ProfilePage instance's selector cache isolated so lookups stay O(1)
 * and referentially stable across unrelated store updates.
 */
export const makeSelectProfile = (username: string) => {
  const key = username.toLowerCase();
  return createSelector(selectProfileMap, (map) => map[key]);
};

export const makeSelectProfileRefreshing = (username: string) => {
  const key = username.toLowerCase();
  return createSelector(selectRefreshingMap, (map) => !!map[key]);
};
