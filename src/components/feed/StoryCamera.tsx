import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, Zap, Check, Camera, Image as ImageIcon, Clapperboard, Circle } from 'lucide-react';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import {
  STORY_MODES,
  STORY_EFFECTS,
  type StoryMode,
  type StoryEffect,
  getFilterForMode,
  buildCollageImage,
} from '@/lib/storyCamera';

export type CameraPurpose = 'story' | 'photo' | 'clip';

function modesForPurpose(purpose: CameraPurpose) {
  if (purpose === 'photo') {
    return STORY_MODES.filter((m) => ['normal', 'collage', 'effects'].includes(m.id));
  }
  if (purpose === 'clip') {
    return STORY_MODES.filter((m) => ['normal', 'boomerang', 'slomo', 'effects'].includes(m.id));
  }
  return STORY_MODES;
}

function purposeMeta(purpose: CameraPurpose) {
  if (purpose === 'photo') {
    return { title: 'Photo Post', shareLabel: 'Post Photo', postType: 'image' as const, folder: 'posts' };
  }
  if (purpose === 'clip') {
    return { title: 'Clip', shareLabel: 'Post Clip', postType: 'clip' as const, folder: 'clips' };
  }
  return { title: 'Story', shareLabel: 'Share Story', postType: 'story' as const, folder: 'stories' };
}

const PURPOSE_TABS: { id: CameraPurpose; label: string; icon: typeof Circle }[] = [
  { id: 'story', label: 'Story', icon: Circle },
  { id: 'photo', label: 'Photo', icon: ImageIcon },
  { id: 'clip', label: 'Clip', icon: Clapperboard },
];

interface StoryCameraProps {
  open: boolean;
  onClose: () => void;
  onPosted?: () => void;
  purpose?: CameraPurpose;
  onPurposeChange?: (purpose: CameraPurpose) => void;
}

export default function StoryCamera({
  open,
  onClose,
  onPosted,
  purpose = 'story',
  onPurposeChange,
}: StoryCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [activePurpose, setActivePurpose] = useState<CameraPurpose>(purpose);
  const [mode, setMode] = useState<StoryMode>('normal');
  const [effect, setEffect] = useState<StoryEffect>('none');
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const [preview, setPreview] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [collageShots, setCollageShots] = useState<string[]>([]);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);

  const meta = purposeMeta(activePurpose);
  const availableModes = modesForPurpose(activePurpose);
  const filter = getFilterForMode(mode, effect);
  const galleryAccept =
    activePurpose === 'clip' ? 'video/*' : activePurpose === 'photo' ? 'image/*' : 'image/*,video/*';

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: mode === 'boomerang' || mode === 'slomo',
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
    } catch {
      setError('Camera access denied. Allow camera permission in your browser settings.');
    }
  }, [facing, mode, stopCamera]);

  useEffect(() => {
    if (open && !preview) startCamera();
    if (!open) {
      stopCamera();
      setPreview(null);
      setCollageShots([]);
      setMode('normal');
      setEffect('none');
    }
    return () => stopCamera();
  }, [open, preview, startCamera, stopCamera]);

  useEffect(() => {
    if (open) setActivePurpose(purpose);
  }, [open, purpose]);

  useEffect(() => {
    if (open) {
      setMode('normal');
      setEffect('none');
    }
  }, [open, activePurpose]);

  const switchPurpose = (next: CameraPurpose) => {
    if (next === activePurpose) return;
    if (recording && recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
      setRecording(false);
    }
    setActivePurpose(next);
    onPurposeChange?.(next);
    setPreview(null);
    setCollageShots([]);
    setMode('normal');
    setEffect('none');
    setError('');
  };

  const openGallery = () => {
    galleryRef.current?.click();
  };

  const handleGalleryPick = (file: File) => {
    if (activePurpose === 'photo' && !file.type.startsWith('image/')) {
      setError('Please pick a photo for Photo post.');
      return;
    }
    if (activePurpose === 'clip' && !file.type.startsWith('video/')) {
      setError('Please pick a video for Clip.');
      return;
    }
    setError('');
    const url = URL.createObjectURL(file);
    setPreview({ url, type: file.type.startsWith('video/') ? 'video' : 'image' });
    stopCamera();
  };

  useEffect(() => {
    if (open && !preview) startCamera();
  }, [facing, mode, open, preview, startCamera]);

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    if (filter !== 'none') ctx.filter = filter;
    ctx.drawImage(video, 0, 0);
    const url = canvas.toDataURL('image/jpeg', 0.92);

    if (mode === 'collage') {
      const next = [...collageShots, url];
      setCollageShots(next);
      if (next.length >= 4) finishCollage(next);
      return;
    }
    setPreview({ url, type: 'image' });
    stopCamera();
  };

  const finishCollage = async (shots?: string[]) => {
    const list = shots || collageShots;
    if (list.length === 0) return;
    try {
      const blob = await buildCollageImage(list);
      const url = URL.createObjectURL(blob);
      setPreview({ url, type: 'image' });
      setCollageShots([]);
      stopCamera();
    } catch {
      setError('Could not build collage');
    }
  };

  const startRecording = (durationMs?: number) => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
    recorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setPreview({ url, type: 'video' });
      stopCamera();
    };
    recorder.start();
    setRecording(true);
    const duration =
      durationMs ?? (mode === 'boomerang' ? 2000 : activePurpose === 'clip' && mode === 'normal' ? 15000 : 4000);
    setTimeout(() => {
      if (recorder.state === 'recording') {
        recorder.stop();
        setRecording(false);
      }
    }, duration);
  };

  const handleCapture = () => {
    if (activePurpose === 'clip' && mode === 'normal') {
      if (!recording) startRecording(15000);
      return;
    }
    if (mode === 'boomerang' || mode === 'slomo') {
      if (!recording) startRecording();
      return;
    }
    capturePhoto();
  };

  const handlePost = async () => {
    if (!preview) return;
    setUploading(true);
    setError('');
    try {
      let file: File;
      if (preview.type === 'video') {
        const res = await fetch(preview.url);
        const blob = await res.blob();
        file = new File([blob], 'story.webm', { type: 'video/webm' });
      } else {
        const res = await fetch(preview.url);
        const blob = await res.blob();
        file = new File([blob], 'story.jpg', { type: 'image/jpeg' });
      }
      const form = new FormData();
      form.append('file', file);
      form.append('folder', meta.folder);
      const { data: upload } = await api.post('/api/posts/upload', form);
      await api.post('/api/posts', {
        type: meta.postType,
        content: '',
        media: [upload.url],
        storyEffect: activePurpose === 'story' ? (mode === 'effects' ? effect : mode) : undefined,
      });
      onPosted?.();
      onClose();
    } catch {
      setError('Failed to post. Try again.');
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: '100%' }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed inset-0 z-[100] bg-black flex flex-col"
      >
        <input
          ref={galleryRef}
          type="file"
          accept={galleryAccept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleGalleryPick(file);
            e.target.value = '';
          }}
        />

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-safe space-y-3">
          <div className="flex items-center justify-between">
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white">
              <X className="w-6 h-6" />
            </button>
            <span className="text-white font-semibold text-sm">{meta.title}</span>
            <button
              onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}
              className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Story / Photo / Clip tabs */}
          {!preview && (
            <div className="flex justify-center">
              <div className="flex gap-1 p-1 rounded-full bg-black/50 backdrop-blur border border-white/10">
                {PURPOSE_TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => switchPurpose(id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                      activePurpose === id
                        ? 'bg-white text-black shadow-md'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Preview or live camera */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center">
          {preview ? (
            preview.type === 'video' ? (
              <video
                src={preview.url}
                autoPlay
                loop={mode === 'boomerang'}
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ filter: mode === 'slomo' ? undefined : filter, animation: mode === 'boomerang' ? undefined : undefined }}
                ref={(el) => {
                  if (el && mode === 'slomo') el.playbackRate = 0.4;
                }}
              />
            ) : (
              <img src={preview.url} alt="Preview" className="w-full h-full object-cover" style={{ filter }} />
            )
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover mirror"
                style={{ filter, transform: facing === 'user' ? 'scaleX(-1)' : undefined }}
              />
              {!cameraReady && !error && (
                <div className="absolute inset-0 flex items-center justify-center text-white/70">
                  <Camera className="w-12 h-12 animate-pulse" />
                </div>
              )}
              {error && !preview && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
                  <Camera className="w-14 h-14 text-white/40" />
                  <p className="text-red-400 text-sm">{error}</p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium"
                  >
                    Retry camera
                  </button>
                </div>
              )}
            </>
          )}

          {mode === 'collage' && !preview && collageShots.length > 0 && (
            <div className="absolute top-32 left-4 right-4 flex gap-2">
              {collageShots.map((s, i) => (
                <img key={i} src={s} alt="" className="w-14 h-20 object-cover rounded-lg border-2 border-white" />
              ))}
              <button
                onClick={() => finishCollage()}
                className="w-14 h-20 rounded-lg bg-white/20 border-2 border-dashed border-white flex items-center justify-center text-white text-xs"
              >
                Done
              </button>
            </div>
          )}

          {recording && (
            <div className="absolute top-28 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-medium animate-pulse">
              Recording…
            </div>
          )}
        </div>

        {error && preview && (
          <p className="absolute bottom-48 left-4 right-4 text-center text-red-400 text-sm bg-black/60 rounded-xl py-2 px-3">
            {error}
          </p>
        )}

        {/* Mode selector */}
        {!preview && (
          <div className="absolute bottom-40 left-0 right-0 z-20">
            <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
              {availableModes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMode(m.id);
                    if (m.id !== 'effects') setEffect('none');
                  }}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                    mode === m.id ? 'bg-white text-black' : 'bg-white/20 text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {(mode === 'effects' || effect !== 'none') && (
              <div className="flex gap-2 overflow-x-auto px-4 pt-1 scrollbar-hide">
                {STORY_EFFECTS.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setEffect(e.id)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium ${
                      effect === e.id ? 'bg-primary text-black border border-black font-semibold' : 'bg-white/15 text-white'
                    }`}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Capture controls */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-6 pb-10 flex items-center justify-center gap-8">
          {preview ? (
            <>
              <button
                onClick={() => {
                  setPreview(null);
                  setCollageShots([]);
                  startCamera();
                }}
                className="text-white text-sm font-medium px-4 py-2 rounded-full bg-white/20"
              >
                Retake
              </button>
              <Button onClick={handlePost} loading={uploading} className="px-8">
                <Check className="w-5 h-5" /> {meta.shareLabel}
              </Button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={openGallery}
                className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center text-white active:scale-90 transition-transform"
                aria-label="Upload from gallery"
                title={activePurpose === 'clip' ? 'Upload video' : activePurpose === 'photo' ? 'Upload photo' : 'Upload from gallery'}
              >
                <ImageIcon className="w-6 h-6" />
              </button>
              <button
                onClick={handleCapture}
                disabled={!cameraReady || recording}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50"
              >
                <div className={`w-16 h-16 rounded-full ${recording ? 'bg-red-500 animate-pulse' : 'bg-white'}`} />
              </button>
              <div className="w-12 flex justify-center">
                {mode === 'collage' && collageShots.length > 0 && (
                  <button onClick={() => finishCollage()} className="text-white text-xs">
                    <Zap className="w-6 h-6" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Swipe hint */}
        {!preview && (
          <p className="absolute bottom-2 left-0 right-0 text-center text-white/40 text-[10px] px-4">
            {activePurpose === 'clip' && mode === 'normal'
              ? 'Tap to record · up to 15s · or upload from gallery'
              : activePurpose === 'photo'
                ? 'Photo posts stay on your profile · gallery on the left'
                : 'Stories expire in 24h · switch tabs above for Photo or Clip'}
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
