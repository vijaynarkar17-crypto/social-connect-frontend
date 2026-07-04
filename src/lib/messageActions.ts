import api from '@/lib/api';
import { isGifUrl } from '@/lib/messageContent';
import type { ChatMessageData } from '@/components/messages/ChatMessageBubble';

export async function postMessageAsStory(message: ChatMessageData): Promise<void> {
  const text = message.content.trim();
  const sharedMedia = message.sharedPost?.media?.[0];

  if (sharedMedia) {
    await api.post('/api/posts', {
      type: 'story',
      content: text,
      media: [sharedMedia],
      storyEffect: 'normal',
    });
    return;
  }

  const gifMatch = text.match(/^https?:\/\/\S+$/i);
  if (gifMatch && isGifUrl(gifMatch[0])) {
    await api.post('/api/posts', {
      type: 'story',
      content: '',
      media: [gifMatch[0]],
      storyEffect: 'normal',
    });
    return;
  }

  await api.post('/api/posts', {
    type: 'story',
    content: text,
    media: [],
    storyEffect: 'normal',
  });
}
