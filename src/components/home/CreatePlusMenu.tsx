import { AnimatePresence, motion } from 'framer-motion';
import {
  X, Circle, Image as ImageIcon, Clapperboard, Sparkles, Upload, Camera,
} from 'lucide-react';

interface CreatePlusMenuProps {
  open: boolean;
  onClose: () => void;
  onStory: () => void;
  onPhotoCamera: () => void;
  onClipCamera: () => void;
  onUploadPhoto: () => void;
  onUploadClip: () => void;
  onDailyVibe: () => void;
}

const OPTIONS = [
  {
    id: 'story',
    label: 'Story',
    desc: 'Camera · 24h · all effects',
    icon: Circle,
    gradient: 'from-pink-500 to-orange-400',
    action: 'onStory' as const,
  },
  {
    id: 'photo',
    label: 'Photo',
    desc: 'Camera · permanent post',
    icon: Camera,
    gradient: 'from-emerald-500 to-teal-400',
    action: 'onPhotoCamera' as const,
  },
  {
    id: 'clip',
    label: 'Clip',
    desc: 'Camera · boomerang & slo-mo',
    icon: Clapperboard,
    gradient: 'from-violet-500 to-primary',
    action: 'onClipCamera' as const,
  },
  {
    id: 'upload-photo',
    label: 'Gallery',
    desc: 'Upload a photo',
    icon: ImageIcon,
    gradient: 'from-blue-500 to-cyan-400',
    action: 'onUploadPhoto' as const,
  },
  {
    id: 'upload-clip',
    label: 'Upload clip',
    desc: 'Pick video from gallery',
    icon: Upload,
    gradient: 'from-indigo-500 to-purple-400',
    action: 'onUploadClip' as const,
  },
  {
    id: 'vibe',
    label: 'Daily Vibe',
    desc: 'Text · auto-deletes 24h',
    icon: Sparkles,
    gradient: 'from-amber-500 to-pink-500',
    action: 'onDailyVibe' as const,
  },
];

export default function CreatePlusMenu({
  open,
  onClose,
  onStory,
  onPhotoCamera,
  onClipCamera,
  onUploadPhoto,
  onUploadClip,
  onDailyVibe,
}: CreatePlusMenuProps) {
  const handlers = {
    onStory,
    onPhotoCamera,
    onClipCamera,
    onUploadPhoto,
    onUploadClip,
    onDailyVibe,
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-label="Close create menu"
          />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed left-1/2 bottom-20 z-[91] w-[min(100%-2rem,420px)] -translate-x-1/2 rounded-2xl bg-white dark:bg-surface-card-dark shadow-2xl border border-gray-200/70 dark:border-gray-700/70 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-sm">Create</h2>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 grid grid-cols-2 gap-2">
              {OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      handlers[opt.action]();
                      onClose();
                    }}
                    className="flex items-start gap-3 p-3 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 active:scale-[0.98] transition-all border border-gray-100 dark:border-gray-800"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${opt.gradient} flex items-center justify-center shrink-0 shadow-md`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{opt.label}</p>
                      <p className="text-[11px] text-gray-500 leading-tight mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="px-4 pb-3 text-[10px] text-gray-400 text-center">
              Story & clip camera include Normal, Boomerang, Slo-mo, Collage & Effects
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
