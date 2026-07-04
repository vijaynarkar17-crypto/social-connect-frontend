export type StoryMode = 'normal' | 'boomerang' | 'slomo' | 'collage' | 'effects';
export type StoryEffect = 'none' | 'vintage' | 'mono' | 'warm' | 'cool' | 'vivid' | 'fade';

export const STORY_MODES: { id: StoryMode; label: string; desc: string }[] = [
  { id: 'normal', label: 'Normal', desc: 'Photo story' },
  { id: 'boomerang', label: 'Boomerang', desc: 'Loop clip' },
  { id: 'slomo', label: 'Slo-mo', desc: 'Slow motion' },
  { id: 'collage', label: 'Collage', desc: 'Multi-shot grid' },
  { id: 'effects', label: 'Effects', desc: 'Filters & style' },
];

export const STORY_EFFECTS: { id: StoryEffect; label: string; filter: string }[] = [
  { id: 'none', label: 'Original', filter: 'none' },
  { id: 'vintage', label: 'Vintage', filter: 'sepia(0.45) contrast(1.1) brightness(1.05)' },
  { id: 'mono', label: 'B&W', filter: 'grayscale(1) contrast(1.15)' },
  { id: 'warm', label: 'Warm', filter: 'brightness(1.08) saturate(1.35) hue-rotate(-8deg)' },
  { id: 'cool', label: 'Cool', filter: 'brightness(1.05) saturate(1.2) hue-rotate(15deg)' },
  { id: 'vivid', label: 'Vivid', filter: 'saturate(1.6) contrast(1.12)' },
  { id: 'fade', label: 'Fade', filter: 'brightness(1.12) contrast(0.9) saturate(0.85)' },
];

export function getFilterForMode(mode: StoryMode, effect: StoryEffect): string {
  if (mode === 'effects' || effect !== 'none') {
    return STORY_EFFECTS.find((e) => e.id === effect)?.filter || 'none';
  }
  return 'none';
}

export async function buildCollageImage(sources: string[]): Promise<Blob> {
  const count = Math.min(sources.length, 4);
  const cols = count <= 1 ? 1 : 2;
  const rows = count <= 2 ? 1 : 2;
  const cellW = 540;
  const cellH = 960;
  const canvas = document.createElement('canvas');
  canvas.width = cellW * cols;
  canvas.height = cellH * rows;
  const ctx = canvas.getContext('2d')!;

  const load = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const images = await Promise.all(sources.slice(0, 4).map(load));
  images.forEach((img, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    ctx.drawImage(img, col * cellW, row * cellH, cellW, cellH);
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Collage failed'))), 'image/jpeg', 0.92);
  });
}
