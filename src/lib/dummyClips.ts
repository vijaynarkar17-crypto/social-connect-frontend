import type { Clip } from '@/components/clips/ClipCard';

/** Sample vertical-style clips when the API feed is empty or unavailable */
export const DUMMY_CLIPS: Clip[] = [
  {
    id: 'demo-1',
    content: 'Sunset vibes 🌅 #travel #clips',
    media: ['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'],
    likeCount: 1240,
    commentCount: 89,
    shareCount: 34,
    isLiked: false,
    createdAt: new Date().toISOString(),
    author: { username: 'omu', isVerified: true },
  },
  {
    id: 'demo-2',
    content: 'Weekend mood ✨ Tap like if you feel it!',
    media: ['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'],
    likeCount: 892,
    commentCount: 56,
    shareCount: 21,
    isLiked: true,
    createdAt: new Date().toISOString(),
    author: { username: 'vijay', isVerified: false },
  },
  {
    id: 'demo-3',
    content: 'New clip drop 🎬 #socialconnect',
    media: ['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'],
    likeCount: 2103,
    commentCount: 142,
    shareCount: 67,
    isLiked: false,
    createdAt: new Date().toISOString(),
    author: { username: 'demo_user', isVerified: false },
  },
  {
    id: 'demo-4',
    content: 'POV: scrolling clips all day 📱',
    media: ['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'],
    likeCount: 567,
    commentCount: 31,
    shareCount: 12,
    isLiked: false,
    createdAt: new Date().toISOString(),
    author: { username: 'omu', isVerified: true },
  },
  {
    id: 'demo-5',
    content: 'Swipe up for next · Pull down to refresh ↓',
    media: ['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4'],
    likeCount: 445,
    commentCount: 28,
    shareCount: 9,
    isLiked: false,
    createdAt: new Date().toISOString(),
    author: { username: 'vijay', isVerified: false },
  },
  {
    id: 'demo-6',
    content: 'Demo clip — upload yours with the + button',
    media: ['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'],
    likeCount: 320,
    commentCount: 18,
    shareCount: 5,
    isLiked: false,
    createdAt: new Date().toISOString(),
    author: { username: 'socialconnect', isVerified: true },
  },
];

export function isDemoClip(id: string) {
  return id.startsWith('demo-');
}

export function withDemoFallback(clips: Clip[]): Clip[] {
  const valid = clips.filter((c) => c.media?.[0]);
  return valid.length > 0 ? valid : DUMMY_CLIPS;
}

export function hasDemoClips(clips: Clip[]) {
  return clips.some((c) => isDemoClip(c.id));
}
