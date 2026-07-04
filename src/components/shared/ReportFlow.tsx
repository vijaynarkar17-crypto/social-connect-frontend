import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, Flag, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { REPORT_REASONS, type ReportReasonId, getReportReason } from '@/lib/reportReasons';

interface ReportFlowProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (reason: ReportReasonId, description: string) => Promise<void>;
}

export default function ReportFlow({ open, title, onClose, onSubmit }: ReportFlowProps) {
  const [step, setStep] = useState<'reason' | 'details' | 'done'>('reason');
  const [reason, setReason] = useState<ReportReasonId>('spam');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setStep('reason');
    setReason('spam');
    setDescription('');
    setLoading(false);
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const pickReason = (id: ReportReasonId) => {
    setReason(id);
    setStep('details');
    setError('');
  };

  const submit = async () => {
    if (description.trim().length < 10) {
      setError('Please write at least 10 characters explaining why.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSubmit(reason, description.trim());
      setStep('done');
      window.setTimeout(handleClose, 1400);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setStep('done');
        window.setTimeout(handleClose, 1400);
      } else {
        setError('Could not submit. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const selected = getReportReason(reason);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
            aria-label="Close report"
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            className="fixed left-1/2 top-1/2 z-[131] w-[min(100%-2rem,400px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white dark:bg-surface-card-dark shadow-2xl border border-gray-200/70 dark:border-gray-700/70 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                {step === 'details' && (
                  <button
                    type="button"
                    onClick={() => setStep('reason')}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    disabled={loading}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <Flag className="w-4 h-4 text-red-500" />
                <h2 className="font-semibold text-sm">{title}</h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4">
              {step === 'reason' && (
                <>
                  <p className="text-sm text-gray-500 mb-3">Why are you reporting this?</p>
                  <div className="space-y-2">
                    {REPORT_REASONS.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => pickReason(r.id)}
                        className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                      >
                        <p className="font-semibold text-sm">{r.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{r.hint}</p>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {step === 'details' && (
                <>
                  <div className="mb-3 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40">
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400">{selected.label}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{selected.hint}</p>
                  </div>
                  <label className="block text-sm font-medium mb-1.5">
                    Why is this {selected.label.toLowerCase()}?
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setError('');
                    }}
                    placeholder={selected.placeholder}
                    rows={4}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border-0 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                    autoFocus
                  />
                  {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
                  <p className="text-[11px] text-gray-400 mt-2">
                    Your report will be reviewed by our admin team.
                  </p>
                  <Button className="w-full mt-4" onClick={submit} loading={loading}>
                    Submit report
                  </Button>
                </>
              )}

              {step === 'done' && (
                <div className="py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="font-semibold text-sm">Report submitted</p>
                  <p className="text-xs text-gray-500 mt-1">An admin will review this soon.</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
