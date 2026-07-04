import { Link } from 'react-router-dom';

export function renderContentWithMentions(content: string) {
  const parts = content.split(/(@[a-zA-Z0-9_]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      const username = part.slice(1);
      return (
        <Link key={i} to={`/profile/${username}`} className="text-primary font-medium hover:underline">
          {part}
        </Link>
      );
    }
    return part;
  });
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}
